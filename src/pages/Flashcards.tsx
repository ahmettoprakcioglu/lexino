import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ChevronLeft, ChevronRight, RotateCcw, HelpCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/stores/auth.store"
import { toast } from "sonner"
import { useSpacedRepetition } from "@/hooks/useSpacedRepetition"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

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
  const [loadingProgress, setLoadingProgress] = useState(0)
  const { updateWordReview, isUpdating } = useSpacedRepetition(shuffledWords[currentIndex]?.id)

  useEffect(() => {
    const fetchAllWords = async () => {
      if (!user || !listId) return

      try {
        setIsLoading(true)
        const allWords: DatabaseWord[] = []
        let page = 0
        const pageSize = 1000

        while (true) {
          const { data, error } = await supabase
            .from('words')
            .select('*')
            .eq('list_id', listId)
            .eq('user_id', user.id)
            .order('added_at', { ascending: true })
            .range(page * pageSize, (page + 1) * pageSize - 1)

          if (error) {
            console.error('Supabase error:', error)
            throw error
          }

          if (!data || data.length === 0) break

          allWords.push(...data)
          
          // Update loading progress
          if (data.length === pageSize) {
            setLoadingProgress((page + 1) * pageSize)
          }

          if (data.length < pageSize) break
          page++
        }

        console.log('Fetched total words:', allWords.length)

        // Transform and validate data
        const transformedData = allWords.map(validateWord)
        console.log('Transformed data:', transformedData)

        setWords(transformedData)
        setShuffledWords(shuffleArray([...transformedData]))
      } catch (error) {
        console.error('Error details:', error)
        toast.error('Failed to load words')
        navigate(`/lists/${listId}`)
      } finally {
        setIsLoading(false)
        setLoadingProgress(0)
      }
    }

    fetchAllWords()
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

  // Update quality buttons component
  const QualityButtons = () => (
    <div className="space-y-4 mt-4">
      <div className="text-center text-sm text-muted-foreground">
        How well did you remember this word?
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Button 
              className="w-24 bg-emerald-500 hover:bg-emerald-600 text-white"
              onClick={() => handleQualitySelect(5)}
              disabled={isUpdating || !isFlipped}
            >
              Perfect (5)
            </Button>
            <span className="text-sm text-muted-foreground">Instantly remembered</span>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              className="w-24 bg-green-500 hover:bg-green-600 text-white"
              onClick={() => handleQualitySelect(4)}
              disabled={isUpdating || !isFlipped}
            >
              Easy (4)
            </Button>
            <span className="text-sm text-muted-foreground">Minimal thought needed</span>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              className="w-24 bg-blue-500 hover:bg-blue-600 text-white"
              onClick={() => handleQualitySelect(3)}
              disabled={isUpdating || !isFlipped}
            >
              Good (3)
            </Button>
            <span className="text-sm text-muted-foreground">Some thought needed</span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Button 
              className="w-24 bg-yellow-500 hover:bg-yellow-600 text-white"
              onClick={() => handleQualitySelect(2)}
              disabled={isUpdating || !isFlipped}
            >
              Hard (2)
            </Button>
            <span className="text-sm text-muted-foreground">Significant effort</span>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              className="w-24 bg-orange-500 hover:bg-orange-600 text-white"
              onClick={() => handleQualitySelect(1)}
              disabled={isUpdating || !isFlipped}
            >
              Very Hard (1)
            </Button>
            <span className="text-sm text-muted-foreground">Barely remembered</span>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              className="w-24 bg-red-500 hover:bg-red-600 text-white"
              onClick={() => handleQualitySelect(0)}
              disabled={isUpdating || !isFlipped}
            >
              Blackout (0)
            </Button>
            <span className="text-sm text-muted-foreground">Completely forgot</span>
          </div>
        </div>
      </div>
    </div>
  )

  const handleQualitySelect = async (quality: 0 | 1 | 2 | 3 | 4 | 5) => {
    const result = await updateWordReview(quality)
    if (result.success) {
      handleNext()
    } else {
      toast.error("Failed to update review status")
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <div className="space-y-4">
          <div className="h-8 w-32 bg-muted rounded animate-pulse"></div>
          <div className="h-64 w-full bg-muted rounded animate-pulse"></div>
          {loadingProgress > 0 && (
            <div className="text-center text-sm text-muted-foreground">
              Loading words... ({loadingProgress} loaded)
            </div>
          )}
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
          <div className="flex items-center gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <HelpCircle className="h-4 w-4" />
                  Help
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>How Does the Learning System Work?</DialogTitle>
                  <DialogDescription>
                    <div className="space-y-4 pt-4">
                      <p>
                        This system uses the scientifically proven "Spaced Repetition" method. 
                        After flipping the card, you need to rate how well you remembered the word.
                      </p>
                      
                      <div className="space-y-2">
                        <h3 className="font-semibold">Rating Options:</h3>
                        <ul className="space-y-2">
                          <li className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                            <strong>Perfect (5):</strong> Instantly remembered, no hesitation
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <strong>Easy (4):</strong> Remembered with minimal thought
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            <strong>Good (3):</strong> Remembered after some thought
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <strong>Hard (2):</strong> Took significant effort to remember
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                            <strong>Very Hard (1):</strong> Barely remembered
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <strong>Blackout (0):</strong> Completely forgot
                          </li>
                        </ul>
                      </div>

                      <p>
                        Based on your rating, the system calculates when to show the word again:
                      </p>
                      <ul className="list-disc pl-4 space-y-1">
                        <li>Words you remember well will be shown after longer intervals</li>
                        <li>Difficult words will be shown more frequently</li>
                        <li>Words you forgot will be shown the next day</li>
                      </ul>
                    </div>
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
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

        <div className="mt-8">
          <div className="relative">
            <div 
              className="relative h-64 cursor-pointer bg-card rounded-lg border"
              onClick={() => !isUpdating && setIsFlipped(!isFlipped)}
            >
              <div 
                className={`absolute inset-0 w-full h-full transition-all duration-500 [transform-style:preserve-3d] ${
                  isFlipped ? '[transform:rotateY(180deg)]' : ''
                }`}
              >
                {/* Front of card */}
                <div className="absolute inset-0 h-full w-full [backface-visibility:hidden]">
                  <div className="h-full flex items-center justify-center p-6 border rounded-lg bg-card">
                    <div className="text-center">
                      <h2 className="text-2xl font-bold mb-4">{currentWord?.original}</h2>
                      {currentWord?.pronunciation && (
                        <p className="text-muted-foreground">{currentWord.pronunciation}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Back of card */}
                <div className="absolute inset-0 h-full w-full [backface-visibility:hidden] [transform:rotateY(180deg)]">
                  <div className="h-full flex items-center justify-center p-6 border rounded-lg bg-card">
                    <div className="text-center">
                      <h2 className="text-2xl font-bold mb-4">{currentWord?.translation}</h2>
                      {currentWord?.example && (
                        <p className="text-muted-foreground italic">"{currentWord.example}"</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {isFlipped && <QualityButtons />}
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