import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface SpacedRepetitionParams {
  ease_factor: number
  review_interval: number
  review_count: number
}

// SuperMemo 2 Algorithm
const calculateNextReview = (
  quality: 0 | 1 | 2 | 3 | 4 | 5,
  params: SpacedRepetitionParams
): { ease_factor: number; review_interval: number } => {
  const { ease_factor, review_interval, review_count } = params
  
  // Calculate new ease factor
  let newEaseFactor = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  newEaseFactor = Math.max(1.3, newEaseFactor) // Minimum ease factor is 1.3
  
  // Calculate new interval
  let newInterval
  if (quality < 3) {
    newInterval = 1 // Reset interval if quality is poor
  } else if (review_count === 0) {
    newInterval = 1
  } else if (review_count === 1) {
    newInterval = 6
  } else {
    newInterval = Math.round(review_interval * newEaseFactor)
  }
  
  return { ease_factor: newEaseFactor, review_interval: newInterval }
}

export const useSpacedRepetition = (wordId: string) => {
  const [isUpdating, setIsUpdating] = useState(false)

  const updateWordReview = async (quality: 0 | 1 | 2 | 3 | 4 | 5) => {
    try {
      setIsUpdating(true)

      // Get current word data
      const { data: word, error: fetchError } = await supabase
        .from('words')
        .select('ease_factor, review_interval, review_count')
        .eq('id', wordId)
        .single()

      if (fetchError) throw fetchError

      // Calculate next review parameters
      const { ease_factor, review_interval } = calculateNextReview(quality, {
        ease_factor: word.ease_factor || 2.5,
        review_interval: word.review_interval || 0,
        review_count: word.review_count || 0
      })

      // Calculate next review date
      const nextReviewDate = new Date()
      nextReviewDate.setDate(nextReviewDate.getDate() + review_interval)

      // Update word with new spaced repetition data
      const { error: updateError } = await supabase
        .from('words')
        .update({
          ease_factor,
          review_interval,
          review_count: (word.review_count || 0) + 1,
          next_review_date: nextReviewDate.toISOString(),
          last_practiced: new Date().toISOString()
        })
        .eq('id', wordId)

      if (updateError) throw updateError

      return { success: true }
    } catch (error) {
      console.error('Error updating word review:', error)
      return { success: false, error }
    } finally {
      setIsUpdating(false)
    }
  }

  return {
    updateWordReview,
    isUpdating
  }
} 