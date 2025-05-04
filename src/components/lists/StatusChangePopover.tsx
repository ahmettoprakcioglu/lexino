import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatusChangePopoverProps {
  status: "not_learned" | "learning" | "learned"
  onStatusChange: (status: "not_learned" | "learning" | "learned") => void
}

const statusOptions = [
  {
    value: "not_learned",
    label: "Not Learned",
    variant: "not_learned" as const,
    className: "bg-background hover:bg-muted"
  },
  {
    value: "learning",
    label: "Learning",
    variant: "learning" as const,
    className: "bg-purple-100 dark:bg-purple-900/20 hover:bg-purple-100/80 dark:hover:bg-purple-900/30 text-purple-700 dark:text-purple-300"
  },
  {
    value: "learned",
    label: "Learned",
    variant: "learned" as const,
    className: "bg-green-100 dark:bg-green-900/20 hover:bg-green-100/80 dark:hover:bg-green-900/30 text-green-700 dark:text-green-300"
  }
]

export function StatusChangePopover({ status, onStatusChange }: StatusChangePopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Badge 
          variant={status}
          className="cursor-pointer hover:opacity-80"
        >
          {status.split("_").map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(" ")}
        </Badge>
      </PopoverTrigger>
      <PopoverContent className="w-[180px] p-2">
        <div className="flex flex-col space-y-1">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                option.className,
                status === option.value && "ring-2 ring-primary ring-offset-1"
              )}
              onClick={() => onStatusChange(option.value as "not_learned" | "learning" | "learned")}
            >
              <div className="w-4 h-4 flex items-center justify-center">
                {status === option.value && (
                  <Check className="h-4 w-4" />
                )}
              </div>
              {option.label}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
} 