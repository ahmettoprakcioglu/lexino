import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/stores/auth.store"
import { toast } from "sonner"

export default function CreateList() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [isPublic, setIsPublic] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast.error("You must be logged in to create a list")
      return
    }

    try {
      setIsLoading(true)

      const { data, error } = await supabase
        .from('lists')
        .insert([
          {
            name,
            description,
            category,
            is_public: isPublic,
            user_id: user.id
          }
        ])
        .select()
        .single()

      if (error) {
        throw error
      }

      toast.success("List created successfully!")
      navigate(`/lists/${data.id}`)
    } catch (error) {
      console.error('Error creating list:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create list')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Button 
        variant="ghost" 
        className="mb-6"
        onClick={() => navigate("/lists")}
        disabled={isLoading}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Lists
      </Button>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Create New List</h1>
          <p className="text-muted-foreground">Create a new list to organize your words.</p>
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
                disabled={isLoading}
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
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={category}
                onValueChange={setCategory}
                required
                disabled={isLoading}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily_life">Daily Life & Conversations</SelectItem>
                  <SelectItem value="business">Business & Professional</SelectItem>
                  <SelectItem value="academic">Academic & Education</SelectItem>
                  <SelectItem value="travel">Travel & Tourism</SelectItem>
                  <SelectItem value="food">Food & Dining</SelectItem>
                  <SelectItem value="entertainment">Entertainment & Media</SelectItem>
                  <SelectItem value="technology">Technology & Internet</SelectItem>
                  <SelectItem value="health">Health & Medical</SelectItem>
                  <SelectItem value="culture">Culture & Arts</SelectItem>
                  <SelectItem value="idioms">Idioms & Expressions</SelectItem>
                  <SelectItem value="grammar">Grammar & Usage</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="public"
                checked={isPublic}
                onCheckedChange={setIsPublic}
                disabled={isLoading}
              />
              <Label htmlFor="public">Make this list public</Label>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create List"}
          </Button>
        </form>
      </div>
    </div>
  )
} 