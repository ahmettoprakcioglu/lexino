import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/stores/auth.store"
import { toast } from "sonner"

export default function EditList() {
  const { listId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [isPublic, setIsPublic] = useState(false)

  useEffect(() => {
    const fetchList = async () => {
      if (!user || !listId) return

      try {
        const { data, error } = await supabase
          .from('lists')
          .select('*')
          .eq('id', listId)
          .single()

        if (error) throw error

        if (!data) {
          toast.error("List not found")
          navigate('/lists')
          return
        }

        // Check if user has access to this list
        if (data.user_id !== user.id) {
          toast.error("You don't have access to this list")
          navigate('/lists')
          return
        }

        setName(data.name)
        setDescription(data.description || "")
        setCategory(data.category)
        setIsPublic(data.is_public)
      } catch (error) {
        console.error('Error fetching list:', error)
        toast.error('Failed to load list details')
        navigate('/lists')
      } finally {
        setIsLoading(false)
      }
    }

    fetchList()
  }, [listId, user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || !listId) {
      toast.error("Something went wrong")
      return
    }

    if (!name.trim()) {
      toast.error("List name is required")
      return
    }

    try {
      setIsSaving(true)

      const { error } = await supabase
        .from('lists')
        .update({
          name: name.trim(),
          description: description.trim() || null,
          category: category.trim(),
          is_public: isPublic
        })
        .eq('id', listId)
        .eq('user_id', user.id)

      if (error) throw error

      toast.success("List updated successfully!")
      navigate(`/lists/${listId}`)
    } catch (error) {
      console.error('Error updating list:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update list')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-32 bg-muted rounded"></div>
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
        disabled={isSaving}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to List
      </Button>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Edit List</h1>
          <p className="text-muted-foreground">Update your list details.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">List Name</Label>
              <Input
                id="name"
                placeholder="Enter list name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter list description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px]"
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                placeholder="Enter category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={isSaving}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is-public"
                checked={isPublic}
                onCheckedChange={setIsPublic}
                disabled={isSaving}
              />
              <Label htmlFor="is-public">Make this list public</Label>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </div>
    </div>
  )
} 