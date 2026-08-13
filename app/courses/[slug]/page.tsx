import JsonLd from '@/components/seo/JsonLd'
import CourseDetailView from '@/components/career-hub/marketplace/CourseDetailView'
import { fetchMarketplaceCourseBySlug } from '@/lib/career-hub/marketplace/fetch'
import { normalizeCourseSlug } from '@/lib/career-hub/marketplace/slug'
import { buildCourseJsonLd, buildCourseMetadata } from '@/lib/seo/courseMetadata'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const course = await fetchMarketplaceCourseBySlug(normalizeCourseSlug(slug))
  if (!course) {
    return {
      title: 'Course | JobAZ',
      robots: { index: false, follow: false },
    }
  }
  return buildCourseMetadata(course)
}

export default async function CourseDetailPage({ params }: Props) {
  const { slug } = await params
  const course = await fetchMarketplaceCourseBySlug(normalizeCourseSlug(slug))
  if (!course) notFound()

  return (
    <>
      <JsonLd data={buildCourseJsonLd(course)} />
      <CourseDetailView course={course} />
    </>
  )
}
