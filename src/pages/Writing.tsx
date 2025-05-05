import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/stores/auth.store"
import { toast } from "sonner"
import { Loader2, Volume2 } from "lucide-react"

interface Word {
  id: string
  original: string
  translation: string
  pronunciation?: string
}

export default function Writing() {
  const { listId } = useParams()
  const { user } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [words, setWords] = useState<Word[]>([])
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [userInput, setUserInput] = useState("")
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [showTranslation, setShowTranslation] = useState(false)

  useEffect(() => {
    const fetchWords = async () => {
      try {
        if (!user) return

        const query = supabase
          .from('words')
          .select('id, original, translation, pronunciation')
        
        if (listId) {
          query.eq('list_id', listId)
        } else {
          query.eq('user_id', user.id)
        }

        const { data, error } = await query

        if (error) throw error
        if (!data?.length) {
          toast.error("No words found for practice")
          return
        }

        // Shuffle the words array
        const shuffledWords = [...data].sort(() => Math.random() - 0.5)
        setWords(shuffledWords)
      } catch (error) {
        console.error('Error fetching words:', error)
        toast.error('Failed to load words')
      } finally {
        setIsLoading(false)
      }
    }

    fetchWords()
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
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!words.length) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold mb-2">No Words Available</h2>
        <p className="text-muted-foreground">
          Please add words to your vocabulary list to practice writing.
        </p>
      </div>
    )
  }

  if (currentWordIndex >= words.length) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Practice Complete!</CardTitle>
          <CardDescription>
            You wrote {score} out of {words.length} words correctly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <p className="text-3xl font-bold mb-4">
              {Math.round((score / words.length) * 100)}%
            </p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const currentWord = words[currentWordIndex]

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-muted-foreground">
            Word {currentWordIndex + 1} of {words.length}
          </span>
          <span className="text-sm text-muted-foreground">
            Score: {score}
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
              placeholder="Type the word in English"
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
        <CardFooter className="flex flex-col items-stretch gap-4">
          {isAnswerSubmitted ? (
            <>
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
              <Button onClick={handleNextWord}>
                Next Word
              </Button>
            </>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!userInput.trim()}
            >
              Check Answer
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
} 