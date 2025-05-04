import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTableColumnHeader } from "./data-table-column-header"
import { DataTableRowActions } from "./data-table-row-actions"
import { format } from "date-fns"
import { StatusChangePopover } from "@/components/lists/StatusChangePopover"

export type Word = {
  id: string
  original: string
  translation: string
  example: string | null
  pronunciation: string | null
  difficulty: "easy" | "medium" | "hard"
  learning_status: "not_learned" | "learning" | "learned"
  added_at: string
  last_practiced: string | null
  list_id: string
  user_id: string
  onStatusChange?: (newStatus: "not_learned" | "learning" | "learned") => void
}

export const columns: ColumnDef<Word>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "original",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Word" />
    ),
  },
  {
    accessorKey: "translation",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Translation" />
    ),
  },
  {
    accessorKey: "example",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Example" />
    ),
    cell: ({ row }) => {
      const example = row.getValue("example") as string | null
      return example ? (
        <span className="max-w-[500px] truncate">{example}</span>
      ) : null
    },
  },
  {
    accessorKey: "difficulty",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Difficulty" />
    ),
    cell: ({ row }) => {
      const difficulty = row.getValue("difficulty") as string
      return (
        <Badge variant={
          difficulty === "easy" ? "default" :
          difficulty === "medium" ? "secondary" :
          "destructive"
        }>
          {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "learning_status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("learning_status") as "not_learned" | "learning" | "learned"
      return (
        <div className="flex items-center gap-2">
          <StatusChangePopover 
            status={status} 
            onStatusChange={(newStatus) => row.original.onStatusChange?.(newStatus)} 
          />
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "added_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Added" />
    ),
    cell: ({ row }) => format(new Date(row.getValue("added_at")), "MMM d, yyyy"),
  },
  {
    accessorKey: "last_practiced",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Last Practiced" />
    ),
    cell: ({ row }) => {
      const date = row.getValue("last_practiced") as string | null
      return date ? format(new Date(date), "MMM d, yyyy") : "Never"
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} onDelete={() => {}} />,
  },
] 