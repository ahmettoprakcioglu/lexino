import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Brain, BookOpen, PenLine, SplitSquareVertical, Loader2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/stores/auth.store"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

type PracticeMode = "flashcards" | "quiz" | "writing" | "matching"

interface List {
  id: string
  name: string
  word_count: number
  description: string | null
  category: string
  progress: number
}

interface ModeCardProps {
  title: string
  description: string
  icon: React.ReactNode
  onClick: () => void
  disabled?: boolean
}

const ModeCard = ({ title, description, icon, onClick, disabled }: ModeCardProps) => (
  <Card 
    className={`cursor-pointer transition-all ${
      disabled 
        ? 'opacity-50 cursor-not-allowed' 
        : 'hover:border-primary/50'
    }`}
    onClick={() => !disabled && onClick()}
  >
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        {icon}
        {title}
      </CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
  </Card>
)

export default function Practice() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [selectedList, setSelectedList] = useState<string>("")
  const [lists, setLists] = useState<List[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const dailyProgress = 0 // Will be implemented with real progress tracking later

  useEffect(() => {
    const fetchLists = async () => {
      if (!user) return

      try {
        setIsLoading(true)
        const { data, error } = await supabase
          .from('lists')
          .select(`
            id,
            name,
            word_count,
            description,
            category,
            progress
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error

        setLists(data)
      } catch (error) {
        console.error('Error fetching lists:', error)
        toast.error('Failed to load your lists')
      } finally {
        setIsLoading(false)
      }
    }

    fetchLists()
  }, [user])

  const handleModeSelect = (mode: PracticeMode) => {
    if (!selectedList) {
      toast.error('Please select a list first')
      return
    }

    switch (mode) {
      case "flashcards":
        navigate(`/lists/${selectedList}/flashcards`)
        break
      case "quiz":
        navigate(`/lists/${selectedList}/quiz`)
        break
      case "writing":
        navigate(`/lists/${selectedList}/writing`)
        break
      case "matching":
        navigate(`/lists/${selectedList}/matching`)
        break
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="space-y-4 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="text-muted-foreground">Loading your lists...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!lists.length) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">No Lists Available</h2>
          <p className="text-muted-foreground">Create a list to start practicing!</p>
          <Button onClick={() => navigate('/lists/new')}>
            Create Your First List
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Practice</h1>
        <p className="text-muted-foreground">
          Choose a list and practice mode to improve your vocabulary
        </p>
      </div>

      {/* List Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select a List</CardTitle>
          <CardDescription>Choose which words you want to practice</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedList} onValueChange={setSelectedList}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a list to practice" />
            </SelectTrigger>
            <SelectContent>
              {lists.map(list => (
                <SelectItem 
                  key={list.id} 
                  value={list.id}
                >
                  {list.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Progress Section */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Progress</CardTitle>
          <CardDescription>Track your learning goals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{dailyProgress}%</span>
            </div>
            <Progress value={dailyProgress} />
          </div>
        </CardContent>
      </Card>

      {/* Practice Modes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ModeCard
          title="Flashcards"
          description="Practice with interactive flashcards"
          icon={<BookOpen className="h-5 w-5" />}
          onClick={() => handleModeSelect("flashcards")}
          disabled={!selectedList}
        />
        <ModeCard
          title="Quiz"
          description="Test your knowledge with AI-generated quizzes"
          icon={<Brain className="h-5 w-5" />}
          onClick={() => handleModeSelect("quiz")}
          disabled={!selectedList}
        />
        <ModeCard
          title="Writing"
          description="Practice writing and spelling"
          icon={<PenLine className="h-5 w-5" />}
          onClick={() => handleModeSelect("writing")}
          disabled={!selectedList}
        />
        <ModeCard
          title="Matching"
          description="Match words with their meanings"
          icon={<SplitSquareVertical className="h-5 w-5" />}
          onClick={() => handleModeSelect("matching")}
          disabled={!selectedList}
        />
      </div>
    </div>
  )
} 