import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Clock } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/stores/auth.store"
import { toast } from "sonner"
import { format } from "date-fns"

export default function EditWord() {
  const { listId, wordId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  
  const [original, setOriginal] = useState("")
  const [translation, setTranslation] = useState("")
  const [example, setExample] = useState("")
  const [pronunciation, setPronunciation] = useState("")
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium")
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)

  useEffect(() => {
    const fetchWord = async () => {
      if (!user || !wordId) return

      try {
        const { data, error } = await supabase
          .from('words')
          .select('*')
          .eq('id', wordId)
          .eq('user_id', user.id)
          .single()

        if (error) throw error

        if (data) {
          setOriginal(data.original)
          setTranslation(data.translation)
          setExample(data.example || "")
          setPronunciation(data.pronunciation || "")
          setDifficulty(data.difficulty)
          setUpdatedAt(data.updated_at)
        }
      } catch (error) {
        console.error('Error fetching word:', error)
        toast.error('Failed to load word details')
        navigate(`/lists/${listId}`)
      } finally {
        setIsFetching(false)
      }
    }

    fetchWord()
  }, [wordId, user, navigate, listId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || !wordId || !listId) {
      toast.error("Something went wrong")
      return
    }

    try {
      setIsLoading(true)

      const { error } = await supabase
        .from('words')
        .update({
          original,
          translation,
          example: example || null,
          pronunciation: pronunciation || null,
          difficulty
        })
        .eq('id', wordId)
        .eq('user_id', user.id)

      if (error) throw error

      toast.success("Word updated successfully!")
      navigate(`/lists/${listId}`)
    } catch (error) {
      console.error('Error updating word:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update word')
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-32 bg-muted rounded"></div>
          <div className="h-12 w-full bg-muted rounded"></div>
          <div className="space-y-2">
            <div className="h-4 w-24 bg-muted rounded"></div>
            <div className="h-10 w-full bg-muted rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Button 
        variant="ghost" 
        className="mb-6"
        onClick={() => navigate(`/lists/${listId}`)}
        disabled={isLoading}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to List
      </Button>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Edit Word</h1>
          <p className="text-muted-foreground">Update the word details.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="original">Word</Label>
              <Input
                id="original"
                placeholder="Enter the word"
                value={original}
                onChange={(e) => setOriginal(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="translation">Translation</Label>
              <Input
                id="translation"
                placeholder="Enter the translation"
                value={translation}
                onChange={(e) => setTranslation(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="example">Example Usage</Label>
              <Textarea
                id="example"
                placeholder="Enter an example sentence"
                value={example}
                onChange={(e) => setExample(e.target.value)}
                className="min-h-[100px]"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pronunciation">Pronunciation</Label>
              <Input
                id="pronunciation"
                placeholder="Enter pronunciation guide"
                value={pronunciation}
                onChange={(e) => setPronunciation(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select
                value={difficulty}
                onValueChange={(value: "easy" | "medium" | "hard") => setDifficulty(value)}
                disabled={isLoading}
              >
                <SelectTrigger id="difficulty">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Updating..." : "Update Word"}
          </Button>
        </form>

        {updatedAt && (
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                Last updated: {format(new Date(updatedAt), "MMMM d, yyyy 'at' h:mm a")}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 