"use client";

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  type RowSelectionState,
  type Row,
} from "@tanstack/react-table";
import { useState, type ReactNode } from "react";
import { ChevronDownIcon, ChevronUpIcon, DownloadIcon, ChevronsUpDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { EmptyState } from "./empty-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

export interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  pageSize?: number;
  filterColumn?: string;
  filterPlaceholder?: string;
  filterNode?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  exportFileName?: string;
  onRowClick?: (row: Row<TData>) => void;
  rowClassName?: (row: Row<TData>) => string | undefined;
  loading?: boolean;
}

export function DataTable<TData>({
  data,
  columns,
  pageSize = 25,
  filterNode,
  emptyTitle = "No results",
  emptyDescription,
  exportFileName,
  onRowClick,
  rowClassName,
  loading,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, columnVisibility, rowSelection },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  });

  function handleExport() {
    const headers = table
      .getAllColumns()
      .filter((c) => c.getIsVisible())
      .map((c) => c.id);

    const rows = table.getFilteredRowModel().rows.map((r) =>
      headers.map((h) => {
        const cell = r.getAllCells().find((c) => c.column.id === h);
        const val = cell?.getValue();
        if (val === null || val === undefined) return "";
        if (typeof val === "object") return JSON.stringify(val);
        return String(val);
      })
    );

    const csv = [headers, ...rows]
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${exportFileName ?? "export"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const { pageIndex, pageSize: ps } = table.getState().pagination;
  const total = table.getFilteredRowModel().rows.length;
  const from = total === 0 ? 0 : pageIndex * ps + 1;
  const to = Math.min((pageIndex + 1) * ps, total);

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      {(filterNode || exportFileName) && (
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1">{filterNode}</div>
          {exportFileName && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<DownloadIcon className="w-4 h-4" />}
              onClick={handleExport}
            >
              Export CSV
            </Button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border border-border overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-border">
                {hg.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      className={cn(
                        "h-10 px-4 text-left align-middle text-xs font-medium text-muted-foreground",
                        canSort && "cursor-pointer select-none hover:text-foreground"
                      )}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                      style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                    >
                      <span className="inline-flex items-center gap-1">
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                        {canSort && (
                          <span className="text-muted-foreground/50">
                            {sorted === "asc" ? (
                              <ChevronUpIcon className="w-3.5 h-3.5" />
                            ) : sorted === "desc" ? (
                              <ChevronDownIcon className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronsUpDownIcon className="w-3.5 h-3.5" />
                            )}
                          </span>
                        )}
                      </span>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="h-32 text-center text-muted-foreground text-sm">
                  Loading…
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={cn(
                    "border-b border-border last:border-0 hover:bg-muted/40 transition-colors",
                    onRowClick && "cursor-pointer",
                    rowClassName?.(row)
                  )}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-2.5 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > ps && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {from}–{to} of {total}
          </span>
          <div className="flex items-center gap-2">
            <Select
              value={String(ps)}
              onValueChange={(v) => table.setPageSize(Number(v))}
            >
              <SelectTrigger className="h-8 w-[72px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 100].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
            >
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
