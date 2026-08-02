import { describe, expect, it } from 'vitest'
import { calculateCvReadiness } from './calculateCvReadiness'

describe('calculateCvReadiness', () => {
  it('returns 0 when no CV exists', () => {
    const result = calculateCvReadiness(null)
    expect(result.score).toBe(0)
    expect(result.status).toBe('missing')
  })

  it('keeps nearly empty saved CV in the 5–15% band', () => {
    const result = calculateCvReadiness({
      personalInfo: { fullName: '', email: '', phone: '', location: '' },
      summary: '',
      experience: [],
      education: [],
      skills: [],
    })
    expect(result.score).toBeGreaterThanOrEqual(5)
    expect(result.score).toBeLessThanOrEqual(15)
    expect(['started', 'needs_work']).toContain(result.status)
  })

  it('does not inflate score from career plan keywords alone', () => {
    const withoutPlan = calculateCvReadiness({
      personalInfo: { fullName: 'Alex', email: 'a@test.com' },
      summary: '',
      experience: [],
      education: [],
      skills: [],
    })
    const withPlan = calculateCvReadiness(
      {
        personalInfo: { fullName: 'Alex', email: 'a@test.com' },
        summary: '',
        experience: [],
        education: [],
        skills: [],
      },
      {
        routeTitle: 'Security extra income',
        focusKeywords: ['reliability', 'availability', 'customer service'],
      }
    )
    expect(withPlan.score).toBe(withoutPlan.score)
    expect(withPlan.score).toBeLessThan(55)
  })

  it('increases score when summary and experience exist', () => {
    const weak = calculateCvReadiness({
      personalInfo: { fullName: 'Alex Reed', email: 'alex@test.com' },
      summary: '',
      experience: [],
      education: [],
      skills: [],
    })
    const stronger = calculateCvReadiness({
      personalInfo: { fullName: 'Alex Reed', email: 'alex@test.com', phone: '07000' },
      summary:
        'Reliable team member with customer service experience looking for UK steward and event roles. Flexible with shifts and available at short notice.',
      experience: [
        {
          jobTitle: 'Retail Assistant',
          company: 'Shop Co',
          bullets: [
            'Supported customers on the shop floor and handled enquiries calmly during busy periods.',
          ],
        },
      ],
      education: [{ degree: 'GCSE', school: 'Local School' }],
      skills: ['customer service', 'teamwork', 'reliability'],
    })
    expect(stronger.score).toBeGreaterThan(weak.score)
    expect(stronger.score).toBeGreaterThan(45)
  })

  it('awards keyword points only when keywords appear in the CV', () => {
    const cv = {
      personalInfo: { fullName: 'Alex Reed', email: 'alex@test.com' },
      summary:
        'Reliable and available for flexible shifts with strong customer service skills and right to work in the UK.',
      experience: [
        {
          jobTitle: 'Matchday Steward',
          company: 'Events Ltd',
          bullets: ['Managed crowd flow and helped guests find seats safely.'],
        },
      ],
      education: [],
      skills: ['reliability', 'availability', 'customer service'],
    }
    const withoutKeywords = calculateCvReadiness(cv)
    const withKeywords = calculateCvReadiness(cv, {
      focusKeywords: ['reliability', 'availability', 'customer service'],
    })
    expect(withKeywords.score).toBeGreaterThan(withoutKeywords.score)
  })
})
