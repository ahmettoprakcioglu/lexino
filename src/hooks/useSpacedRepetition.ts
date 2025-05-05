import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { addDays, startOfDay } from 'date-fns'

interface Word {
  id: string
  user_id: string
  list_id: string
  learning_status: 'not_learned' | 'learning' | 'learned'
  ease_factor: number
  review_interval: number
  review_count: number
  streak_count: number
  best_streak: number
  review_history: Array<{
    quality: number
    date: string
    interval: number
  }>
}

interface SpacedRepetitionParams {
  ease_factor: number
  review_interval: number
  review_count: number
  streak_count: number
  best_streak: number
  review_history: Array<{
    quality: number
    date: string
    interval: number
  }>
}

// Enhanced SuperMemo 2 Algorithm with advanced spacing and performance tracking
const calculateNextReview = (
  quality: 0 | 1 | 2 | 3 | 4 | 5,
  params: SpacedRepetitionParams
): {
  ease_factor: number
  review_interval: number
  streak_count: number
  best_streak: number
  review_history: Array<{
    quality: number
    date: string
    interval: number
  }>
} => {
  const {
    ease_factor,
    review_interval,
    review_count,
    streak_count,
    best_streak,
    review_history
  } = params

  // Calculate new ease factor with weighted recent performance
  const recentPerformance = review_history
    .slice(-5)
    .reverse()
    .reduce((acc, review, index) => {
      const weight = 1 / Math.pow(2, index) // More recent reviews have higher weight
      return acc + review.quality * weight
    }, 0) / review_history.slice(-5).reduce((acc, _, index) => acc + 1 / Math.pow(2, index), 0) || quality

  let newEaseFactor = ease_factor + (0.1 - (5 - recentPerformance) * (0.08 + (5 - recentPerformance) * 0.02))
  newEaseFactor = Math.max(1.3, Math.min(2.5, newEaseFactor)) // Keep ease factor between 1.3 and 2.5

  // Calculate streak changes with bonus for consistent high performance
  let newStreakCount = streak_count
  let newBestStreak = best_streak

  if (quality >= 4) {
    newStreakCount++
    if (newStreakCount > newBestStreak) {
      newBestStreak = newStreakCount
    }
  } else if (quality < 3) {
    newStreakCount = 0
  }

  // Calculate new interval with sophisticated spacing
  let newInterval
  if (quality < 3) {
    newInterval = 1 // Reset interval if quality is poor
  } else if (review_count === 0) {
    newInterval = 1
  } else if (review_count === 1) {
    newInterval = quality >= 4 ? 3 : 2 // Shorter interval for moderate performance
  } else {
    // Add performance-based randomization
    const performanceFactor = quality >= 4 ? 1.1 : quality === 3 ? 1.0 : 0.9
    const randomFactor = 0.95 + Math.random() * 0.1 // Random factor between 0.95 and 1.05
    const streakBonus = Math.min(streak_count * 0.05, 0.2) // Max 20% bonus from streak
    newInterval = Math.round(review_interval * newEaseFactor * performanceFactor * (1 + streakBonus) * randomFactor)
  }

  // Add the current review to history with enhanced tracking
  const newReviewHistory = [
    ...review_history,
    {
      quality,
      date: new Date().toISOString(),
      interval: newInterval
    }
  ].slice(-10) // Keep only last 10 reviews for performance

  return {
    ease_factor: newEaseFactor,
    review_interval: newInterval,
    streak_count: newStreakCount,
    best_streak: newBestStreak,
    review_history: newReviewHistory
  }
}

export const useSpacedRepetition = (wordId: string) => {
  const [isUpdating, setIsUpdating] = useState(false)

  const updateWordReview = async (quality: 0 | 1 | 2 | 3 | 4 | 5) => {
    try {
      setIsUpdating(true)

      // Get current word data
      const { data: word, error: fetchError } = await supabase
        .from('words')
        .select('*')
        .eq('id', wordId)
        .single()

      if (fetchError) throw fetchError

      // Calculate next review parameters
      const {
        ease_factor,
        review_interval,
        streak_count,
        best_streak,
        review_history
      } = calculateNextReview(quality, {
        ease_factor: word.ease_factor || 2.5,
        review_interval: word.review_interval || 0,
        review_count: word.review_count || 0,
        streak_count: word.streak_count || 0,
        best_streak: word.best_streak || 0,
        review_history: word.review_history || []
      })

      // Calculate next review date
      const nextReviewDate = addDays(startOfDay(new Date()), review_interval)

      // Update learning status based on performance and history
      let learning_status = word.learning_status as Word['learning_status']
      const recentSuccessRate = review_history
        .slice(-5)
        .filter(review => review.quality >= 4).length / Math.min(review_history.length, 5)

      if (quality >= 4 && word.review_count > 3 && recentSuccessRate >= 0.8) {
        learning_status = 'learned'
      } else if (quality < 3 || recentSuccessRate < 0.6) {
        learning_status = 'learning'
      }

      // Update word with new spaced repetition data
      const { error: updateError } = await supabase
        .from('words')
        .update({
          ease_factor,
          review_interval,
          review_count: (word.review_count || 0) + 1,
          streak_count,
          best_streak,
          review_history,
          next_review_date: nextReviewDate.toISOString(),
          last_practiced: new Date().toISOString(),
          learning_status
        })
        .eq('id', wordId)

      if (updateError) throw updateError

      // Update daily streak in learning_streaks
      const today = startOfDay(new Date())
      const { data: existingStreak, error: streakError } = await supabase
        .from('learning_streaks')
        .select('*')
        .eq('user_id', word.user_id)
        .eq('list_id', word.list_id)
        .eq('date', today.toISOString().split('T')[0])
        .single()

      if (!streakError && existingStreak) {
        await supabase
          .from('learning_streaks')
          .update({
            words_reviewed: existingStreak.words_reviewed + 1,
            words_learned: quality >= 4 ? existingStreak.words_learned + 1 : existingStreak.words_learned
          })
          .eq('id', existingStreak.id)
      } else {
        await supabase
          .from('learning_streaks')
          .insert([
            {
              user_id: word.user_id,
              list_id: word.list_id,
              date: today.toISOString().split('T')[0],
              words_reviewed: 1,
              words_learned: quality >= 4 ? 1 : 0
            }
          ])
      }

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