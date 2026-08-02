import Link from 'next/link'
import { ArrowLeft, Map } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import AdminSavedPlansPageClient from '@/components/admin/saved-plans/AdminSavedPlansPageClient'

export const metadata = {
  title: 'Saved Plans Admin | JobAZ',
  description: 'Career plans saved by users, route demand, next upgrades and course interest',
}

export default function AdminSavedPlansPage() {
  return (
    <AppShell>
      <header className="mb-8 pb-6 border-b border-slate-800/60">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Admin
        </Link>
        <div className="flex items-start gap-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl border border-violet-500/30 bg-violet-950/30 shrink-0">
            <Map className="w-6 h-6 text-violet-300" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-violet-300 mb-1">
              JobAZ Admin
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-50">Saved Plans</h1>
            <p className="text-sm text-slate-400 mt-2 max-w-2xl">
              Career plans saved by users, route demand, next upgrades and course interest.
            </p>
          </div>
        </div>
      </header>

      <AdminSavedPlansPageClient />
    </AppShell>
  )
}
