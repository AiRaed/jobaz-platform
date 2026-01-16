import { CvData, CvTemplateId } from '@/app/cv-builder-v2/page'

interface CvPreviewProps {
  data: CvData
  template: CvTemplateId
}

export default function CvPreview({ data, template }: CvPreviewProps) {
  switch (template) {
    case 'atsClassic':
      return <AtsClassicTemplate data={data} />
    case 'twoColumnPro':
      return <TwoColumnProTemplate data={data} />
    default:
      return <AtsClassicTemplate data={data} />
  }
}

// Helper function to break long summary into paragraphs
function formatSummary(summary: string): string[] {
  if (!summary) return []
  // Simple heuristic: if summary is very long, try to break it into 2-3 paragraphs
  const words = summary.split(' ')
  if (words.length > 80) {
    // Try to find good break points (after periods, or at roughly 1/3 and 2/3)
    const third = Math.floor(words.length / 3)
    const twoThirds = Math.floor((words.length * 2) / 3)
    
    // Find nearest sentence end
    const findSentenceEnd = (startIdx: number) => {
      for (let i = startIdx; i < words.length; i++) {
        if (words[i].match(/[.!?]$/)) return i + 1
      }
      return startIdx + third
    }
    
    const firstBreak = findSentenceEnd(third)
    const secondBreak = findSentenceEnd(twoThirds)
    
    if (secondBreak < words.length) {
      return [
        words.slice(0, firstBreak).join(' '),
        words.slice(firstBreak, secondBreak).join(' '),
        words.slice(secondBreak).join(' ')
      ]
    } else if (firstBreak < words.length) {
      return [
        words.slice(0, firstBreak).join(' '),
        words.slice(firstBreak).join(' ')
      ]
    }
  }
  return [summary]
}

// ATS Classic Template - Single column, clean, minimal - International Professional Standard
function AtsClassicTemplate({ data }: { data: CvData }) {
  const summaryParagraphs = formatSummary(data.summary)
  // Filter empty experiences/educations only at render time (non-destructive)
  const experience = (data?.experience ?? []).filter(
    (exp) => exp.jobTitle?.trim() || exp.company?.trim()
  )
  const education = (data?.education ?? []).filter(
    (edu) => edu.degree?.trim() || edu.school?.trim()
  )
  const skills = data?.skills ?? []
  
  // Format contact info professionally
  const contactItems = []
  if (data.personalInfo.email) contactItems.push(data.personalInfo.email)
  if (data.personalInfo.phone) contactItems.push(data.personalInfo.phone)
  if (data.personalInfo.location) contactItems.push(data.personalInfo.location)
  if (data.personalInfo.linkedin) contactItems.push(`LinkedIn: ${data.personalInfo.linkedin}`)
  if (data.personalInfo.website) contactItems.push(data.personalInfo.website)
  
  return (
    <div className="cv-preview ats-classic text-[11.5px] leading-[1.5] text-[#1a1a1a] font-['Calibri','Arial',sans-serif]">
      {/* Professional Header */}
      <header className="mb-5 pb-3 border-b-2 border-[#2c2c2c]">
        <h1 className="text-[24px] font-bold tracking-[-0.02em] mb-1.5 text-[#000000] leading-tight">
          {data.personalInfo.fullName || 'Your Name'}
        </h1>
        {contactItems.length > 0 && (
          <div className="text-[11px] text-[#4a4a4a] leading-[1.4] flex flex-wrap gap-x-2.5 gap-y-0.5">
            {contactItems.map((item, idx) => (
              <span key={idx} className="whitespace-nowrap">{item}</span>
            ))}
          </div>
        )}
      </header>

      {/* Professional Summary */}
      {summaryParagraphs.length > 0 && (
        <section className="mb-4">
          <h2 className="text-[12.5px] font-bold uppercase tracking-[0.05em] text-[#000000] mb-3">
            Professional Summary
          </h2>
          <div className="space-y-1.5 mt-2">
            {summaryParagraphs.map((para, idx) => (
              <p key={idx} className="leading-[1.6] text-justify">{para}</p>
            ))}
          </div>
        </section>
      )}

      {/* Professional Experience */}
      {experience.length > 0 && (
        <section className="mb-4">
          <h2 className="text-[12.5px] font-bold uppercase tracking-[0.05em] text-[#000000] mb-3">
            Professional Experience
          </h2>
          <div className="mt-2 space-y-3.5">
            {experience.map((exp, idx) => (
              <div key={idx} className="break-inside-avoid">
                <div className="flex justify-between items-start mb-0.5">
                  <div className="flex-1">
                    <span className="font-semibold text-[12px]">{exp.jobTitle}</span>
                    {exp.company && <span className="text-[12px]">, {exp.company}</span>}
                  </div>
                  {(exp.startDate || exp.endDate) && (
                    <span className="text-[11px] text-[#4a4a4a] font-medium whitespace-nowrap ml-2">
                      {exp.startDate || ''} {exp.startDate && (exp.isCurrent ? '– Present' : exp.endDate ? `– ${exp.endDate}` : '')}
                    </span>
                  )}
                </div>
                {exp.location && (
                  <div className="text-[11px] text-[#666666] italic mb-1.5">{exp.location}</div>
                )}
                {exp.bullets.filter((b) => b.trim()).length > 0 && (
                  <ul className="list-none ml-0 space-y-0.5">
                    {exp.bullets.filter((b) => b.trim()).map((bullet, i) => (
                      <li key={i} className="leading-[1.5] flex items-start">
                        <span className="mr-1.5 text-[#2c2c2c] font-bold">•</span>
                        <span className="flex-1">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {education.length > 0 && (
        <section className="mb-4">
          <h2 className="text-[12.5px] font-bold uppercase tracking-[0.05em] text-[#000000] mb-3">
            Education
          </h2>
          <div className="mt-2 space-y-2.5">
            {education.map((edu, idx) => (
              <div key={idx} className="break-inside-avoid">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <span className="font-semibold text-[12px]">{edu.degree}</span>
                    {edu.school && <span className="text-[12px]">, {edu.school}</span>}
                  </div>
                  {edu.year && (
                    <span className="text-[11px] text-[#4a4a4a] font-medium whitespace-nowrap ml-2">
                      {edu.year}
                    </span>
                  )}
                </div>
                {edu.details && (
                  <div className="text-[11px] text-[#666666] mt-0.5 leading-[1.5]">{edu.details}</div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <section className="mb-4">
          <h2 className="text-[12.5px] font-bold uppercase tracking-[0.05em] text-[#000000] mb-3">
            Core Competencies
          </h2>
          <div className="mt-2 leading-[1.6]">
            {skills.join(' • ')}
          </div>
        </section>
      )}

      {/* Projects */}
      {data.projects && data.projects.length > 0 && (
        <section className="mb-4">
          <h2 className="text-[12.5px] font-bold uppercase tracking-[0.05em] text-[#000000] mb-3">
            Key Projects
          </h2>
          <div className="mt-2 space-y-2.5">
            {data.projects.map((project, idx) => (
              <div key={idx} className="break-inside-avoid">
                <div className="font-semibold text-[12px] mb-0.5">{project.name}</div>
                <div className="text-[11px] leading-[1.5] text-[#4a4a4a]">{project.description}</div>
                {project.url && (
                  <div className="text-[11px] text-[#0066cc] mt-0.5 break-all">{project.url}</div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Certifications */}
      {data.certifications && data.certifications.length > 0 && (
        <section className="mb-4">
          <h2 className="text-[12.5px] font-bold uppercase tracking-[0.05em] text-[#000000] mb-3">
            Certifications
          </h2>
          <ul className="mt-2 space-y-0.5 list-none ml-0">
            {data.certifications.map((cert, idx) => (
              <li key={idx} className="leading-[1.5] flex items-start">
                <span className="mr-1.5 text-[#2c2c2c] font-bold">•</span>
                <span className="flex-1">{cert}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Languages */}
      {data.languages && data.languages.length > 0 && (
        <section className="mb-4">
          <h2 className="text-[12.5px] font-bold uppercase tracking-[0.05em] text-[#000000] mb-3">
            Languages
          </h2>
          <div className="mt-2 leading-[1.6]">
            {data.languages.join(' • ')}
          </div>
        </section>
      )}

      {/* Publications */}
      {data.publications && data.publications.length > 0 && (
        <section className="mb-4">
          <h2 className="text-[12.5px] font-bold uppercase tracking-[0.05em] text-[#000000] mb-3">
            Publications
          </h2>
          <div className="mt-2 space-y-2.5">
            {data.publications.map((pub, idx) => {
              const parts: string[] = []
              
              // Title
              parts.push(pub.title)
              
              // Authors (Year). Venue/Journal
              const citationParts: string[] = []
              if (pub.authors) citationParts.push(pub.authors)
              if (pub.year) {
                citationParts.push(`(${pub.year})`)
              }
              if (citationParts.length > 0) {
                parts.push(citationParts.join(' '))
              }
              if (pub.venueOrJournal) {
                parts.push(pub.venueOrJournal)
              }
              if (pub.doiOrUrl) {
                parts.push(pub.doiOrUrl)
              }
              
              return (
                <div key={idx} className="break-inside-avoid">
                  <div className="text-[11.5px] leading-[1.5] text-[#1a1a1a]">
                    {parts.join(' — ')}
                  </div>
                  {pub.notes && (
                    <div className="text-[10.5px] leading-[1.4] text-[#4a4a4a] mt-1 italic">
                      {pub.notes}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}

// Two Column Pro Template - Professional sidebar layout - International Standard
function TwoColumnProTemplate({ data }: { data: CvData }) {
  const summaryParagraphs = formatSummary(data.summary)
  // Filter empty experiences/educations only at render time (non-destructive)
  const experience = (data?.experience ?? []).filter(
    (exp) => exp.jobTitle?.trim() || exp.company?.trim()
  )
  const education = (data?.education ?? []).filter(
    (edu) => edu.degree?.trim() || edu.school?.trim()
  )
  const skills = data?.skills ?? []
  
  return (
    <div className="cv-preview two-column-pro w-full h-full text-[11.5px] leading-[1.5] text-[#1a1a1a] font-['Calibri','Arial',sans-serif]">
      <div className="flex gap-3">
        {/* Left Sidebar - 32% width - Professional sidebar */}
        <aside className="w-[32%] pr-2.5 border-r border-[#d1d5db]">
          {/* Name Header in Sidebar */}
          <header className="mb-4 pb-3 border-b border-[#d1d5db]">
            <h1 className="text-[20px] font-bold tracking-[-0.02em] text-[#000000] leading-tight mb-2">
              {data.personalInfo.fullName || 'Your Name'}
            </h1>
          </header>

          {/* Contact */}
          <section className="mb-4">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#2c2c2c] mb-2">
              Contact Information
            </h2>
            <div className="border-t border-[#d1d5db] mb-2" />
            <div className="text-[10.5px] text-[#4a4a4a] space-y-1 leading-[1.4]">
              {data.personalInfo.email && <div className="break-words">{data.personalInfo.email}</div>}
              {data.personalInfo.phone && <div>{data.personalInfo.phone}</div>}
              {data.personalInfo.location && <div>{data.personalInfo.location}</div>}
              {data.personalInfo.linkedin && <div className="break-words">LinkedIn: {data.personalInfo.linkedin}</div>}
              {data.personalInfo.website && <div className="break-words">{data.personalInfo.website}</div>}
            </div>
          </section>

          {/* Skills */}
          {skills.length > 0 && (
            <section className="mb-4">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#2c2c2c] mb-2">
                Core Competencies
              </h2>
              <div className="border-t border-[#d1d5db] mb-2" />
              <div className="text-[10.5px] text-[#4a4a4a] leading-[1.6] space-y-0.5">
                {skills.map((skill, idx) => (
                  <div key={idx}>{skill}</div>
                ))}
              </div>
            </section>
          )}

          {/* Languages */}
          {data.languages && data.languages.length > 0 && (
            <section className="mb-4">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#2c2c2c] mb-2">
                Languages
              </h2>
              <div className="border-t border-[#d1d5db] mb-2" />
              <div className="text-[10.5px] text-[#4a4a4a] space-y-0.5 leading-[1.4]">
                {data.languages.map((lang, idx) => (
                  <div key={idx}>{lang}</div>
                ))}
              </div>
            </section>
          )}

          {/* Certifications */}
          {data.certifications && data.certifications.length > 0 && (
            <section className="mb-4">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#2c2c2c] mb-2">
                Certifications
              </h2>
              <div className="border-t border-[#d1d5db] mb-2" />
              <div className="text-[10.5px] text-[#4a4a4a] space-y-1 leading-[1.4]">
                {data.certifications.map((cert, idx) => (
                  <div key={idx}>{cert}</div>
                ))}
              </div>
            </section>
          )}

          {/* Publications */}
          {data.publications && data.publications.length > 0 && (
            <section className="mb-4">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#2c2c2c] mb-2">
                Publications
              </h2>
              <div className="border-t border-[#d1d5db] mb-2" />
              <div className="text-[10px] text-[#4a4a4a] space-y-2 leading-[1.4]">
                {data.publications.map((pub, idx) => {
                  const parts: string[] = []
                  parts.push(pub.title)
                  const citationParts: string[] = []
                  if (pub.authors) citationParts.push(pub.authors)
                  if (pub.year) citationParts.push(`(${pub.year})`)
                  if (citationParts.length > 0) parts.push(citationParts.join(' '))
                  if (pub.venueOrJournal) parts.push(pub.venueOrJournal)
                  if (pub.doiOrUrl) parts.push(pub.doiOrUrl)
                  return (
                    <div key={idx} className="break-inside-avoid">
                      <div>{parts.join(' — ')}</div>
                      {pub.notes && <div className="text-[9.5px] italic mt-0.5">{pub.notes}</div>}
                    </div>
                  )
                })}
              </div>
            </section>
          )}
        </aside>

        {/* Right Main Content - 68% width */}
        <main className="w-[68%] flex-1 pl-2">
          {/* Professional Summary */}
          {summaryParagraphs.length > 0 && (
            <section className="mb-4">
              <h2 className="text-[12.5px] font-bold uppercase tracking-[0.05em] text-[#000000] mb-3 border-b border-[#cccccc] pb-1">
                Professional Summary
              </h2>
              <div className="mt-2 space-y-1.5">
                {summaryParagraphs.map((para, idx) => (
                  <p key={idx} className="text-[11.5px] leading-[1.6] text-justify">{para}</p>
                ))}
              </div>
            </section>
          )}

          {/* Professional Experience */}
          {experience.length > 0 && (
            <section className="mb-4">
              <h2 className="text-[12.5px] font-bold uppercase tracking-[0.05em] text-[#000000] mb-3 border-b border-[#cccccc] pb-1">
                Professional Experience
              </h2>
              <div className="mt-2 space-y-3.5">
                {experience.map((exp, idx) => (
                  <div key={idx} className="break-inside-avoid">
                    <div className="flex justify-between items-start mb-0.5">
                      <div className="flex-1">
                        <span className="font-semibold text-[12px]">{exp.jobTitle}</span>
                        {exp.company && <span className="text-[12px]">, {exp.company}</span>}
                      </div>
                      {(exp.startDate || exp.endDate) && (
                        <span className="text-[11px] text-[#4a4a4a] font-medium whitespace-nowrap ml-2">
                          {exp.startDate || ''} {exp.startDate && (exp.isCurrent ? '– Present' : exp.endDate ? `– ${exp.endDate}` : '')}
                        </span>
                      )}
                    </div>
                    {exp.location && (
                      <div className="text-[11px] text-[#666666] italic mb-1.5">{exp.location}</div>
                    )}
                    {exp.bullets.filter((b) => b.trim()).length > 0 && (
                      <ul className="list-none ml-0 space-y-0.5">
                        {exp.bullets.filter((b) => b.trim()).map((bullet, i) => (
                          <li key={i} className="leading-[1.5] flex items-start text-[11.5px]">
                            <span className="mr-1.5 text-[#2c2c2c] font-bold">•</span>
                            <span className="flex-1">{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Education */}
          {education.length > 0 && (
            <section className="mb-4">
              <h2 className="text-[12.5px] font-bold uppercase tracking-[0.05em] text-[#000000] mb-3 border-b border-[#cccccc] pb-1">
                Education
              </h2>
              <div className="mt-2 space-y-2.5">
                {education.map((edu, idx) => (
                  <div key={idx} className="break-inside-avoid">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <span className="font-semibold text-[12px]">{edu.degree}</span>
                        {edu.school && <span className="text-[12px]">, {edu.school}</span>}
                      </div>
                      {edu.year && (
                        <span className="text-[11px] text-[#4a4a4a] font-medium whitespace-nowrap ml-2">
                          {edu.year}
                        </span>
                      )}
                    </div>
                    {edu.details && (
                      <div className="text-[11px] text-[#666666] mt-0.5 leading-[1.5]">{edu.details}</div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Projects */}
          {data.projects && data.projects.length > 0 && (
            <section className="mb-4">
              <h2 className="text-[12.5px] font-bold uppercase tracking-[0.05em] text-[#000000] mb-3 border-b border-[#cccccc] pb-1">
                Key Projects
              </h2>
              <div className="mt-2 space-y-2.5">
                {data.projects.map((project, idx) => (
                  <div key={idx} className="break-inside-avoid">
                    <div className="font-semibold text-[12px] mb-0.5">{project.name}</div>
                    <div className="text-[11px] text-[#4a4a4a] leading-[1.5]">{project.description}</div>
                    {project.url && (
                      <div className="text-[11px] text-[#0066cc] mt-0.5 break-all">{project.url}</div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  )
}
