import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus, Pencil, Layout, BarChart2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/stores/auth.store"
import { toast } from "sonner"
import { DataTable } from "@/components/data-table/data-table"
import { columns } from "@/components/data-table/columns"
import { useList } from "@/hooks/useList"
import { useListStats } from "@/hooks/useListStats"
import { DeleteConfirmModal } from "@/components/lists/DeleteConfirmModal"
import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

// Custom hook for learning goals
function useLearningGoals(listId: string, userId: string) {
  const [goals, setGoals] = useState<{ daily_word_goal: number } | null>(null)

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const { data, error } = await supabase
          .from('learning_goals')
          .select('daily_word_goal')
          .eq('list_id', listId)
          .eq('user_id', userId)
          .single()

        if (error && error.code !== 'PGRST116') {
          throw error
        }

        setGoals(data)
      } catch (error) {
        console.error('Error fetching learning goals:', error)
      }
    }

    if (listId && userId) {
      fetchGoals()
    }
  }, [listId, userId])

  return goals
}

export default function ListDetail() {
  const { listId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { list, isLoading, error } = useList(listId, user?.id)
  const [statsKey, setStatsKey] = useState(0)
  const stats = useListStats(listId, statsKey)
  const goals = useLearningGoals(listId!, user!.id)

  const handleStatusChange = () => {
    setStatsKey(prev => prev + 1)
  }

  const handleDeleteList = async () => {
    try {
      if (!listId || !user) return

      const { error } = await supabase
        .from('lists')
        .delete()
        .eq('id', listId)
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

  if (error || !list) {
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
            onClick={() => navigate(`/lists/${listId}/flashcards`)}
            disabled={list.word_count === 0}
          >
            <Layout className="mr-2 h-4 w-4" />
            Practice with Flashcards
          </Button>
          <Button onClick={() => navigate(`/lists/${listId}/add-word`)}>
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
            <Button
              variant="outline"
              onClick={() => navigate(`/lists/${listId}/insights`)}
            >
              <BarChart2 className="h-4 w-4 mr-2" />
              View Insights
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigate(`/lists/${listId}/edit`)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <DeleteConfirmModal
              itemType="list"
              itemName={list.name}
              onConfirm={handleDeleteList}
            />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Words</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalWords}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Words Learned</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.learned}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalWords > 0 
                  ? `${((stats.learned / stats.totalWords) * 100).toFixed(1)}% Complete`
                  : '0% Complete'
                }
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Words in Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.learning}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Learning Goals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{goals?.daily_word_goal || 0} words/day</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Words</h2>
        </div>

        <DataTable 
          columns={columns} 
          listId={listId!} 
          onStatusChange={handleStatusChange}
        />
      </div>
    </div>
  )
} 