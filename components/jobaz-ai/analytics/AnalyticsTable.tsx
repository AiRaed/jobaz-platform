import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type AnalyticsTableColumn<T> = {
  key: string
  header: string
  align?: 'left' | 'right'
  render: (row: T) => ReactNode
}

type AnalyticsTableProps<T> = {
  columns: AnalyticsTableColumn<T>[]
  rows: T[]
  emptyMessage?: string
  getRowKey: (row: T, index: number) => string
  className?: string
}

export default function AnalyticsTable<T>({
  columns,
  rows,
  emptyMessage = 'No data yet.',
  getRowKey,
  className,
}: AnalyticsTableProps<T>) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-gray-700 bg-[#141414] px-4 py-8 text-center text-sm text-gray-500">
        {emptyMessage}
      </p>
    )
  }

  return (
    <div className={cn('overflow-x-auto rounded-lg border border-gray-800', className)}>
      <table className="w-full min-w-[320px] text-left text-sm">
        <thead>
          <tr className="border-b border-gray-800 bg-[#141414]">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500',
                  col.align === 'right' && 'text-right'
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={getRowKey(row, index)}
              className="border-b border-gray-800/80 last:border-0 hover:bg-[#1a1a1a]/80"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    'px-4 py-3 text-gray-300',
                    col.align === 'right' && 'text-right tabular-nums'
                  )}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
