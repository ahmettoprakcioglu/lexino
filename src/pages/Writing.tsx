import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/stores/auth.store"
import { toast } from "sonner"
import { Loader2, Volume2, Plus, ArrowLeft } from "lucide-react"

interface Word {
  id: string
  original: string
  translation: string
  pronunciation?: string
}

export default function Writing() {
  const navigate = useNavigate()
  const { listId } = useParams()
  const { user } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [list, setList] = useState<{ id: string; name: string } | null>(null)
  const [availableWordCount, setAvailableWordCount] = useState<number>(0)
  const [words, setWords] = useState<Word[]>([])
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [userInput, setUserInput] = useState("")
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [showTranslation, setShowTranslation] = useState(false)
  const MIN_REQUIRED_WORDS = 5

  useEffect(() => {
    const fetchListAndWords = async () => {
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

        // Fetch words count
        const { data: wordsData, error: wordsError } = await supabase
          .from('words')
          .select('id')
          .eq('list_id', listId)
          .eq('user_id', user.id)

        if (wordsError) throw wordsError
        setAvailableWordCount(wordsData?.length || 0)

        // Only fetch words for practice if we have enough
        if (wordsData && wordsData.length >= MIN_REQUIRED_WORDS) {
          const { data: fullWords, error: fullWordsError } = await supabase
            .from('words')
            .select('id, original, translation, pronunciation')
            .eq('list_id', listId)
            .eq('user_id', user.id)

          if (fullWordsError) throw fullWordsError

          // Shuffle the words array
          const shuffledWords = [...fullWords].sort(() => Math.random() - 0.5)
          setWords(shuffledWords)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Failed to load writing practice data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchListAndWords()
  }, [listId, user])

  const handleSubmit = () => {
    if (!userInput.trim() || isAnswerSubmitted) return

    const currentWord = words[currentWordIndex]
    const isCorrect = userInput.toLowerCase().trim() === currentWord.original.toLowerCase().trim()

    if (isCorrect) {
      setScore(prev => prev + 1)
    }

    setIsAnswerSubmitted(true)
  }

  const handleNextWord = () => {
    setUserInput("")
    setIsAnswerSubmitted(false)
    setShowTranslation(false)
    setCurrentWordIndex(prev => prev + 1)
  }

  const speakWord = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text)
    window.speechSynthesis.speak(utterance)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Loading Writing Practice</CardTitle>
            <CardDescription>Please wait while we prepare your practice session</CardDescription>
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

  if (availableWordCount < MIN_REQUIRED_WORDS) {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Not Enough Words</CardTitle>
            <CardDescription>
              You need at least {MIN_REQUIRED_WORDS} words in your list to start writing practice. You currently have {availableWordCount} words.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 py-4">
            <p className="text-center text-muted-foreground">
              Add more words to start practicing with writing exercises.
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

  if (!words.length) {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Start Writing Practice</CardTitle>
            <CardDescription>Practice writing words from {list.name}</CardDescription>
          </CardHeader>
          <CardContent className="text-center py-8">
            <Button onClick={() => window.location.reload()}>
              Start Practice
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (currentWordIndex >= words.length) {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Practice Complete!</CardTitle>
            <CardDescription>
              You wrote {score} out of {words.length} words correctly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <p className="text-3xl font-bold mb-4">
                {Math.round((score / words.length) * 100)}%
              </p>
              <div className="flex justify-center gap-4">
                <Button onClick={() => window.location.reload()}>
                  Try Again
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/practice')}
                >
                  Back to Practice
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentWord = words[currentWordIndex]

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <Button 
            variant="ghost"
            onClick={() => navigate('/practice')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Practice
          </Button>
          <span className="text-sm text-muted-foreground">
            Score: {score} / {words.length}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{
              width: `${((currentWordIndex + 1) / words.length) * 100}%`
            }}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center justify-between">
            <span>{currentWord.translation}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => speakWord(currentWord.original)}
            >
              <Volume2 className="h-5 w-5" />
            </Button>
          </CardTitle>
          {currentWord.pronunciation && (
            <CardDescription>
              Pronunciation: {currentWord.pronunciation}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              placeholder="Type the translation"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSubmit()
                }
              }}
              disabled={isAnswerSubmitted}
              autoFocus
            />
            {!isAnswerSubmitted && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowTranslation(!showTranslation)}
              >
                {showTranslation ? "Hide Word" : "Show Word"}
              </Button>
            )}
            {showTranslation && !isAnswerSubmitted && (
              <p className="text-center text-muted-foreground">
                {currentWord.original}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          {isAnswerSubmitted ? (
            <div className="w-full space-y-4">
              <div className={`p-4 rounded-lg ${
                userInput.toLowerCase().trim() === currentWord.original.toLowerCase().trim()
                  ? "bg-green-500/10 text-green-500"
                  : "bg-red-500/10 text-red-500"
              }`}>
                <p className="font-semibold mb-2">
                  {userInput.toLowerCase().trim() === currentWord.original.toLowerCase().trim()
                    ? "Correct!"
                    : "Incorrect"}
                </p>
                <p className="text-sm">
                  The correct word is: {currentWord.original}
                </p>
              </div>
              <Button 
                onClick={handleNextWord}
                className="w-full"
              >
                Next Word
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleSubmit}
              className="w-full"
              disabled={!userInput.trim()}
            >
              Submit Answer
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
} 