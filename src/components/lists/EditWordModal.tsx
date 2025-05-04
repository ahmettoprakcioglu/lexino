import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pencil } from "lucide-react"
import { StatusChangePopover } from "./StatusChangePopover"

interface Word {
  id: string
  original: string
  translation: string
  example?: string
  pronunciation?: string
  difficulty: "easy" | "medium" | "hard"
  learningStatus: "learned" | "learning" | "not_learned"
}

interface EditWordModalProps {
  word: Word
  onEditWord: (id: string, updates: Partial<Word>) => void
}

export function EditWordModal({ word, onEditWord }: EditWordModalProps) {
  const [open, setOpen] = useState(false)
  const [original, setOriginal] = useState(word.original)
  const [translation, setTranslation] = useState(word.translation)
  const [example, setExample] = useState(word.example || "")
  const [pronunciation, setPronunciation] = useState(word.pronunciation || "")
  const [difficulty, setDifficulty] = useState(word.difficulty)
  const [learningStatus, setLearningStatus] = useState(word.learningStatus)

  useEffect(() => {
    if (open) {
      setOriginal(word.original)
      setTranslation(word.translation)
      setExample(word.example || "")
      setPronunciation(word.pronunciation || "")
      setDifficulty(word.difficulty)
      setLearningStatus(word.learningStatus)
    }
  }, [open, word])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onEditWord(word.id, {
      original,
      translation,
      example: example || undefined,
      pronunciation: pronunciation || undefined,
      difficulty,
      learningStatus,
    })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Word</DialogTitle>
            <DialogDescription>
              Make changes to the word. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="original" className="text-right">
                Word
              </Label>
              <Input
                id="original"
                value={original}
                onChange={(e) => setOriginal(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="translation" className="text-right">
                Translation
              </Label>
              <Input
                id="translation"
                value={translation}
                onChange={(e) => setTranslation(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="example" className="text-right">
                Example
              </Label>
              <Textarea
                id="example"
                value={example}
                onChange={(e) => setExample(e.target.value)}
                className="col-span-3"
                placeholder="Enter an example sentence"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pronunciation" className="text-right">
                Pronunciation
              </Label>
              <Input
                id="pronunciation"
                value={pronunciation}
                onChange={(e) => setPronunciation(e.target.value)}
                className="col-span-3"
                placeholder="Optional pronunciation guide"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="difficulty" className="text-right">
                Difficulty
              </Label>
              <Select value={difficulty} onValueChange={(value: "easy" | "medium" | "hard") => setDifficulty(value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <div className="col-span-3">
                <StatusChangePopover
                  status={learningStatus}
                  onStatusChange={setLearningStatus}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 