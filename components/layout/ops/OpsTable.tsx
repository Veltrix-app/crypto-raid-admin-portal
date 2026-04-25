"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type OpsTableColumn<T> = {
  key: string;
  label: string;
  className?: string;
  render: (row: T) => ReactNode;
};

type OpsTableProps<T> = {
  columns: OpsTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  emptyState?: ReactNode;
  rowClassName?: string;
};

export default function OpsTable<T>({
  columns,
  rows,
  getRowKey,
  emptyState,
  rowClassName,
}: OpsTableProps<T>) {
  return (
    <div className="overflow-x-auto overflow-y-hidden rounded-[18px] border border-white/[0.028] bg-[linear-gradient(180deg,rgba(13,18,27,0.92),rgba(10,14,21,0.9))]">
      <div
        className="grid min-w-[680px] gap-3 border-b border-white/[0.028] px-3.5 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-sub"
        style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
      >
        {columns.map((column) => (
          <div key={column.key} className={column.className}>
            {column.label}
          </div>
        ))}
      </div>

      {rows.length > 0 ? (
        rows.map((row) => (
          <div
            key={getRowKey(row)}
            className={cn(
              "grid min-w-[680px] gap-3 border-b border-white/[0.026] px-3.5 py-3 text-[13px] text-text last:border-b-0",
              rowClassName
            )}
            style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
          >
            {columns.map((column) => (
              <div key={column.key} className={cn("min-w-0 break-words [overflow-wrap:anywhere]", column.className)}>
                {column.render(row)}
              </div>
            ))}
          </div>
        ))
      ) : (
        <div className="px-4 py-6 text-sm text-sub">
          {emptyState ?? "No rows are available for this surface yet."}
        </div>
      )}
    </div>
  );
}
