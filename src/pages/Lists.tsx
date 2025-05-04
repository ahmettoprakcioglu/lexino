import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth.store'

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

export default function Lists() {
  const navigate = useNavigate()
  const [lists, setLists] = useState<List[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuthStore()

  useEffect(() => {
    const fetchLists = async () => {
      try {
        if (!user) return

        const { data, error } = await supabase
          .from('lists')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) {
          throw error
        }

        setLists(data || [])
      } catch (error) {
        console.error('Error fetching lists:', error)
        toast.error('Failed to load lists')
      } finally {
        setIsLoading(false)
      }
    }

    fetchLists()
  }, [user])

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-4 bg-muted rounded w-2/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Lists</h1>
          <p className="text-muted-foreground">Create and manage your word lists</p>
        </div>
        <Button onClick={() => navigate('/create-list')}>
          <Plus className="mr-2 h-4 w-4" />
          Create New List
        </Button>
      </div>

      {lists.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">No Lists Yet</h2>
          <p className="text-muted-foreground mb-4">Create your first list to start learning new words!</p>
          <Button onClick={() => navigate('/create-list')}>
            <Plus className="mr-2 h-4 w-4" />
            Create Your First List
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lists.map((list) => (
            <Card key={list.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/lists/${list.id}`)}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{list.name}</CardTitle>
                    <CardDescription>{list.description}</CardDescription>
                  </div>
                  <Badge variant={list.is_public ? "default" : "secondary"}>
                    {list.is_public ? "Public" : "Private"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Category:</span>
                    <span className="font-medium">{list.category}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Words:</span>
                    <span className="font-medium">{list.word_count}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress:</span>
                    <span className="font-medium">{list.progress}%</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="text-sm text-muted-foreground">
                Created on {format(new Date(list.created_at), 'MMM d, yyyy')}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 