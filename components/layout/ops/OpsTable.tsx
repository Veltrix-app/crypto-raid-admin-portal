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
    <div className="overflow-hidden rounded-[28px] border border-white/6 bg-[linear-gradient(180deg,rgba(13,18,27,0.94),rgba(10,14,21,0.92))]">
      <div
        className="grid gap-4 border-b border-white/6 px-5 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-sub"
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
              "grid gap-4 border-b border-white/6 px-5 py-4 text-sm text-text last:border-b-0",
              rowClassName
            )}
            style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
          >
            {columns.map((column) => (
              <div key={column.key} className={cn("min-w-0", column.className)}>
                {column.render(row)}
              </div>
            ))}
          </div>
        ))
      ) : (
        <div className="px-5 py-8 text-sm text-sub">
          {emptyState ?? "No rows are available for this surface yet."}
        </div>
      )}
    </div>
  );
}
