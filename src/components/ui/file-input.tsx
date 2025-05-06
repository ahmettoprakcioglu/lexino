import * as React from "react"
import { cn } from "@/lib/utils"

export interface FileInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  onFileSelect?: (file: File) => void
}

const FileInput = React.forwardRef<HTMLInputElement, FileInputProps>(
  ({ className, onFileSelect, ...props }, ref) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file && onFileSelect) {
        onFileSelect(file)
      }
    }

    return (
      <input
        type="file"
        className={cn(
          "file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0",
          "file:text-sm file:font-semibold file:bg-primary/10 file:text-primary",
          "hover:file:bg-primary/20 cursor-pointer",
          "text-sm text-muted-foreground",
          className
        )}
        onChange={handleChange}
        ref={ref}
        {...props}
      />
    )
  }
)
FileInput.displayName = "FileInput"

export { FileInput } 