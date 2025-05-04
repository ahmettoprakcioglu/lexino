import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from '@/lib/supabase'
import { format, subDays, eachDayOfInterval } from 'date-fns'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, TooltipProps } from 'recharts'
import { useTheme } from '../../providers/theme-provider'

// Add this type definition
type CustomAxisTick = {
  fill?: string;
  angle?: number;
  textAnchor?: string;
  dy?: number;
  dx?: number;
}

interface LearningStatsProps {
  listId: string
  userId: string
}

interface DailyStats {
  date: string
  wordsReviewed: number
  wordsLearned: number
}

interface CustomTooltipProps extends TooltipProps<number, string> {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload) return null;

  return (
    <div className="rounded-lg border bg-background p-3 shadow-sm">
      <p className="font-medium mb-2">
        {format(new Date(label || ''), 'MMMM d, yyyy')}
      </p>
      {payload.map((entry, index) => (
        <div
          key={index}
          className="flex items-center gap-2 text-sm"
        >
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">
            {entry.name}:
          </span>
          <span className="font-medium">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export function LearningStats({ listId, userId }: LearningStatsProps) {
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([])
  const [currentStreak, setCurrentStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const { theme } = useTheme()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true)

        // Get the date range for the last 30 days
        const endDate = new Date()
        endDate.setHours(23, 59, 59, 999) // Set to end of day
        const startDate = subDays(endDate, 29)
        startDate.setHours(0, 0, 0, 0) // Set to start of day

        // Create an array of all dates in the range
        const dateRange = eachDayOfInterval({ start: startDate, end: endDate })
        const emptyStats = dateRange.map(date => ({
          date: format(date, 'yyyy-MM-dd'),
          wordsReviewed: 0,
          wordsLearned: 0
        }))

        // Fetch learning streaks data
        const { data: streaks, error } = await supabase
          .from('learning_streaks')
          .select('*')
          .eq('list_id', listId)
          .eq('user_id', userId)
          .gte('date', format(startDate, 'yyyy-MM-dd'))
          .lte('date', format(endDate, 'yyyy-MM-dd'))
          .order('date', { ascending: true })

        if (error) throw error

        // Merge fetched data with empty stats
        const mergedStats = emptyStats.map(stat => {
          const matchingStreak = streaks?.find(s => s.date === stat.date)
          return matchingStreak
            ? {
                date: stat.date,
                wordsReviewed: matchingStreak.words_reviewed,
                wordsLearned: matchingStreak.words_learned
              }
            : stat
        })

        setDailyStats(mergedStats)

        // Calculate current streak
        let streak = 0
        const today = format(new Date(), 'yyyy-MM-dd')
        const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd')

        // Check if studied today or yesterday to maintain streak
        const hasStudiedToday = streaks?.some(s => s.date === today && s.words_reviewed > 0)
        const hasStudiedYesterday = streaks?.some(s => s.date === yesterday && s.words_reviewed > 0)

        if (hasStudiedToday || hasStudiedYesterday) {
          for (let i = streaks?.length - 1; i >= 0; i--) {
            if (streaks[i].words_reviewed > 0) {
              streak++
            } else {
              break
            }
          }
        }

        setCurrentStreak(streak)

        // Calculate best streak
        let maxStreak = 0
        let currentMaxStreak = 0
        streaks?.forEach(streak => {
          if (streak.words_reviewed > 0) {
            currentMaxStreak++
          } else {
            maxStreak = Math.max(maxStreak, currentMaxStreak)
            currentMaxStreak = 0
          }
        })
        maxStreak = Math.max(maxStreak, currentMaxStreak)
        setBestStreak(maxStreak)

      } catch (error) {
        console.error('Error fetching learning stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [listId, userId])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-[400px] animate-pulse bg-muted rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Current Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStreak} days</div>
            <p className="text-xs text-muted-foreground">
              Keep learning daily to maintain your streak!
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Best Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bestStreak} days</div>
            <p className="text-xs text-muted-foreground">
              Your longest learning streak
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Learning Progress (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={dailyStats}
                margin={{
                  top: 5,
                  right: 10,
                  left: 10,
                  bottom: 0,
                }}
              >
                <XAxis
                  dataKey="date"
                  stroke={theme === 'dark' ? '#888888' : '#666666'}
                  fontSize={12}
                  tickFormatter={(value: string) => format(new Date(value), 'MMM d')}
                  dy={10}
                  tick={({ 
                    fill: theme === 'dark' ? '#888888' : '#666666',
                    angle: -45,
                    textAnchor: 'end',
                    dy: 8,
                    dx: -8
                  } as CustomAxisTick)}
                  tickLine={{ stroke: theme === 'dark' ? '#888888' : '#666666' }}
                  axisLine={{ stroke: theme === 'dark' ? '#888888' : '#666666' }}
                  interval={0}
                  height={60}
                />
                <YAxis
                  stroke={theme === 'dark' ? '#888888' : '#666666'}
                  fontSize={12}
                />
                <Tooltip
                  content={<CustomTooltip />}
                />
                <Line
                  type="monotone"
                  dataKey="wordsReviewed"
                  name="Words Reviewed"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="wordsLearned"
                  name="Words Learned"
                  stroke="#16a34a"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 