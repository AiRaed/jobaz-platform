import { notFound } from 'next/navigation'
import CourseDetailView from '@/components/career-hub/marketplace/CourseDetailView'
import { fetchMarketplaceCourseBySlug } from '@/lib/career-hub/marketplace/fetch'
import { normalizeCourseSlug } from '@/lib/career-hub/marketplace/slug'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const course = await fetchMarketplaceCourseBySlug(normalizeCourseSlug(slug))
  if (!course) return { title: 'Course | JobAZ Career Hub' }
  return {
    title: `${course.title} | JobAZ Career Hub`,
    description: course.shortDescription,
  }
}

export default async function CourseDetailPage({ params }: Props) {
  const { slug } = await params
  const course = await fetchMarketplaceCourseBySlug(normalizeCourseSlug(slug))
  if (!course) notFound()
  return <CourseDetailView course={course} />
}
