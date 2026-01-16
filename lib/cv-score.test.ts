/**
 * Simple test cases for CV scoring logic
 * Run with: npx tsx lib/cv-score.test.ts (or similar)
 */

import { computeCvScore } from './cv-score'
import type { CvData } from '@/app/cv-builder-v2/page'

// Test helper
function testCase(name: string, cvData: CvData, expectedRange: { min: number; max: number }, expectedGated?: boolean) {
  const result = computeCvScore(cvData)
  const passed = result.score >= expectedRange.min && result.score <= expectedRange.max && 
                 (expectedGated === undefined || result.isGated === expectedGated)
  
  console.log(`${passed ? '✅' : '❌'} ${name}`)
  console.log(`   Score: ${result.score} (expected: ${expectedRange.min}-${expectedRange.max})`)
  console.log(`   Completion: ${result.completionScore}/60, Quality: ${result.qualityScore}/40`)
  console.log(`   Gated: ${result.isGated} ${expectedGated !== undefined ? `(expected: ${expectedGated})` : ''}`)
  console.log(`   Level: ${result.level}`)
  if (!passed) {
    console.log(`   ❌ FAILED`)
  }
  console.log('')
  
  return passed
}

// Test 1: Empty CV => score 0-5
const emptyCv: CvData = {
  personalInfo: { fullName: '', email: '', phone: '', location: '', linkedin: '', website: '' },
  summary: '',
  experience: [],
  education: [],
  skills: [],
}

// Test 2: Only short summary => score <= 15 (gated)
const shortSummaryCv: CvData = {
  personalInfo: { fullName: '', email: '', phone: '', location: '', linkedin: '', website: '' },
  summary: 'i work hard',
  experience: [],
  education: [],
  skills: [],
}

// Test 3: Summary + 1 exp + 5 skills => mid score (should be gated if summary < 20 words or skills < 3)
const midCv: CvData = {
  personalInfo: { fullName: 'John Doe', email: 'john@example.com', phone: '1234567890', location: '', linkedin: '', website: '' },
  summary: 'Experienced software developer with strong problem-solving skills and a passion for building scalable applications.',
  experience: [
    {
      id: '1',
      jobTitle: 'Software Engineer',
      company: 'Tech Corp',
      location: 'San Francisco',
      startDate: '2020-01',
      endDate: '2023-12',
      isCurrent: false,
      bullets: [
        'Developed and maintained web applications using React and Node.js',
        'Collaborated with cross-functional teams to deliver high-quality software solutions',
        'Improved application performance by 30% through optimization techniques',
      ],
    },
  ],
  education: [
    { degree: 'BS Computer Science', school: 'University', year: '2020', details: '' },
  ],
  skills: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'Python'],
}

// Test 4: Full CV => higher score (not gated)
const fullCv: CvData = {
  personalInfo: { fullName: 'Jane Smith', email: 'jane@example.com', phone: '9876543210', location: 'New York', linkedin: 'linkedin.com/in/jane', website: 'janesmith.com' },
  summary: 'Experienced software engineer with over 5 years of expertise in full-stack development. Led multiple successful projects that improved system performance and user experience. Strong background in modern web technologies and agile methodologies.',
  experience: [
    {
      id: '1',
      jobTitle: 'Senior Software Engineer',
      company: 'Tech Corp',
      location: 'San Francisco',
      startDate: '2020-01',
      endDate: '2023-12',
      isCurrent: false,
      bullets: [
        'Led a team of 5 developers to build a scalable microservices architecture',
        'Developed and maintained web applications using React, Node.js, and TypeScript',
        'Improved application performance by 40% through optimization and caching strategies',
        'Collaborated with product managers and designers to deliver high-quality features',
      ],
    },
    {
      id: '2',
      jobTitle: 'Software Engineer',
      company: 'Startup Inc',
      location: 'Remote',
      startDate: '2018-06',
      endDate: '2020-01',
      isCurrent: false,
      bullets: [
        'Built responsive web applications using modern JavaScript frameworks',
        'Implemented RESTful APIs and database schemas for new features',
        'Participated in code reviews and contributed to team best practices',
      ],
    },
  ],
  education: [
    { degree: 'BS Computer Science', school: 'State University', year: '2018', details: 'Magna Cum Laude' },
  ],
  skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'PostgreSQL', 'MongoDB', 'Docker', 'AWS', 'Git', 'Agile', 'Scrum'],
  projects: [
    { name: 'Personal Portfolio', description: 'Built a responsive portfolio website using React and Tailwind CSS', url: 'https://portfolio.example.com' },
  ],
  certifications: ['AWS Certified Developer', 'Scrum Master'],
  languages: ['English', 'Spanish'],
}

// Test 5: Placeholder text should be ignored
const placeholderCv: CvData = {
  personalInfo: { fullName: 'I work hard', email: 'your email', phone: '', location: '', linkedin: '', website: '' },
  summary: 'I am good',
  experience: [],
  education: [],
  skills: ['example', 'test'],
}

// Run tests
console.log('Running CV Scoring Tests\n')
console.log('='.repeat(50))
console.log('')

let allPassed = true

allPassed = testCase('Test 1: Empty CV', emptyCv, { min: 0, max: 5 }, false) && allPassed
allPassed = testCase('Test 2: Only short summary (gated)', shortSummaryCv, { min: 0, max: 15 }, true)
allPassed = testCase('Test 3: Summary + 1 exp + 5 skills (mid score)', midCv, { min: 20, max: 60 }, false) && allPassed
allPassed = testCase('Test 4: Full CV (high score, not gated)', fullCv, { min: 60, max: 100 }, false) && allPassed
allPassed = testCase('Test 5: Placeholder text ignored', placeholderCv, { min: 0, max: 15 }, true) && allPassed

console.log('='.repeat(50))
console.log('')
if (allPassed) {
  console.log('✅ All tests passed!')
} else {
  console.log('❌ Some tests failed')
  process.exit(1)
}

