import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus, Pencil, Trash2, Layout } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/stores/auth.store"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui"

interface Word {
  id: string
  original: string
  translation: string
  example?: string
  pronunciation?: string
  difficulty: "easy" | "medium" | "hard"
  learning_status: "learned" | "learning" | "not_learned"
  added_at: string
  last_practiced?: string
  list_id: string
  user_id: string
}

interface List {
  id: string
  name: string
  description?: string
  category: string
  is_public: boolean
  created_at: string
  word_count: number
  progress: number
  user_id: string
}

export default function ListDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [list, setList] = useState<List | null>(null)
  const [words, setWords] = useState<Word[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchListAndWords = async () => {
      try {
        if (!id || !user) return

        // Fetch list details
        const { data: listData, error: listError } = await supabase
          .from('lists')
          .select('*')
          .eq('id', id)
          .single()

        if (listError) throw listError
        if (!listData) throw new Error('List not found')

        // Check if user has access to this list
        if (listData.user_id !== user.id) {
          toast.error("You don't have access to this list")
          navigate('/lists')
          return
        }

        setList(listData)

        // Fetch words in the list
        const { data: wordsData, error: wordsError } = await supabase
          .from('words')
          .select('*')
          .eq('list_id', id)
          .order('added_at', { ascending: false })

        if (wordsError) throw wordsError

        setWords(wordsData || [])
      } catch (error) {
        console.error("Error fetching list details:", error)
        toast.error(error instanceof Error ? error.message : 'Failed to load list details')
        navigate('/lists')
      } finally {
        setIsLoading(false)
      }
    }

    fetchListAndWords()
  }, [id, user, navigate])

  const handleDeleteList = async () => {
    try {
      if (!id || !user) return

      const { error } = await supabase
        .from('lists')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      toast.success("List deleted successfully")
      navigate('/lists')
    } catch (error) {
      console.error("Error deleting list:", error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete list')
    }
  }

  const handleDeleteWord = async (wordId: string) => {
    try {
      const { error } = await supabase
        .from('words')
        .delete()
        .eq('id', wordId)
        .eq('user_id', user?.id)

      if (error) throw error

      setWords(words.filter(word => word.id !== wordId))
      toast.success("Word deleted successfully")
    } catch (error) {
      console.error("Error deleting word:", error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete word')
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-24" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/4" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-8 w-32" />
            <div className="border rounded-lg p-4">
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!list) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">List Not Found</h2>
          <p className="text-muted-foreground mb-4">The list you're looking for doesn't exist or you don't have access to it.</p>
          <Button onClick={() => navigate('/lists')}>
            Go Back to Lists
          </Button>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: Word["learning_status"]) => {
    switch (status) {
      case "learned":
        return "bg-green-500"
      case "learning":
        return "bg-yellow-500"
      case "not_learned":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getDifficultyColor = (difficulty: Word["difficulty"]) => {
    switch (difficulty) {
      case "easy":
        return "text-green-500"
      case "medium":
        return "text-yellow-500"
      case "hard":
        return "text-red-500"
      default:
        return "text-gray-500"
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/lists')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Lists
        </Button>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/lists/${id}/flashcards`)}
            disabled={words.length === 0}
          >
            <Layout className="mr-2 h-4 w-4" />
            Practice with Flashcards
          </Button>
          <Button onClick={() => navigate(`/lists/${id}/add-word`)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Word
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-3xl font-bold">{list.name}</h1>
              <Badge variant={list.is_public ? "default" : "secondary"}>
                {list.is_public ? "Public" : "Private"}
              </Badge>
            </div>
            <p className="text-muted-foreground mb-2">{list.description}</p>
            <div className="text-sm text-muted-foreground">
              Created on {format(new Date(list.created_at), "MMM d, yyyy")} • {list.word_count} words
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => navigate(`/lists/${id}/edit`)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="text-red-500 hover:text-red-600"
              onClick={handleDeleteList}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Words</h2>
        </div>

        {words.length === 0 ? (
          <div className="text-center py-12 border rounded-lg">
            <h3 className="text-lg font-semibold mb-2">No Words Yet</h3>
            <p className="text-muted-foreground mb-4">Start adding words to your list!</p>
            <Button onClick={() => navigate(`/lists/${id}/add-word`)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Word
            </Button>
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Word</TableHead>
                  <TableHead>Translation</TableHead>
                  <TableHead>Example</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead>Last Practiced</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {words.map((word) => (
                  <TableRow key={word.id}>
                    <TableCell className="font-medium">{word.original}</TableCell>
                    <TableCell>{word.translation}</TableCell>
                    <TableCell className="max-w-xs truncate">{word.example}</TableCell>
                    <TableCell>
                      <span className={getDifficultyColor(word.difficulty)}>
                        {word.difficulty.charAt(0).toUpperCase() + word.difficulty.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(word.learning_status)}`} />
                        {word.learning_status.split("_").map(word => 
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(" ")}
                      </div>
                    </TableCell>
                    <TableCell>{format(new Date(word.added_at), "MMM d, yyyy")}</TableCell>
                    <TableCell>
                      {word.last_practiced 
                        ? format(new Date(word.last_practiced), "MMM d, yyyy")
                        : "Never"
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => navigate(`/lists/${id}/words/${word.id}/edit`)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-red-500 hover:text-red-600"
                          onClick={() => handleDeleteWord(word.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
} 