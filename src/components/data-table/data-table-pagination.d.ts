import * as React from "react"
import { Table } from "@tanstack/react-table"

export interface DataTablePaginationProps<TData> {
  table: Table<TData>
}

export declare function DataTablePagination<TData>(props: DataTablePaginationProps<TData>): React.ReactElement; 