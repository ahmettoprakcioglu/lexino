import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Bell, Settings2, Trash2 } from 'lucide-react'

interface LearningRemindersProps {
  listId: string
  userId: string
}

interface Reminder {
  id: string
  enabled: boolean
  time: string
  days: string[]
  notification_type: 'email' | 'push'
}

export function LearningReminders({ listId, userId }: LearningRemindersProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [tempReminder, setTempReminder] = useState<Omit<Reminder, 'id'>>({
    enabled: true,
    time: '09:00',
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    notification_type: 'push'
  })

  useEffect(() => {
    const fetchReminders = async () => {
      try {
        setIsLoading(true)

        const { data, error } = await supabase
          .from('learning_reminders')
          .select('*')
          .eq('list_id', listId)
          .eq('user_id', userId)
          .order('created_at', { ascending: true })

        if (error) throw error

        setReminders(data || [])
      } catch (error) {
        console.error('Error fetching learning reminders:', error)
        toast.error('Failed to load reminders')
      } finally {
        setIsLoading(false)
      }
    }

    fetchReminders()
  }, [listId, userId])

  const handleAddReminder = async () => {
    try {
      const { data, error } = await supabase
        .from('learning_reminders')
        .insert([{
          list_id: listId,
          user_id: userId,
          ...tempReminder
        }])
        .select()
        .single()

      if (error) throw error

      setReminders(prev => [...prev, data])
      setIsDialogOpen(false)
      toast.success('Reminder added successfully')
    } catch (error) {
      console.error('Error adding reminder:', error)
      toast.error('Failed to add reminder')
    }
  }

  const handleToggleReminder = async (id: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('learning_reminders')
        .update({ enabled })
        .eq('id', id)

      if (error) throw error

      setReminders(prev => prev.map(reminder => 
        reminder.id === id ? { ...reminder, enabled } : reminder
      ))
    } catch (error) {
      console.error('Error updating reminder:', error)
      toast.error('Failed to update reminder')
    }
  }

  const handleDeleteReminder = async (id: string) => {
    try {
      const { error } = await supabase
        .from('learning_reminders')
        .delete()
        .eq('id', id)

      if (error) throw error

      setReminders(prev => prev.filter(reminder => reminder.id !== id))
      toast.success('Reminder deleted successfully')
    } catch (error) {
      console.error('Error deleting reminder:', error)
      toast.error('Failed to delete reminder')
    }
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    return new Date(0, 0, 0, parseInt(hours), parseInt(minutes)).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatDays = (days: string[]) => {
    if (days.length === 7) return 'Every day'
    if (days.length === 5 && !days.includes('saturday') && !days.includes('sunday')) return 'Weekdays'
    return days.map(day => day.charAt(0).toUpperCase() + day.slice(1, 3)).join(', ')
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Learning Reminders</CardTitle>
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
        <CardTitle className="text-sm font-medium">Learning Reminders</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <Settings2 className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Reminder</DialogTitle>
              <DialogDescription>
                Set up a new reminder for your learning schedule.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="time">Reminder Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={tempReminder.time}
                  onChange={(e) => setTempReminder(prev => ({
                    ...prev,
                    time: e.target.value
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Days</Label>
                <div className="grid grid-cols-2 gap-2">
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                    <div key={day} className="flex items-center space-x-2">
                      <Switch
                        id={`day-${day}`}
                        checked={tempReminder.days.includes(day)}
                        onCheckedChange={(checked) => {
                          setTempReminder(prev => ({
                            ...prev,
                            days: checked
                              ? [...prev.days, day]
                              : prev.days.filter(d => d !== day)
                          }))
                        }}
                      />
                      <Label htmlFor={`day-${day}`}>
                        {day.charAt(0).toUpperCase() + day.slice(1)}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notification-type">Notification Type</Label>
                <Select
                  value={tempReminder.notification_type}
                  onValueChange={(value: 'email' | 'push') => setTempReminder(prev => ({
                    ...prev,
                    notification_type: value
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="push">Push Notification</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddReminder}>
                Add Reminder
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {reminders.length === 0 ? (
            <div className="text-center py-4">
              <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No reminders set</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setIsDialogOpen(true)}
              >
                Add Your First Reminder
              </Button>
            </div>
          ) : (
            reminders.map(reminder => (
              <div
                key={reminder.id}
                className="flex items-center justify-between p-2 rounded-lg border"
              >
                <div className="space-y-1">
                  <div className="font-medium">{formatTime(reminder.time)}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatDays(reminder.days)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {reminder.notification_type === 'push' ? 'Push Notification' : 'Email'}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={reminder.enabled}
                    onCheckedChange={(checked) => handleToggleReminder(reminder.id, checked)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => handleDeleteReminder(reminder.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
} 