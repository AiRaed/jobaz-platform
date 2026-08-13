import { PathwayDetailExperience } from '@/components/career-engine/pathway/detail'

type PageProps = {
  params: Promise<{ roleId: string }>
}

/**
 * Dedicated Career Pathway Detail page (Batch 7).
 * Stable URL, refresh-safe, loads by library role id via pathway API.
 */
export default async function WorkInMyEducationPathwayPage({ params }: PageProps) {
  const { roleId } = await params
  const id = decodeURIComponent(roleId || '').trim()

  return <PathwayDetailExperience roleId={id} />
}
