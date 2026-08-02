'use client'

import { Database } from 'lucide-react'

export default function ProfileMigrationBanner() {
  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-950/30 backdrop-blur p-5 text-sm text-amber-100/90">
      <div className="flex gap-3">
        <Database className="w-5 h-5 shrink-0 text-amber-400" />
        <div>
          <p className="font-semibold text-amber-200">Identity profile tables not found</p>
          <p className="mt-1 text-amber-100/80 leading-relaxed">
            Run the migration{' '}
            <code className="text-xs bg-slate-900/80 px-1.5 py-0.5 rounded">
              supabase/migrations/20250529000000_create_identity_profiles.sql
            </code>{' '}
            in the Supabase SQL Editor, then refresh this page.
          </p>
        </div>
      </div>
    </div>
  )
}
