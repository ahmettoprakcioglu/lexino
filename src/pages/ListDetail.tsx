import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus, Pencil, Trash2, Layout } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { supabase, cachedSupabaseQuery } from "@/lib/supabase"
import { useAuthStore } from "@/stores/auth.store"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui"
import { DataTable } from "@/components/data-table/data-table"
import { columns } from "@/components/data-table/columns"

interface List {
  id: string
  name: string
  description: string | null
  category: string | null
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
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchListDetails = async () => {
      try {
        if (!id || !user) return

        setIsLoading(true)
        
        // Use cached query for list details
        const { data: listData, error: listError } = await cachedSupabaseQuery<List>(
          `list-${id}`,
          async () => await supabase
            .from('lists')
            .select('*')
            .eq('id', id)
            .single()
        )

        if (listError) throw listError
        if (!listData) throw new Error('List not found')

        // Check if user has access to this list
        if (listData.user_id !== user.id) {
          toast.error("You don't have access to this list")
          navigate('/lists')
          return
        }

        setList(listData)
      } catch (error) {
        console.error("Error fetching list details:", error)
        toast.error(error instanceof Error ? error.message : 'Failed to load list details')
        navigate('/lists')
      } finally {
        setIsLoading(false)
      }
    }

    fetchListDetails()
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
            disabled={list.word_count === 0}
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
            {list.description && (
              <p className="text-muted-foreground mb-2">{list.description}</p>
            )}
            {list.category && (
              <p className="text-sm text-muted-foreground">
                Category: {list.category}
              </p>
            )}
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

        {list && <DataTable columns={columns} listId={id!} />}
      </div>
    </div>
  )
} 