import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface ListStatsProps {
  totalWords: number
  learned: number
  learning: number
  notLearned: number
  easy: number
  medium: number
  hard: number
}

export function ListStats({
  totalWords,
  learned,
  learning,
  notLearned,
  easy,
  medium,
  hard
}: ListStatsProps) {
  const learnedPercentage = totalWords > 0 ? (learned / totalWords) * 100 : 0
  const learningPercentage = totalWords > 0 ? (learning / totalWords) * 100 : 0
  const notLearnedPercentage = totalWords > 0 ? (notLearned / totalWords) * 100 : 0

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Learning Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Learned</span>
                <span className="font-medium">{learned} words ({learnedPercentage.toFixed(1)}%)</span>
              </div>
              <Progress value={learnedPercentage} className="bg-muted" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Learning</span>
                <span className="font-medium">{learning} words ({learningPercentage.toFixed(1)}%)</span>
              </div>
              <Progress value={learningPercentage} className="bg-muted" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Not Started</span>
                <span className="font-medium">{notLearned} words ({notLearnedPercentage.toFixed(1)}%)</span>
              </div>
              <Progress value={notLearnedPercentage} className="bg-muted" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Difficulty Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center">
                  <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                  Easy
                </span>
                <span className="font-medium">{easy} words</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center">
                  <span className="h-2 w-2 rounded-full bg-yellow-500 mr-2"></span>
                  Medium
                </span>
                <span className="font-medium">{medium} words</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center">
                  <span className="h-2 w-2 rounded-full bg-red-500 mr-2"></span>
                  Hard
                </span>
                <span className="font-medium">{hard} words</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[120px]">
            <div className="text-3xl font-bold mb-2">{learnedPercentage.toFixed(0)}%</div>
            <p className="text-sm text-muted-foreground">Complete</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 