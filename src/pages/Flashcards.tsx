import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/stores/auth.store"
import { toast } from "sonner"

interface Word {
  id: string
  original: string
  translation: string
  example: string | null
  pronunciation: string | null
  difficulty: "easy" | "medium" | "hard"
  learning_status: "not_learned" | "learning" | "learned"
  added_at: string
  last_practiced: string | null
  list_id: string
  user_id: string
}

interface DatabaseWord extends Omit<Word, 'learning_status'> {
  learning_status: string
}

const isValidLearningStatus = (status: string): status is Word['learning_status'] => {
  return ["not_learned", "learning", "learned"].includes(status)
}

const validateWord = (word: DatabaseWord): Word => {
  const validStatus = isValidLearningStatus(word.learning_status) 
    ? word.learning_status 
    : "not_learned"

  return {
    ...word,
    learning_status: validStatus
  }
}

export default function Flashcards() {
  const { listId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [words, setWords] = useState<Word[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [shuffledWords, setShuffledWords] = useState<Word[]>([])

  useEffect(() => {
    const fetchWords = async () => {
      if (!user || !listId) return

      try {
        setIsLoading(true)
        console.log('Fetching words for list:', listId)

        const { data, error } = await supabase
          .from('words')
          .select('*')
          .eq('list_id', listId)
          .eq('user_id', user.id)
          .order('added_at', { ascending: true })

        if (error) {
          console.error('Supabase error:', error)
          throw error
        }

        console.log('Fetched words:', data)

        if (!data) {
          console.log('No words found')
          setWords([])
          return
        }

        // Transform and validate data
        const transformedData = (data as DatabaseWord[]).map(validateWord)
        console.log('Transformed data:', transformedData)

        setWords(transformedData)
        setShuffledWords(shuffleArray([...transformedData]))
      } catch (error) {
        console.error('Error details:', error)
        toast.error('Failed to load words')
        navigate(`/lists/${listId}`)
      } finally {
        setIsLoading(false)
      }
    }

    fetchWords()
  }, [listId, user, navigate])

  const shuffleArray = (array: Word[]) => {
    const newArray = [...array]
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]]
    }
    return newArray
  }

  const handleNext = () => {
    if (currentIndex < shuffledWords.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setIsFlipped(false)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
      setIsFlipped(false)
    }
  }

  const handleShuffle = () => {
    setShuffledWords(shuffleArray([...words]))
    setCurrentIndex(0)
    setIsFlipped(false)
  }

  const handleMarkAsLearned = async () => {
    if (!user || !listId) return

    const currentWord = shuffledWords[currentIndex]
    const newStatus: Word['learning_status'] = currentWord.learning_status === 'learned' ? 'learning' : 'learned'
    
    try {
      const { error } = await supabase
        .from('words')
        .update({
          learning_status: newStatus,
          last_practiced: new Date().toISOString()
        })
        .eq('id', currentWord.id)
        .eq('user_id', user.id)

      if (error) throw error

      // Update local state with proper typing
      const updatedWords: Word[] = words.map(word => 
        word.id === currentWord.id 
          ? { 
              ...word, 
              learning_status: newStatus,
              last_practiced: new Date().toISOString()
            } as Word
          : word
      )

      setWords(updatedWords)
      setShuffledWords(updatedWords.map(w => ({ ...w })))

      toast.success(currentWord.learning_status === 'learned' 
        ? "Marked as still learning" 
        : "Marked as learned!")
    } catch (error) {
      console.error('Error updating word status:', error)
      toast.error('Failed to update word status')
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-32 bg-muted rounded"></div>
          <div className="h-64 w-full bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  if (words.length === 0) {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => navigate(`/lists/${listId}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to List
        </Button>

        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">No Words Found</h1>
          <p className="text-muted-foreground">Add some words to your list to start practicing!</p>
          <Button onClick={() => navigate(`/lists/${listId}/add-word`)}>
            Add Your First Word
          </Button>
        </div>
      </div>
    )
  }

  const currentWord = shuffledWords[currentIndex]

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Button 
        variant="ghost" 
        className="mb-6"
        onClick={() => navigate(`/lists/${listId}`)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to List
      </Button>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Flashcards</h1>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleShuffle}
              title="Shuffle cards"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div 
          className="relative min-h-[300px] w-full bg-card rounded-xl shadow-lg cursor-pointer perspective-1000"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div className={`absolute inset-0 backface-hidden transition-transform duration-500 ${isFlipped ? 'rotate-y-180' : ''}`}>
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <div className="text-2xl font-semibold mb-4">{currentWord.original}</div>
              {currentWord.pronunciation && (
                <div className="text-sm text-muted-foreground">{currentWord.pronunciation}</div>
              )}
            </div>
          </div>
          <div className={`absolute inset-0 backface-hidden transition-transform duration-500 rotate-y-180 ${isFlipped ? 'rotate-y-0' : ''}`}>
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <div className="text-2xl font-semibold mb-4">{currentWord.translation}</div>
              {currentWord.example && (
                <div className="text-sm text-muted-foreground italic">"{currentWord.example}"</div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          <div className="text-sm text-muted-foreground">
            {currentIndex + 1} / {words.length}
          </div>
          <Button
            variant="outline"
            onClick={handleNext}
            disabled={currentIndex === words.length - 1}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        <Button
          variant={currentWord.learning_status === 'learned' ? 'destructive' : 'default'}
          className="w-full"
          onClick={handleMarkAsLearned}
        >
          {currentWord.learning_status === 'learned' ? 'Mark as Still Learning' : 'Mark as Learned'}
        </Button>
      </div>
    </div>
  )
} 