import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface List {
  id: string
  name: string
  description: string | null
  category: string | null
  is_public: boolean
  created_at: string
  word_count: number
  progress: number
  user_id: string
}

interface ListCache {
  data: List | null
  error: Error | null
  timestamp: number
}

const CACHE_DURATION = 60000 // 1 minute
const listCache = new Map<string, ListCache>()

export function useList(listId: string | undefined, userId: string | undefined) {
  const [list, setList] = useState<List | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchList = async () => {
    if (!listId || !userId) {
      setIsLoading(false)
      return
    }

    try {
      // Check cache first
      const cached = listCache.get(listId)
      const now = Date.now()

      if (cached && now - cached.timestamp < CACHE_DURATION) {
        setList(cached.data)
        setError(cached.error)
        setIsLoading(false)
        return
      }

      const { data: listData, error: listError } = await supabase
        .from('lists')
        .select('*')
        .eq('id', listId)
        .single()

      if (listError) throw listError
      if (!listData) throw new Error('List not found')

      // Check user access
      if (listData.user_id !== userId) {
        throw new Error("You don't have access to this list")
      }

      // Update cache and state
      listCache.set(listId, {
        data: listData,
        error: null,
        timestamp: now
      })

      setList(listData)
      setError(null)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load list')
      
      // Cache error state
      listCache.set(listId, {
        data: null,
        error,
        timestamp: Date.now()
      })

      setList(null)
      setError(error)
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchList()
  }, [listId, userId])

  return { list, isLoading, error, refetch: fetchList }
} 