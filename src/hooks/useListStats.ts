import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface ListStats {
  totalWords: number
  learned: number
  learning: number
  notLearned: number
  easy: number
  medium: number
  hard: number
  isLoading: boolean
  error: Error | null
}

export function useListStats(listId: string | undefined, refreshTrigger: number = 0): ListStats {
  const [stats, setStats] = useState<ListStats>({
    totalWords: 0,
    learned: 0,
    learning: 0,
    notLearned: 0,
    easy: 0,
    medium: 0,
    hard: 0,
    isLoading: true,
    error: null
  })

  useEffect(() => {
    const fetchStats = async () => {
      if (!listId) {
        setStats(s => ({ ...s, isLoading: false }))
        return
      }

      try {
        const { data: words, error } = await supabase
          .from('words')
          .select('difficulty, learning_status')
          .eq('list_id', listId)

        if (error) throw error

        const stats = words.reduce((acc, word) => {
          // Count by learning status
          if (word.learning_status === 'learned') acc.learned++
          else if (word.learning_status === 'learning') acc.learning++
          else acc.notLearned++

          // Count by difficulty
          if (word.difficulty === 'easy') acc.easy++
          else if (word.difficulty === 'medium') acc.medium++
          else if (word.difficulty === 'hard') acc.hard++

          return acc
        }, {
          learned: 0,
          learning: 0,
          notLearned: 0,
          easy: 0,
          medium: 0,
          hard: 0
        })

        setStats({
          ...stats,
          totalWords: words.length,
          isLoading: false,
          error: null
        })
      } catch (error) {
        setStats(s => ({
          ...s,
          isLoading: false,
          error: error instanceof Error ? error : new Error('Failed to fetch list stats')
        }))
      }
    }

    fetchStats()
  }, [listId, refreshTrigger])

  return stats
} 