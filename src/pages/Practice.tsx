import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Brain, BookOpen, PenLine, SplitSquareVertical } from "lucide-react"
import { useNavigate } from "react-router-dom"

type PracticeMode = "flashcards" | "quiz" | "writing" | "matching"

interface ModeCardProps {
  title: string
  description: string
  icon: React.ReactNode
  onClick: () => void
}

const ModeCard = ({ title, description, icon, onClick }: ModeCardProps) => (
  <Card 
    className="cursor-pointer hover:border-primary/50 transition-all"
    onClick={onClick}
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
  const [selectedList, setSelectedList] = useState<string>("all")
  const dailyProgress = 0 // Will be implemented with real progress tracking later

  const handleModeSelect = (mode: PracticeMode) => {
    switch (mode) {
      case "flashcards":
        if (selectedList) {
          navigate(`/lists/${selectedList}/flashcards`)
        } else {
          // Will implement general flashcards route
          navigate("/practice/flashcards")
        }
        break
      case "quiz":
        navigate("/practice/quiz")
        break
      case "writing":
        navigate("/practice/writing")
        break
      case "matching":
        navigate("/practice/matching")
        break
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Practice</h1>
        <p className="text-muted-foreground">
          Choose a practice mode to improve your vocabulary
        </p>
      </div>

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

      {/* List Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Select List</label>
        <Select value={selectedList} onValueChange={setSelectedList}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a list to practice" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Lists</SelectItem>
            {/* We'll populate this with actual lists later */}
          </SelectContent>
        </Select>
      </div>

      {/* Practice Modes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ModeCard
          title="Flashcards"
          description="Practice with interactive flashcards"
          icon={<BookOpen className="h-5 w-5" />}
          onClick={() => handleModeSelect("flashcards")}
        />
        <ModeCard
          title="Quiz"
          description="Test your knowledge with AI-generated quizzes"
          icon={<Brain className="h-5 w-5" />}
          onClick={() => handleModeSelect("quiz")}
        />
        <ModeCard
          title="Writing"
          description="Practice writing and spelling"
          icon={<PenLine className="h-5 w-5" />}
          onClick={() => handleModeSelect("writing")}
        />
        <ModeCard
          title="Matching"
          description="Match words with their meanings"
          icon={<SplitSquareVertical className="h-5 w-5" />}
          onClick={() => handleModeSelect("matching")}
        />
      </div>
    </div>
  )
} 