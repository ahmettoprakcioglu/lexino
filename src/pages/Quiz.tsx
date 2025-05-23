import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { generateQuiz } from "@/lib/gemini"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/stores/auth.store"
import { toast } from "sonner"
import { Loader2, Brain, Plus } from "lucide-react"
import { addDays, startOfDay } from "date-fns"
import { Progress } from "@/components/ui/progress"

interface QuizQuestion {
  question: string
  options: string[]
  correctAnswer: string
  explanation: string
  wordId?: string
}

interface List {
  id: string
  name: string
}

interface QuizWord {
  id: string
  original: string
  translation: string
  learning_status: 'not_learned' | 'learning' | 'learned'
  ease_factor: number
  review_interval: number
  review_count: number
  streak_count: number
  best_streak: number
  last_practiced: string | null
  review_history: Array<{
    quality: number
    date: string
    interval: number
  }>
}

interface SpacedRepetitionParams {
  ease_factor: number
  review_interval: number
  review_count: number
  streak_count: number
  best_streak: number
  review_history: Array<{
    quality: number
    date: string
    interval: number
  }>
}

// Enhanced SuperMemo 2 Algorithm with advanced spacing and performance tracking
const calculateNextReview = (
  quality: 0 | 1 | 2 | 3 | 4 | 5,
  params: SpacedRepetitionParams
): {
  ease_factor: number
  review_interval: number
  streak_count: number
  best_streak: number
  review_history: Array<{
    quality: number
    date: string
    interval: number
  }>
} => {
  const {
    ease_factor,
    review_interval,
    review_count,
    streak_count,
    best_streak,
    review_history
  } = params

  // Calculate new ease factor with weighted recent performance
  const recentPerformance = review_history
    .slice(-5)
    .reverse()
    .reduce((acc, review, index) => {
      const weight = 1 / Math.pow(2, index) // More recent reviews have higher weight
      return acc + review.quality * weight
    }, 0) / review_history.slice(-5).reduce((acc, _, index) => acc + 1 / Math.pow(2, index), 0) || quality

  let newEaseFactor = ease_factor + (0.1 - (5 - recentPerformance) * (0.08 + (5 - recentPerformance) * 0.02))
  newEaseFactor = Math.max(1.3, Math.min(2.5, newEaseFactor)) // Keep ease factor between 1.3 and 2.5

  // Calculate streak changes with bonus for consistent high performance
  let newStreakCount = streak_count
  let newBestStreak = best_streak

  if (quality >= 4) {
    newStreakCount++
    if (newStreakCount > newBestStreak) {
      newBestStreak = newStreakCount
    }
  } else if (quality < 3) {
    newStreakCount = 0
  }

  // Calculate new interval with sophisticated spacing
  let newInterval
  if (quality < 3) {
    newInterval = 1 // Reset interval if quality is poor
  } else if (review_count === 0) {
    newInterval = 1
  } else if (review_count === 1) {
    newInterval = quality >= 4 ? 3 : 2 // Shorter interval for moderate performance
  } else {
    // Add performance-based randomization
    const performanceFactor = quality >= 4 ? 1.1 : quality === 3 ? 1.0 : 0.9
    const randomFactor = 0.95 + Math.random() * 0.1 // Random factor between 0.95 and 1.05
    const streakBonus = Math.min(streak_count * 0.05, 0.2) // Max 20% bonus from streak
    newInterval = Math.round(review_interval * newEaseFactor * performanceFactor * (1 + streakBonus) * randomFactor)
  }

  // Add the current review to history with enhanced tracking
  const newReviewHistory = [
    ...review_history,
    {
      quality,
      date: new Date().toISOString(),
      interval: newInterval
    }
  ].slice(-10) // Keep only last 10 reviews for performance

  return {
    ease_factor: newEaseFactor,
    review_interval: newInterval,
    streak_count: newStreakCount,
    best_streak: newBestStreak,
    review_history: newReviewHistory
  }
}

export default function Quiz() {
  const navigate = useNavigate()
  const { listId } = useParams()
  const { user } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [list, setList] = useState<List | null>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [quizLimit, setQuizLimit] = useState<number>(0)
  const [availableWordCount, setAvailableWordCount] = useState<number>(0)
  const DAILY_QUIZ_LIMIT = 5
  const MIN_QUIZ_WORDS = 5

  useEffect(() => {
    const fetchListAndQuizLimit = async () => {
      try {
        if (!user || !listId) return

        // Fetch list details
        const { data: listData, error: listError } = await supabase
          .from('lists')
          .select('id, name')
          .eq('id', listId)
          .eq('user_id', user.id)
          .single()

        if (listError) throw listError
        setList(listData)

        // Fetch available word count
        const { data: words, error: wordsError } = await supabase
          .from('words')
          .select('id')
          .eq('list_id', listId)
          .eq('user_id', user.id)

        if (wordsError) throw wordsError
        setAvailableWordCount(words?.length || 0)

        // Fetch quiz limit
        const today = new Date().toISOString().split('T')[0]
        const { data: existingLimit, error: limitError } = await supabase
          .from('quiz_limits')
          .select('quizzes_taken')
          .eq('user_id', user.id)
          .eq('date', today)
          .single()

        if (limitError) {
          if (limitError.code === 'PGRST116') {
            const { error: insertError } = await supabase
              .from('quiz_limits')
              .insert([{
                user_id: user.id,
                date: today,
                quizzes_taken: 0
              }])

            if (insertError) throw insertError
            setQuizLimit(0)
          } else {
            throw limitError
          }
        } else {
          setQuizLimit(existingLimit.quizzes_taken)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Failed to load quiz data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchListAndQuizLimit()
  }, [user, listId])

  const startQuiz = async () => {
    if (!listId || !user) return

    setIsGenerating(true)
    try {
      // Fetch all words with pagination
      const allWords: QuizWord[] = []
      let page = 0
      const pageSize = 1000
      
      while (true) {
        const { data: words, error } = await supabase
          .from('words')
          .select('id, original, translation, learning_status, ease_factor, review_interval, review_count, streak_count, best_streak, review_history, last_practiced')
          .eq('list_id', listId)
          .eq('user_id', user.id)
          .order('added_at', { ascending: true })
          .range(page * pageSize, (page + 1) * pageSize - 1)

        if (error) throw error
        if (!words || words.length === 0) break

        const wordsWithLastPracticed = words.map(word => ({
          ...word,
          last_practiced: word.last_practiced || null,
          review_history: word.review_history || []
        })) as QuizWord[]

        allWords.push(...wordsWithLastPracticed)
        if (words.length < pageSize) break
        page++
      }

      const now = new Date()
      const wordsForQuiz = allWords
        .filter(word => {
          if (!word.last_practiced) return true
          const lastPracticed = new Date(word.last_practiced)
          const daysElapsed = Math.floor((now.getTime() - lastPracticed.getTime()) / (1000 * 60 * 60 * 24))
          return daysElapsed >= (word.review_interval || 0)
        })
        .sort((a, b) => {
          if (a.learning_status === 'not_learned' && b.learning_status !== 'not_learned') return -1
          if (b.learning_status === 'not_learned' && a.learning_status !== 'not_learned') return 1
          const aEase = a.ease_factor || 2.5
          const bEase = b.ease_factor || 2.5
          if (aEase !== bEase) return aEase - bEase
          const aLastPracticed = a.last_practiced ? new Date(a.last_practiced).getTime() : 0
          const bLastPracticed = b.last_practiced ? new Date(b.last_practiced).getTime() : 0
          return aLastPracticed - bLastPracticed
        })

      // Take available words, up to 5
      const selectedWords = wordsForQuiz.slice(0, MIN_QUIZ_WORDS)

      try {
        // Generate quiz questions using Gemini
        const quizWords = selectedWords.map(w => ({
          original: w.original,
          translation: w.translation
        }))
        
        console.log('Sending words to generate quiz:', quizWords)
        const rawQuestions = await generateQuiz(quizWords)

        // Add wordId to each question, ensuring index is within bounds
        const questionsWithIds = rawQuestions.map((q: QuizQuestion, index: number) => ({
          ...q,
          wordId: index < selectedWords.length ? selectedWords[index].id : selectedWords[0].id
        }))

        // Update quiz limit
        const today = new Date().toISOString().split('T')[0]
        const { error: updateError } = await supabase
          .from('quiz_limits')
          .update({ quizzes_taken: quizLimit + 1 })
          .eq('user_id', user.id)
          .eq('date', today)

        if (updateError) {
          if (updateError.code === 'PGRST116') {
            const { error: insertError } = await supabase
              .from('quiz_limits')
              .insert([{
                user_id: user.id,
                date: today,
                quizzes_taken: 1
              }])

            if (insertError) throw insertError
          } else {
            throw updateError
          }
        }

        setQuizLimit(prev => prev + 1)
        setQuestions(questionsWithIds)
        setCurrentQuestionIndex(0)
      } catch (error) {
        console.error('Error in quiz setup:', error)
        toast.error('Failed to set up quiz. Please try again.')
      }
    } catch (error) {
      console.error('Error in quiz setup:', error)
      toast.error('Failed to set up quiz. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAnswerSelect = (answer: string) => {
    if (isAnswerSubmitted) return
    setSelectedAnswer(answer)
  }

  const handleSubmitAnswer = () => {
    if (!selectedAnswer || isAnswerSubmitted) return

    const currentQuestion = questions[currentQuestionIndex]
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer

    if (isCorrect) {
      setScore(prev => prev + 1)
    }

    setIsAnswerSubmitted(true)
  }

  const updateSpacedRepetition = async () => {
    try {
      setIsGenerating(true) // Reuse loading state for updating

      // Calculate quality scores for each question
      const updates = questions.map((question, index) => {
        const isCorrect = question.correctAnswer === answers[index]
        // Convert correctness to SM-2 quality score (0-5)
        // 5: Perfect response
        // 4: Correct response after a hesitation
        // 3: Correct response with difficulty
        // 2: Incorrect response; where the correct one seemed easy to recall
        // 1: Incorrect response; the correct one remembered
        // 0: Complete blackout
        const quality = isCorrect ? (5 as const) : (2 as const) // Type assertion to literal type

        return {
          wordId: question.wordId,
          quality
        }
      })

      // Update each word's spaced repetition data
      for (const update of updates) {
        const { data: word, error: fetchError } = await supabase
          .from('words')
          .select('*')
          .eq('id', update.wordId)
          .single()

        if (fetchError) continue

        // Calculate new spaced repetition parameters
        const {
          ease_factor,
          review_interval,
          streak_count,
          best_streak,
          review_history
        } = calculateNextReview(update.quality, {
          ease_factor: word.ease_factor || 2.5,
          review_interval: word.review_interval || 0,
          review_count: word.review_count || 0,
          streak_count: word.streak_count || 0,
          best_streak: word.best_streak || 0,
          review_history: word.review_history || []
        })

        // Calculate next review date
        const nextReviewDate = addDays(startOfDay(new Date()), review_interval)

        // Update learning status based on performance
        const recentSuccessRate = review_history
          .slice(-5)
          .filter(review => review.quality >= 4).length / Math.min(review_history.length, 5)

        let learning_status = word.learning_status
        if (update.quality >= 4 && word.review_count > 3 && recentSuccessRate >= 0.8) {
          learning_status = 'learned'
        } else if (update.quality < 3 || recentSuccessRate < 0.6) {
          learning_status = 'learning'
        }

        // Update word with new spaced repetition data
        await supabase
          .from('words')
          .update({
            ease_factor,
            review_interval,
            review_count: (word.review_count || 0) + 1,
            streak_count,
            best_streak,
            review_history,
            next_review_date: nextReviewDate.toISOString(),
            last_practiced: new Date().toISOString(),
            learning_status
          })
          .eq('id', update.wordId)
      }

      toast.success("Learning progress updated!")
    } catch (error) {
      console.error('Error updating learning progress:', error)
      toast.error('Failed to update learning progress')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleNextQuestion = () => {
    // Save the current answer
    setAnswers(prev => {
      const newAnswers = [...prev]
      newAnswers[currentQuestionIndex] = selectedAnswer || ''
      return newAnswers
    })

    setSelectedAnswer(null)
    setIsAnswerSubmitted(false)
    setCurrentQuestionIndex(prev => prev + 1)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Loading Quiz</CardTitle>
            <CardDescription>Please wait while we prepare your quiz</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!list) {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">List Not Found</CardTitle>
            <CardDescription>The list you're looking for doesn't exist or you don't have access to it.</CardDescription>
          </CardHeader>
          <CardContent className="text-center py-8">
            <Button onClick={() => navigate('/practice')}>
              Back to Practice
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (availableWordCount < 2) {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Not Enough Words</CardTitle>
            <CardDescription>You need at least 2 words in your list to start a quiz.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 py-4">
            <p className="text-center text-muted-foreground">
              Add more words to your list to start practicing with quizzes.
            </p>
            <div className="flex justify-center">
              <Button onClick={() => navigate(`/lists/${listId}`)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Words to List
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (availableWordCount < MIN_QUIZ_WORDS) {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Limited Words Available</CardTitle>
            <CardDescription>
              You have {availableWordCount} words in your list. Adding more words (at least {MIN_QUIZ_WORDS}) will create a better learning experience!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 py-4">
            <p className="text-center text-muted-foreground">
              Add more words to enhance your quiz experience and improve your learning journey.
            </p>
            <div className="flex justify-center">
              <Button onClick={() => navigate(`/lists/${listId}`)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add More Words
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!questions.length) {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Brain className="h-6 w-6" />
              Quiz: {list.name}
            </CardTitle>
            <CardDescription>
              Test your vocabulary knowledge with AI-generated questions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 py-4">
            <div className="space-y-4">
              {/* Quiz Limit Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Daily Quiz Limit</span>
                  <span>{quizLimit} / {DAILY_QUIZ_LIMIT}</span>
                </div>
                <Progress 
                  value={(quizLimit / DAILY_QUIZ_LIMIT) * 100} 
                  className="h-2"
                />
                {quizLimit >= DAILY_QUIZ_LIMIT && (
                  <p className="text-sm text-yellow-600 dark:text-yellow-500">
                    You've reached your daily quiz limit. Try again tomorrow!
                  </p>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={startQuiz} 
              disabled={isGenerating || quizLimit >= DAILY_QUIZ_LIMIT}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Quiz...
                </>
              ) : (
                'Start Quiz'
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (currentQuestionIndex >= questions.length) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Quiz Complete!</CardTitle>
          <CardDescription>
            You scored {score} out of {questions.length} questions correctly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <p className="text-3xl font-bold mb-4">
              {Math.round((score / questions.length) * 100)}%
            </p>
            <div className="space-y-4">
              <div className="space-x-4">
                <Button 
                  onClick={async () => {
                    await updateSpacedRepetition()
                    setQuestions([])
                    setCurrentQuestionIndex(0)
                    setScore(0)
                    setAnswers([])
                  }}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating Progress...
                    </>
                  ) : (
                    'Try Another Quiz'
                  )}
                </Button>
                <Button variant="outline" onClick={() => navigate('/practice')}>
                  Back to Practice
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]

  return (
    <div className="container mx-auto py-8 space-y-8 max-w-2xl">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-muted-foreground">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <span className="text-sm text-muted-foreground">
            Score: {score}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{
              width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`
            }}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{currentQuestion.question}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentQuestion.options.map((option, index) => (
            <Button
              key={index}
              variant={
                isAnswerSubmitted
                  ? option === currentQuestion.correctAnswer
                    ? "default"
                    : option === selectedAnswer
                    ? "destructive"
                    : "outline"
                  : selectedAnswer === option
                  ? "default"
                  : "outline"
              }
              className="w-full justify-start text-left"
              onClick={() => handleAnswerSelect(option)}
              disabled={isAnswerSubmitted}
            >
              {option}
            </Button>
          ))}
        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-4">
          {isAnswerSubmitted ? (
            <>
              <div className={`p-4 rounded-lg ${
                selectedAnswer === currentQuestion.correctAnswer
                  ? "bg-green-500/10 text-green-500"
                  : "bg-red-500/10 text-red-500"
              }`}>
                <p className="font-semibold mb-2">
                  {selectedAnswer === currentQuestion.correctAnswer
                    ? "Correct!"
                    : "Incorrect"}
                </p>
                <p className="text-sm">{currentQuestion.explanation}</p>
              </div>
              <Button onClick={handleNextQuestion}>
                Next Question
              </Button>
            </>
          ) : (
            <Button
              onClick={handleSubmitAnswer}
              disabled={!selectedAnswer}
            >
              Submit Answer
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
} 