'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, AlertTriangle, ExternalLink, FileText, MessageSquare, Mail, Search, Info } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import PageHeader from '@/components/PageHeader'
import { getCareerPathById, CAREER_PATHS } from '@/lib/career-paths'
import { cn } from '@/lib/utils'
import { LocationSearchModal } from '@/components/LocationSearchModal'

export default function CareerPathPage() {
  const router = useRouter()
  const params = useParams()
  const pathId = params.pathId as string
  const path = getCareerPathById(pathId)
  const [locationModalOpen, setLocationModalOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<{ 
    name: string
    externalLink?: string
    sourceType: 'GOV.UK' | 'National Careers Service' | 'Professional Body' | 'College' | 'Other'
  } | null>(null)

  if (!path) {
    return (
      <AppShell>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-slate-200 mb-4">Path Not Found</h1>
          <p className="text-slate-400 mb-6">The career path you're looking for doesn't exist.</p>
          <Link
            href="/build-your-path"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to All Paths
          </Link>
        </div>
      </AppShell>
    )
  }

  const handleCreateCV = () => {
    // Store the path info for CV builder to use
    if (typeof window !== 'undefined') {
      localStorage.setItem('jobaz_career_path', JSON.stringify({
        pathId: path.id,
        pathTitle: path.title,
        skills: path.requirements.certificates.concat(path.requirements.shortCourses)
      }))
    }
    router.push('/cv-builder-v2')
  }

  const handlePracticeInterview = () => {
    // Store the path info for interview coach
    if (typeof window !== 'undefined') {
      localStorage.setItem('jobaz_career_path', JSON.stringify({
        pathId: path.id,
        pathTitle: path.title,
        jobTitle: path.title
      }))
    }
    router.push('/interview-coach')
  }

  const handleWriteCoverLetter = () => {
    router.push('/cover')
  }

  // Mapping from path IDs to job search keywords
  const getJobSearchKeyword = (pathId: string): string => {
    const keywordMap: Record<string, string> = {
      'translator-interpreter': 'Interpreter',
      'electrician': 'Electrician',
      'plumbing-handyman': 'Plumber',
      'driving-transport': 'Delivery Driver',
      'security-facilities': 'Security Officer',
      'cleaner': 'Cleaner',
      'warehouse-logistics': 'Warehouse Operative',
      'office-admin': 'Admin Assistant',
      'care-support': 'Support Worker',
      'hospitality-front': 'Front of House',
      'teaching-support': 'Teaching Assistant',
      'construction-trades': 'Construction Worker',
      'digital-ai-beginner': 'Data Entry',
      'maintenance-facilities': 'Maintenance Worker',
      'self-employed-freelance': 'Freelance',
    }
    return keywordMap[pathId] || path.title
  }

  const handleFindJobs = () => {
    // Store the path info for job finder
    if (typeof window !== 'undefined') {
      localStorage.setItem('jobaz_career_path', JSON.stringify({
        pathId: path.id,
        pathTitle: path.title
      }))
    }
    
    // Get the job search keyword for this path
    const keyword = getJobSearchKeyword(path.id)
    
    // Navigate to job finder with query parameter
    const params = new URLSearchParams()
    params.set('query', keyword)
    params.set('location', 'UK (Anywhere)')
    
    router.push(`/job-finder?${params.toString()}`)
  }

  // Helper function to determine source type from course
  const getCourseSourceType = (course: { externalLink?: string; type: string; sourceType?: 'GOV.UK' | 'National Careers Service' | 'Professional Body' | 'College' | 'Other' }): 'GOV.UK' | 'National Careers Service' | 'Professional Body' | 'College' | 'Other' => {
    if (course.sourceType) {
      return course.sourceType
    }
    if (course.externalLink) {
      // Determine based on course type or external link domain
      if (course.type.toLowerCase().includes('college') || course.type.toLowerCase().includes('level')) {
        return 'College'
      }
      if (course.type.toLowerCase().includes('professional') || course.type.toLowerCase().includes('certification')) {
        return 'Professional Body'
      }
      return 'Other'
    }
    // Default to National Careers Service for official UK courses
    return 'National Careers Service'
  }

  // Handle direct links - all courses redirect to official sources
  const handleViewOfficialCourses = (sourceType: 'GOV.UK' | 'National Careers Service' | 'Professional Body' | 'College' | 'Other', externalLink?: string) => {
    if (sourceType === 'GOV.UK' || sourceType === 'National Careers Service') {
      window.open('https://nationalcareers.service.gov.uk/find-a-course', '_blank', 'noopener,noreferrer')
    } else if (sourceType === 'Professional Body' && externalLink) {
      window.open(externalLink, '_blank', 'noopener,noreferrer')
    } else {
      // For other types, still open National Careers Service as fallback
      window.open('https://nationalcareers.service.gov.uk/find-a-course', '_blank', 'noopener,noreferrer')
    }
  }

  const handleFindNearYou = (courseName: string, externalLink?: string, sourceType?: 'GOV.UK' | 'National Careers Service' | 'Professional Body' | 'College' | 'Other') => {
    setSelectedCourse({ 
      name: courseName,
      externalLink,
      sourceType: sourceType || 'National Careers Service'
    })
    setLocationModalOpen(true)
  }

  return (
    <AppShell>
      <PageHeader 
        title={path.title} 
        subtitle={path.description}
        showBackToDashboard={true}
        showBackToAllPaths={true}
      />

      {/* Page Content Header */}
      <div className="mb-8">
        <div className="flex items-start gap-4 mb-4">
          <div className="text-5xl">{path.icon}</div>
          <div className="flex-1">
            <p className="text-sm text-slate-400 italic">
              {path.whoFor}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* What this job really is */}
          <section className="rounded-2xl border border-slate-700/60 bg-slate-950/50 p-6">
            <h2 className="text-xl font-bold text-slate-200 mb-4">What this job really is</h2>
            {path.whatItIs.split('\n\n').map((paragraph, idx) => (
              <p key={idx} className="text-slate-300 leading-relaxed mb-3 last:mb-0">
                {paragraph}
              </p>
            ))}
          </section>

          {/* Do you need a degree? */}
          <section className="rounded-2xl border border-slate-700/60 bg-slate-950/50 p-6">
            <h2 className="text-xl font-bold text-slate-200 mb-4">Do you need a degree?</h2>
            <div className="flex items-center gap-3 mb-3">
              {path.needsDegree === 'no' && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/20 border border-green-500/30">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-semibold text-green-400">No</span>
                </div>
              )}
              {path.needsDegree === 'yes' && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-sm font-semibold text-red-400">Yes</span>
                </div>
              )}
              {path.needsDegree === 'sometimes' && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-500/20 border border-yellow-500/30">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-semibold text-yellow-400">Sometimes</span>
                </div>
              )}
            </div>
            {path.degreeExplanation && (
              <p className="text-slate-300 leading-relaxed">
                {path.degreeExplanation}
              </p>
            )}
            {!path.degreeExplanation && path.needsDegree === 'no' && (
              <p className="text-slate-300 leading-relaxed">
                This path does not require a university degree. You can get started with 
                short courses, certificates, and on-the-job training.
              </p>
            )}
            {path.id === 'electrician' && (
              <p className="text-slate-300 leading-relaxed mt-3">
                This path can lead to both employment and self-employment, depending on experience, certification, and registration with UK professional bodies.
              </p>
            )}
            {path.id === 'plumbing-handyman' && (
              <p className="text-slate-300 leading-relaxed mt-3">
                This path can lead to employment with companies or self-employment as an independent contractor, depending on experience, certification, and proper registration with UK authorities.
              </p>
            )}
            {path.id === 'driving-transport' && (
              <p className="text-slate-300 leading-relaxed mt-3">
                This path can lead to employment with logistics companies, public transport operators, or self-employment, depending on licence category, experience, and compliance with UK driving regulations.
              </p>
            )}
          </section>

          {/* What you actually need */}
          <section className="rounded-2xl border border-slate-700/60 bg-slate-950/50 p-6">
            <h2 className="text-xl font-bold text-slate-200 mb-4">What you actually need</h2>
            
            {path.requirements.shortCourses.length > 0 && (
              <div className="mb-6">
                <h3 className="text-base font-semibold text-slate-300 mb-3">Short Courses</h3>
                <ul className="space-y-2">
                  {path.requirements.shortCourses.map((course, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-300">{course}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {path.requirements.certificates.length > 0 && (
              <div className="mb-6">
                <h3 className="text-base font-semibold text-slate-300 mb-3">Certificates</h3>
                <ul className="space-y-2">
                  {path.requirements.certificates.map((cert, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-300">{cert}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {path.requirements.licences.length > 0 && (
              <div className="mb-6">
                <h3 className="text-base font-semibold text-slate-300 mb-3">Licences</h3>
                <ul className="space-y-2">
                  {path.requirements.licences.map((licence, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-300">{licence}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {path.requirements.languageLevel && (
              <div>
                <h3 className="text-base font-semibold text-slate-300 mb-3">Language Level</h3>
                <p className="text-sm text-slate-300">{path.requirements.languageLevel}</p>
              </div>
            )}

            {/* Regulatory Notice */}
            <div className="mt-6 pt-6 border-t border-amber-500/20">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-400/80 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-slate-400 leading-relaxed">
                  This career path is regulated. Always make sure that any course or qualification you choose is officially recognised by UK authorities or professional bodies (such as National Careers Service, CIOL, or ITI).
                </p>
              </div>
            </div>
          </section>

          {/* Reality Check */}
          <section className="rounded-2xl border border-amber-500/30 bg-amber-950/10 p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <h2 className="text-xl font-bold text-slate-200">Reality Check</h2>
            </div>
            
            <div className="mb-6">
              <h3 className="text-base font-semibold text-slate-300 mb-3">Challenges</h3>
              <ul className="space-y-2">
                {path.realityCheck.challenges.map((challenge, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">•</span>
                    <span className="text-sm text-slate-300">{challenge}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="text-base font-semibold text-slate-300 mb-3">Common Mistakes</h3>
              <ul className="space-y-2">
                {path.realityCheck.commonMistakes.map((mistake, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">•</span>
                    <span className="text-sm text-slate-300">{mistake}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-base font-semibold text-slate-300 mb-2">Time needed to become job-ready</h3>
              <p className="text-sm text-slate-300 font-medium">{path.realityCheck.timeToReady}</p>
            </div>
          </section>

          {/* Recommended Courses & Training */}
          <section className="rounded-2xl border border-slate-700/60 bg-slate-950/50 p-6">
            <h2 className="text-xl font-bold text-slate-200 mb-4">Recommended Courses & Training</h2>
            
            <div className="space-y-4 mb-6">
              {path.courses.map((course, idx) => {
                const sourceType = getCourseSourceType(course)
                
                // Source type badge colors and labels
                const sourceTypeConfig = {
                  'GOV.UK': { 
                    label: 'GOV.UK', 
                    style: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
                  },
                  'National Careers Service': { 
                    label: 'National Careers Service', 
                    style: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
                  },
                  'Professional Body': { 
                    label: 'Professional Body', 
                    style: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
                  },
                  'College': { 
                    label: 'College', 
                    style: 'bg-green-500/20 text-green-300 border-green-500/30',
                  },
                  'Other': { 
                    label: 'Other', 
                    style: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
                  },
                }

                const config = sourceTypeConfig[sourceType]
                const isOfficialCourse = sourceType === 'GOV.UK' || sourceType === 'National Careers Service'
                const isProfessionalBody = sourceType === 'Professional Body'

                return (
                  <div
                    key={idx}
                    className="p-5 rounded-lg border border-slate-700/50 bg-slate-900/30 hover:border-violet-500/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-base font-semibold text-slate-200">
                            {course.name}
                          </h3>
                          <span className={cn(
                            "px-2 py-0.5 rounded text-xs font-medium border",
                            config.style
                          )}>
                            {config.label}
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">Type:</span>
                            <span className="text-xs text-slate-300 font-medium">{course.type}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">Duration:</span>
                            <span className="text-xs text-slate-300">{course.duration}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">Funding:</span>
                            <span className="text-xs text-slate-300">{course.funding}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        {isOfficialCourse && (
                          <button
                            onClick={() => handleViewOfficialCourses(sourceType)}
                            className={cn(
                              "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                              "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white",
                              "hover:from-violet-500 hover:to-fuchsia-500",
                              "shadow-[0_0_12px_rgba(139,92,246,0.4)] hover:shadow-[0_0_18px_rgba(139,92,246,0.6)]"
                            )}
                          >
                            <ExternalLink className="w-4 h-4" />
                            View official courses
                          </button>
                        )}
                        {isProfessionalBody && course.externalLink && (
                          <button
                            onClick={() => handleViewOfficialCourses(sourceType, course.externalLink)}
                            className={cn(
                              "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                              "bg-slate-800/50 text-slate-200 border border-slate-700/50",
                              "hover:bg-slate-700/50 hover:border-slate-600/50"
                            )}
                          >
                            <ExternalLink className="w-4 h-4" />
                            Visit provider
                          </button>
                        )}
                        {!isOfficialCourse && !isProfessionalBody && (
                          <button
                            onClick={() => handleFindNearYou(course.name, course.externalLink, sourceType)}
                            className={cn(
                              "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                              "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white",
                              "hover:from-violet-500 hover:to-fuchsia-500",
                              "shadow-[0_0_12px_rgba(139,92,246,0.4)] hover:shadow-[0_0_18px_rgba(139,92,246,0.6)]"
                            )}
                          >
                            <ExternalLink className="w-4 h-4" />
                            View official courses
                          </button>
                        )}
                      </div>
                      {/* Helper text for all official courses */}
                      {(isOfficialCourse || isProfessionalBody) && (
                        <p className="text-xs text-slate-400 leading-relaxed">
                          You'll choose your location and course availability on the official National Careers Service website.
                        </p>
                      )}
                      {/* Specific note for First Aid Certificate */}
                      {course.name === 'First Aid Certificate' && (
                        <p className="text-xs text-slate-400 leading-relaxed mt-2">
                          First Aid courses are offered by many providers and are not specific to security roles. You'll be redirected to the official UK course search to choose a suitable option near you.
                        </p>
                      )}
                      {/* Specific note for Care Certificate in Care & Support path */}
                      {course.name === 'Care Certificate' && path.id === 'care-support' && (
                        <p className="text-xs text-slate-400 leading-relaxed mt-2">
                          Most care roles do not require you to pay for expensive courses upfront. The Care Certificate and mandatory training are often provided by employers after you're hired.
                        </p>
                      )}
                      {/* Specific note for Microsoft Office Skills in Office & Admin path */}
                      {course.name === 'Microsoft Office Skills' && path.id === 'office-admin' && (
                        <p className="text-xs text-slate-400 leading-relaxed mt-2">
                          Basic Microsoft Office skills are often gained through free online courses or on-the-job experience. Employers usually focus on practical ability rather than paid certificates.
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Transparency note for Teaching & School Support */}
            {path.id === 'teaching-support' && (
              <div className="mt-4 p-3 rounded-lg bg-slate-800/30 border border-slate-700/50">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Teaching and school support training is often provided by colleges, local authorities, or directly through schools. Some official course links may show a wide range of results or redirect to local providers, but qualifications remain valid when obtained through recognised UK education bodies and safeguarding requirements.
                </p>
              </div>
            )}

            {/* Transparency note for Maintenance & Facilities */}
            {path.id === 'maintenance-facilities' && (
              <div className="mt-4 p-3 rounded-lg bg-slate-800/30 border border-slate-700/50">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Maintenance and facilities training is delivered by a wide range of colleges and local providers. Some official course links may return broad or varied results, but qualifications are valid when completed through recognised UK bodies and when legal limits of non-qualified electrical or plumbing work are followed.
                </p>
              </div>
            )}

            {/* Global helper text */}
            {path.courseTransparencyNote && (
              <div className="mt-4 p-4 rounded-lg border border-slate-600/50 bg-slate-800/30">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {path.courseTransparencyNote}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-4 p-3 rounded-lg bg-slate-800/30 border border-slate-700/50">
              <p className="text-xs text-slate-400 leading-relaxed">
                Course availability, funding, and locations are managed by official UK providers.
              </p>
            </div>

            <div className="p-4 rounded-lg border border-amber-500/30 bg-amber-950/10">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-slate-300">
                  {path.courseWarning}
                </p>
              </div>
            </div>
          </section>

          {/* Boost Your Chances */}
          <section className="rounded-2xl border border-violet-500/30 bg-violet-950/10 p-6">
            <h2 className="text-xl font-bold text-slate-200 mb-4">Boost Your Chances</h2>
            <p className="text-sm text-slate-300 mb-4">
              These general skills help with almost any job and show employers you're serious:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border border-slate-700/50 bg-slate-900/30">
                <h3 className="text-sm font-semibold text-slate-200 mb-2">English for Work</h3>
                <p className="text-xs text-slate-400">
                  Improve your workplace English - helps with applications, interviews, and daily work.
                </p>
              </div>
              <div className="p-4 rounded-lg border border-slate-700/50 bg-slate-900/30">
                <h3 className="text-sm font-semibold text-slate-200 mb-2">Health & Safety</h3>
                <p className="text-xs text-slate-400">
                  Basic health and safety knowledge is required for many jobs.
                </p>
              </div>
              <div className="p-4 rounded-lg border border-slate-700/50 bg-slate-900/30">
                <h3 className="text-sm font-semibold text-slate-200 mb-2">First Aid</h3>
                <p className="text-xs text-slate-400">
                  First aid certificates are valuable and show responsibility.
                </p>
              </div>
              <div className="p-4 rounded-lg border border-slate-700/50 bg-slate-900/30">
                <h3 className="text-sm font-semibold text-slate-200 mb-2">Manual Handling</h3>
                <p className="text-xs text-slate-400">
                  Essential for any job involving lifting or moving objects.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar - JobAZ AI Integration */}
        <div className="lg:col-span-1">
          <div className="sticky top-8 rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-950/20 to-fuchsia-950/20 p-6">
            <h2 className="text-xl font-bold text-slate-200 mb-2">
              Prepare with JobAZ
            </h2>
            <p className="text-sm text-slate-400 mb-6">
              Once you're ready to apply, use JobAZ tools to create professional applications, 
              practice for interviews, and improve your English for work.
            </p>

            <div className="space-y-3">
              <button
                onClick={handleCreateCV}
                className="w-full flex items-center gap-3 p-4 rounded-lg border border-violet-500/30 bg-slate-950/50 hover:border-violet-400/50 hover:bg-violet-500/10 transition-colors text-left"
              >
                <FileText className="w-5 h-5 text-violet-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-200">Create a CV for this path</div>
                  <div className="text-xs text-slate-400">CV Builder with path-based suggestions</div>
                </div>
              </button>

              <button
                onClick={handleWriteCoverLetter}
                className="w-full flex items-center gap-3 p-4 rounded-lg border border-violet-500/30 bg-slate-950/50 hover:border-violet-400/50 hover:bg-violet-500/10 transition-colors text-left"
              >
                <Mail className="w-5 h-5 text-violet-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-200">Write a cover letter for this role</div>
                  <div className="text-xs text-slate-400">Cover Letter AI</div>
                </div>
              </button>

              <button
                onClick={handleFindJobs}
                className="w-full flex items-center gap-3 p-4 rounded-lg border border-violet-500/30 bg-slate-950/50 hover:border-violet-400/50 hover:bg-violet-500/10 transition-colors text-left"
              >
                <Search className="w-5 h-5 text-violet-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-200">Find related jobs</div>
                  <div className="text-xs text-slate-400">Job Finder filtered by this path</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Location Search Modal */}
      {selectedCourse && (
        <LocationSearchModal
          isOpen={locationModalOpen}
          onClose={() => {
            setLocationModalOpen(false)
            setSelectedCourse(null)
          }}
          courseName={selectedCourse.name}
          externalLink={selectedCourse.externalLink}
          sourceType={selectedCourse.sourceType}
        />
      )}
    </AppShell>
  )
}


