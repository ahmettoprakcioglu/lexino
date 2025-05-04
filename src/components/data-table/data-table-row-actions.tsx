import { Row } from "@tanstack/react-table"
import { Pencil, MoreHorizontal, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useNavigate } from "react-router-dom"
import { useParams } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { Word } from "./columns"

interface DataTableRowActionsProps {
  row: Row<Word>
  onDelete: () => void
}

export function DataTableRowActions({ row, onDelete }: DataTableRowActionsProps) {
  const navigate = useNavigate()
  const { listId } = useParams()
  const word = row.original
  
  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('words')
        .delete()
        .eq('id', word.id)

      if (error) throw error

      toast.success("Word deleted successfully")
      onDelete() // Refresh the table data after successful deletion
    } catch (error) {
      console.error("Error deleting word:", error)
      toast.error("Failed to delete word")
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem
          onClick={() => navigate(`/lists/${listId}/words/${word.id}/edit`)}
        >
          <Pencil className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              className="text-red-600 dark:text-red-400 hover:!text-red-600 dark:hover:!text-red-400 focus:bg-red-50 dark:focus:bg-red-950/50"
            >
              <Trash className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
              Delete
            </DropdownMenuItem>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the word
                "{word.original}" and its translation.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 