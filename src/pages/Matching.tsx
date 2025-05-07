import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/stores/auth.store"
import { useMatchingStore } from "@/stores/matching.store"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface Word {
  id: string
  original: string
  translation: string
}

interface MatchingWord extends Word {
  isMatched: boolean
  isSelected: boolean
  matchColor?: string
  side: 'original' | 'translation'
}

// Define a set of distinct colors for matched pairs
const MATCH_COLORS = [
  'bg-blue-500/20 border-blue-500/50',
  'bg-green-500/20 border-green-500/50',
  'bg-purple-500/20 border-purple-500/50',
  'bg-orange-500/20 border-orange-500/50',
  'bg-pink-500/20 border-pink-500/50',
  'bg-teal-500/20 border-teal-500/50',
  'bg-yellow-500/20 border-yellow-500/50',
  'bg-red-500/20 border-red-500/50',
]

export default function Matching() {
  const navigate = useNavigate()
  const { listId } = useParams()
  const { user } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  
  const {
    words,
    score,
    attempts,
    gameComplete,
    selectedOriginal,
    selectedTranslation,
    setWords,
    setScore,
    setAttempts,
    setGameComplete,
    setSelectedOriginal,
    setSelectedTranslation,
    resetGame
  } = useMatchingStore()
  

  useEffect(() => {
    const fetchWords = async () => {
      // If we already have words, don't fetch new ones
      if (words.length > 0) {
        setIsLoading(false)
        return
      }

      try {
        if (!user) return

        const query = supabase
          .from('words')
          .select('id, original, translation')
        
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

        // Take 8 random words for the game and create separate objects for original and translation
        const shuffledWords = [...data]
          .sort(() => Math.random() - 0.5)
          .slice(0, 8)
          .flatMap(word => [
            {
              ...word,
              isMatched: false,
              isSelected: false,
              side: 'original' as const
            },
            {
              ...word,
              isMatched: false,
              isSelected: false,
              side: 'translation' as const
            }
          ])

        // Shuffle only the translations while keeping originals in order
        const originals = shuffledWords.filter(word => word.side === 'original');
        const translations = shuffledWords
          .filter(word => word.side === 'translation')
          .sort(() => Math.random() - 0.5);

        setWords([...originals, ...translations])
      } catch (error) {
        console.error('Error fetching words:', error)
        toast.error('Failed to load words')
      } finally {
        setIsLoading(false)
      }
    }

    fetchWords()
  }, [listId, user, words.length, setWords])

  const handleWordClick = (word: MatchingWord, isOriginal: boolean) => {
    if (word.isMatched) return

    const newWords = [...words]
    
    if (isOriginal) {
      // Deselect if already selected
      if (selectedOriginal?.id === word.id && selectedOriginal.side === 'original') {
        setSelectedOriginal(null)
        newWords.forEach(w => {
          if (w.id === word.id && w.side === 'original') {
            w.isSelected = false
          }
        })
      } else {
        // Deselect previous selection if exists
        if (selectedOriginal) {
          newWords.forEach(w => {
            if (w.id === selectedOriginal.id && w.side === 'original') {
              w.isSelected = false
            }
          })
        }
        // Select new word
        setSelectedOriginal(word)
        newWords.forEach(w => {
          if (w.id === word.id && w.side === 'original') {
            w.isSelected = true
          }
        })
      }
    } else {
      // Deselect if already selected
      if (selectedTranslation?.id === word.id && selectedTranslation.side === 'translation') {
        setSelectedTranslation(null)
        newWords.forEach(w => {
          if (w.id === word.id && w.side === 'translation') {
            w.isSelected = false
          }
        })
      } else {
        // Deselect previous selection if exists
        if (selectedTranslation) {
          newWords.forEach(w => {
            if (w.id === selectedTranslation.id && w.side === 'translation') {
              w.isSelected = false
            }
          })
        }
        // Select new word
        setSelectedTranslation(word)
        newWords.forEach(w => {
          if (w.id === word.id && w.side === 'translation') {
            w.isSelected = true
          }
        })
      }
    }
    
    setWords(newWords)
  }

  useEffect(() => {
    if (selectedOriginal && selectedTranslation) {
      setAttempts(attempts + 1)

      if (selectedOriginal.id === selectedTranslation.id) {
        // Correct match - assign a color to the matched pair
        const matchColor = MATCH_COLORS[score % MATCH_COLORS.length]
        setScore(score + 1)
        setWords(words.map(word => 
          word.id === selectedOriginal.id 
            ? { ...word, isMatched: true, isSelected: false, matchColor }
            : word
        ))
      } else {
        // Wrong match
        setTimeout(() => {
          setWords(words.map(word => 
            (word.id === selectedOriginal.id || word.id === selectedTranslation.id) 
              ? { ...word, isSelected: false }
              : word
          ))
        }, 1000)
        toast.error("Try again!")
      }

      setSelectedOriginal(null)
      setSelectedTranslation(null)
    }
  }, [selectedOriginal, selectedTranslation, words, score, attempts, setWords, setScore, setAttempts])

  useEffect(() => {
    // Check if all original words are matched
    const originalWords = words.filter(word => word.side === 'original')
    if (originalWords.length > 0 && originalWords.every(word => word.isMatched)) {
      setGameComplete(true)
    }
  }, [words, setGameComplete])

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (!words.length) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => navigate(`/lists/${listId}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to List
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>No Words Available</CardTitle>
            <CardDescription>
              Add some words to your list to start practicing!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate(`/lists/${listId}/add-word`)}>
              Add Your First Word
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (gameComplete) {
    // Calculate the actual percentage based on matched pairs vs total pairs
    const totalPairs = words.filter(word => word.side === 'original').length
    const scorePercentage = Math.round((score / totalPairs) * 100)

    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Congratulations!</CardTitle>
            <CardDescription>
              You've completed the matching game!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <p className="text-3xl font-bold">
                Score: {scorePercentage}%
              </p>
              <p className="text-muted-foreground">
                You made {attempts} attempts to match {totalPairs} pairs.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center gap-4">
            <Button 
              onClick={() => {
                resetGame()
                window.location.reload()
              }} 
              className="bg-primary hover:bg-primary/90"
            >
              Play Again
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                resetGame()
                navigate('/practice')
              }}
            >
              Back to Practice
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }


  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <Button 
            variant="ghost"
            onClick={() => navigate('/practice')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Practice
          </Button>
          <div className="text-sm text-muted-foreground">
            Matches: {score} / {words.length}
          </div>
        </div>
        <Progress value={(score / words.length) * 100} />
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Original Words */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold mb-4">Words</h2>
          <div className="grid gap-4">
            {words
              .filter(word => word.side === 'original')
              .map(word => (
                <Card
                  key={`original-${word.id}`}
                  className={`cursor-pointer transition-all relative ${
                    word.isMatched 
                      ? word.matchColor || 'opacity-50'
                      : word.isSelected
                      ? 'border-primary'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => !word.isMatched && handleWordClick(word, true)}
                >
                  <CardContent className="p-4">
                    <p className="text-center">{word.original}</p>
                    {word.isMatched && (
                      <div className="absolute right-2 top-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>

        {/* Translations */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold mb-4">Translations</h2>
          <div className="grid gap-4">
            {words
              .filter(word => word.side === 'translation')
              .map(word => (
                <Card
                  key={`translation-${word.id}`}
                  className={`cursor-pointer transition-all relative ${
                    word.isMatched 
                      ? word.matchColor || 'opacity-50'
                      : word.isSelected
                      ? 'border-primary'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => !word.isMatched && handleWordClick(word, false)}
                >
                  <CardContent className="p-4">
                    <p className="text-center">{word.translation}</p>
                    {word.isMatched && (
                      <div className="absolute right-2 top-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
} 