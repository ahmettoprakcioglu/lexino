import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AddWordModalProps {
  onAddWord: (word: {
    original: string
    translation: string
    example?: string
    pronunciation?: string
    difficulty: "easy" | "medium" | "hard"
  }) => void
}

export function AddWordModal({ onAddWord }: AddWordModalProps) {
  const [open, setOpen] = useState(false)
  const [original, setOriginal] = useState("")
  const [translation, setTranslation] = useState("")
  const [example, setExample] = useState("")
  const [pronunciation, setPronunciation] = useState("")
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAddWord({
      original,
      translation,
      example,
      pronunciation,
      difficulty,
    })
    setOpen(false)
    // Reset form
    setOriginal("")
    setTranslation("")
    setExample("")
    setPronunciation("")
    setDifficulty("medium")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Word</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Word</DialogTitle>
            <DialogDescription>
              Add a new word to your list. Fill in the details below.
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
          </div>
          <DialogFooter>
            <Button type="submit">Add Word</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 