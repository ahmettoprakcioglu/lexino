import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/stores/auth.store"
import { toast } from "sonner"
import { useList } from "@/hooks/useList"

export default function AddWord() {
  const { listId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { refetch } = useList(listId, user?.id)
  const [isLoading, setIsLoading] = useState(false)
  
  const [original, setOriginal] = useState("")
  const [translation, setTranslation] = useState("")
  const [example, setExample] = useState("")
  const [pronunciation, setPronunciation] = useState("")
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || !listId) {
      toast.error("Something went wrong")
      return
    }

    try {
      setIsLoading(true)

      const { error } = await supabase
        .from('words')
        .insert([
          {
            original,
            translation,
            example: example || null,
            pronunciation: pronunciation || null,
            difficulty,
            learning_status: "not_learned",
            list_id: listId,
            user_id: user.id
          }
        ])
        .select()
        .single()

      if (error) throw error

      // Refetch the list to update word count
      await refetch()

      toast.success("Word added successfully!")
      navigate(`/lists/${listId}`)
    } catch (error) {
      console.error('Error adding word:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to add word')
    } finally {
      setIsLoading(false)
    }
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
          <h1 className="text-3xl font-bold">Add New Word</h1>
          <p className="text-muted-foreground">Add a new word to your list.</p>
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
            {isLoading ? "Adding..." : "Add Word"}
          </Button>
        </form>
      </div>
    </div>
  )
} 