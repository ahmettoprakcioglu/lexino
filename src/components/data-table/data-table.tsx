"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  Row,
} from "@tanstack/react-table"
import { Word } from "./columns"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { DataTablePagination } from "./data-table-pagination.tsx"
import { DataTableToolbar } from "./data-table-toolbar.tsx"
import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/stores/auth.store"
import { DataTableRowActions } from "./data-table-row-actions.tsx"
import { debounce } from "lodash"
import { toast } from "sonner"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  listId: string
  onStatusChange?: () => void
}

export function DataTable<TData, TValue>({
  columns,
  listId,
  onStatusChange,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [data, setData] = useState<TData[]>([])
  const [totalRows, setTotalRows] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuthStore()
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })

  const handleStatusChange = async (wordId: string, newStatus: "not_learned" | "learning" | "learned") => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('words')
        .update({
          learning_status: newStatus,
          last_practiced: new Date().toISOString()
        })
        .eq('id', wordId)
        .eq('user_id', user.id)

      if (error) throw error

      // Update local state
      setData(prevData => 
        prevData.map(item => {
          const word = item as Word
          if (word.id === wordId) {
            return {
              ...word,
              learning_status: newStatus,
              last_practiced: new Date().toISOString()
            }
          }
          return item
        }) as TData[]
      )

      toast.success("Status updated successfully")
      onStatusChange?.()
    } catch (error) {
      console.error('Error updating word status:', error)
      toast.error('Failed to update status')
    }
  }

  const fetchData = useCallback(async () => {
    if (!user || !listId) return

    try {
      setIsLoading(true)

      // Start building the query
      let query = supabase
        .from('words')
        .select('*', { count: 'exact' })
        .eq('list_id', listId)
        .eq('user_id', user.id)

      // Apply sorting
      if (sorting.length > 0) {
        const { id, desc } = sorting[0]
        query = query.order(id as string, { ascending: !desc })
      } else {
        query = query.order('added_at', { ascending: false })
      }

      // Apply filters
      columnFilters.forEach(filter => {
        if (filter.id === 'difficulty' || filter.id === 'learning_status') {
          // For multi-select filters, use 'in' operator
          query = query.in(filter.id, filter.value as string[])
        } else {
          // For text search filters, use 'ilike' operator
          query = query.ilike(filter.id, `%${filter.value}%`)
        }
      })

      // Apply pagination
      const from = pagination.pageIndex * pagination.pageSize
      query = query.range(from, from + pagination.pageSize - 1)

      const { data: words, error, count } = await query

      if (error) throw error

      // Add onStatusChange handler to each word
      const wordsWithHandlers = words.map(word => ({
        ...word,
        onStatusChange: (newStatus: "not_learned" | "learning" | "learned") => 
          handleStatusChange(word.id, newStatus)
      }))

      setData(wordsWithHandlers as TData[])
      if (count !== null) setTotalRows(count)
    } catch (error) {
      console.error('Error fetching words:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user, listId, sorting, columnFilters, pagination.pageIndex, pagination.pageSize])

  // Debounced version of fetchData
  const debouncedFetchData = useCallback(
    debounce(() => {
      fetchData()
    }, 500),
    [fetchData]
  )

  useEffect(() => {
    // If the filter is for the search field (original column), use debounced fetch
    const isSearchFilter = columnFilters.some(filter => filter.id === 'original')
    if (isSearchFilter) {
      debouncedFetchData()
      // Cleanup the debounced function
      return () => debouncedFetchData.cancel()
    } else {
      // For other changes (sorting, pagination, etc.), fetch immediately
      fetchData()
    }
  }, [fetchData, debouncedFetchData, columnFilters])

  const table = useReactTable({
    data,
    columns: columns.map(col => {
      if (col.id === 'actions') {
        return {
          ...col,
          cell: ({ row }: { row: Row<Word> }) => (
            <DataTableRowActions row={row} onDelete={fetchData} />
          )
        } as ColumnDef<TData, TValue>
      }
      return col
    }),
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination: {
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize
      }
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    manualPagination: true,
    pageCount: Math.ceil(totalRows / pagination.pageSize),
  })

  return (
    <div className="space-y-4">
      <DataTableToolbar table={table} />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  )
} 