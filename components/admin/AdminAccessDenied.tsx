import Link from 'next/link'
import { ArrowLeft, ShieldOff } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { APP_HOME_HREF } from '@/lib/navigation/appHome'

export default function AdminAccessDenied() {
  return (
    <AppShell>
      <div className="max-w-lg mx-auto py-16 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl border border-red-500/30 bg-red-950/20 mb-6">
          <ShieldOff className="w-8 h-8 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-slate-100 mb-3">Access denied — admin only</h1>
        <p className="text-sm text-slate-400 mb-8 leading-relaxed">
          This area is restricted to JobAZ administrators. If you believe you should have access, contact
          support.
        </p>
        <Link
          href={APP_HOME_HREF}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    </AppShell>
  )
}
