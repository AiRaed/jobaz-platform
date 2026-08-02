import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/auth/admin'
import { buildAuthLoginUrl } from '@/lib/auth/redirect'
import AdminAccessDenied from '@/components/admin/AdminAccessDenied'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession()

  if (!session.ok) {
    if (session.reason === 'unauthenticated') {
      redirect(buildAuthLoginUrl('/admin'))
    }
    return <AdminAccessDenied />
  }

  return children
}
