import * as React from "react"
import { Table } from "@tanstack/react-table"

export interface DataTableToolbarProps<TData> {
  table: Table<TData>
}

export declare function DataTableToolbar<TData>(props: DataTableToolbarProps<TData>): React.ReactElement; 