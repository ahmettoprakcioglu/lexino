import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { ListStats } from "@/components/lists/ListStats"
import { LearningStats } from "@/components/lists/LearningStats"
import { LearningGoals } from "@/components/lists/LearningGoals"
import { useList } from "@/hooks/useList"
import { useListStats } from "@/hooks/useListStats"
import { useAuthStore } from "@/stores/auth.store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ListInsights() {
  const { listId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { list, isLoading: listLoading } = useList(listId, user?.id)
  const stats = useListStats(listId)

  if (listLoading || !list) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-1/4"></div>
        <div className="h-[400px] bg-muted rounded-lg"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate(`/lists/${listId}`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </Button>
          <h1 className="text-2xl font-bold">{list.name} - Insights</h1>
        </div>
      </div>

      {!stats.isLoading && !stats.error && (
        <div className="space-y-8">
          <div className="grid gap-6 md:grid-cols-2">
            <ListStats
              totalWords={stats.totalWords}
              learned={stats.learned}
              learning={stats.learning}
              notLearned={stats.notLearned}
              easy={stats.easy}
              medium={stats.medium}
              hard={stats.hard}
            />
            <LearningGoals listId={listId!} userId={user!.id} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Learning Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <LearningStats listId={listId!} userId={user!.id} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 