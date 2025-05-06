import { create } from 'zustand'

interface MatchingWord {
  id: string
  original: string
  translation: string
  isMatched: boolean
  isSelected: boolean
  matchColor?: string
  side: 'original' | 'translation'
}

interface MatchingState {
  words: MatchingWord[]
  score: number
  attempts: number
  gameComplete: boolean
  selectedOriginal: MatchingWord | null
  selectedTranslation: MatchingWord | null
  setWords: (words: MatchingWord[]) => void
  setScore: (score: number) => void
  setAttempts: (attempts: number) => void
  setGameComplete: (gameComplete: boolean) => void
  setSelectedOriginal: (word: MatchingWord | null) => void
  setSelectedTranslation: (word: MatchingWord | null) => void
  resetGame: () => void
}

export const useMatchingStore = create<MatchingState>((set) => ({
  words: [],
  score: 0,
  attempts: 0,
  gameComplete: false,
  selectedOriginal: null,
  selectedTranslation: null,
  setWords: (words) => set({ words }),
  setScore: (score) => set({ score }),
  setAttempts: (attempts) => set({ attempts }),
  setGameComplete: (gameComplete) => set({ gameComplete }),
  setSelectedOriginal: (word) => set({ selectedOriginal: word }),
  setSelectedTranslation: (word) => set({ selectedTranslation: word }),
  resetGame: () => set({
    words: [],
    score: 0,
    attempts: 0,
    gameComplete: false,
    selectedOriginal: null,
    selectedTranslation: null,
  }),
})) 