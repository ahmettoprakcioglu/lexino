import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Settings2 } from 'lucide-react'

interface LearningGoalsProps {
  listId: string
  userId: string
}

interface Goals {
  daily_word_goal: number
  weekly_review_goal: number
}

export function LearningGoals({ listId, userId }: LearningGoalsProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [goals, setGoals] = useState<Goals>({
    daily_word_goal: 5,
    weekly_review_goal: 20
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [tempGoals, setTempGoals] = useState<Goals>({
    daily_word_goal: 5,
    weekly_review_goal: 20
  })

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        setIsLoading(true)

        const { data, error } = await supabase
          .from('learning_goals')
          .select('*')
          .eq('list_id', listId)
          .eq('user_id', userId)
          .single()

        if (error) {
          if (error.code === 'PGRST116') { // No rows returned
            // Create default goals
            const { data: newGoals, error: createError } = await supabase
              .from('learning_goals')
              .insert([{
                list_id: listId,
                user_id: userId,
                daily_word_goal: 5,
                weekly_review_goal: 20
              }])
              .select()
              .single()

            if (createError) throw createError
            setGoals(newGoals)
            setTempGoals(newGoals)
          } else {
            throw error
          }
        } else {
          setGoals(data)
          setTempGoals(data)
        }
      } catch (error) {
        console.error('Error fetching learning goals:', error)
        toast.error('Failed to load learning goals')
      } finally {
        setIsLoading(false)
      }
    }

    fetchGoals()
  }, [listId, userId])

  const handleSaveGoals = async () => {
    try {
      const { error } = await supabase
        .from('learning_goals')
        .upsert({
          list_id: listId,
          user_id: userId,
          daily_word_goal: tempGoals.daily_word_goal,
          weekly_review_goal: tempGoals.weekly_review_goal
        })

      if (error) throw error

      setGoals(tempGoals)
      setIsDialogOpen(false)
      toast.success('Learning goals updated successfully')
    } catch (error) {
      console.error('Error updating learning goals:', error)
      toast.error('Failed to update learning goals')
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Learning Goals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Learning Goals</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <Settings2 className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Learning Goals</DialogTitle>
              <DialogDescription>
                Set your daily and weekly learning goals.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="daily-goal">Daily Word Goal</Label>
                <Input
                  id="daily-goal"
                  type="number"
                  min="1"
                  className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  value={tempGoals.daily_word_goal}
                  onChange={(e) => setTempGoals(prev => ({
                    ...prev,
                    daily_word_goal: parseInt(e.target.value) || 1
                  }))}
                />
                <p className="text-sm text-muted-foreground">
                  Number of new words you want to learn each day
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="weekly-goal">Weekly Review Goal</Label>
                <Input
                  id="weekly-goal"
                  type="number"
                  min="1"
                  className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  value={tempGoals.weekly_review_goal}
                  onChange={(e) => setTempGoals(prev => ({
                    ...prev,
                    weekly_review_goal: parseInt(e.target.value) || 1
                  }))}
                />
                <p className="text-sm text-muted-foreground">
                  Number of words you want to review each week
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveGoals}>
                Save Goals
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Daily Word Goal:</span>
              <span className="font-medium">{goals.daily_word_goal} words</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Weekly Review Goal:</span>
              <span className="font-medium">{goals.weekly_review_goal} words</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 