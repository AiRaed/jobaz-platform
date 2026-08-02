import { describe, expect, it } from 'vitest'
import { comparePlanToCv } from './comparePlanToCv'
import { calculateCvReadinessForPlan } from './calculateCvReadinessForPlan'

const securityPlan = {
  routeTitle: 'Security extra income',
  currentTarget: 'Matchday Steward',
  nextUpgrade: 'Door Supervisor',
  pathId: 'extra_income_security',
}

describe('comparePlanToCv', () => {
  it('returns no_cv when missing', () => {
    const r = comparePlanToCv(null, securityPlan)
    expect(r.planCvMatch).toBe('no_cv')
    expect(r.matchScore).toBe(0)
  })

  it('returns empty_cv for placeholders', () => {
    const r = comparePlanToCv(
      {
        fullName: 'Your Name',
        email: 'email@example.com',
        summary: '',
        experience: [],
        skills: [],
      },
      securityPlan,
      { hasSavedCvRow: true }
    )
    expect(r.planCvMatch).toBe('empty_cv')
  })

  it('flags cleaning CV vs security plan as mismatch or partial', () => {
    const r = comparePlanToCv(
      {
        fullName: 'Alex Reed',
        email: 'alex@test.com',
        summary: 'Experienced cleaner with attention to detail in commercial buildings.',
        skills: ['cleaning', 'timekeeping'],
        experience: [
          {
            jobTitle: 'Cleaner',
            company: 'Clean Co',
            bullets: ['Cleaned offices daily and restocked supplies for clients.'],
          },
        ],
      },
      securityPlan,
      { hasSavedCvRow: true }
    )
    expect(['mismatch', 'partial_match']).toContain(r.planCvMatch)
    expect(r.matchScore).toBeLessThan(55)
  })

  it('improves when SIA certification is present but still needs tailoring', () => {
    const cleaningPlusSia = {
      fullName: 'Alex Reed',
      email: 'alex@test.com',
      summary: 'Experienced cleaner looking for extra work.',
      skills: ['cleaning'],
      experience: [{ jobTitle: 'Cleaner', company: 'Clean Co', bullets: ['Cleaned venues.'] }],
      certifications: [{ title: 'SIA Door Supervisor', provider: 'Get Licensed' }],
    }
    const match = comparePlanToCv(cleaningPlusSia, securityPlan, { hasSavedCvRow: true })
    expect(['partial_match', 'mismatch']).toContain(match.planCvMatch)

    const readiness = calculateCvReadinessForPlan(cleaningPlusSia, securityPlan)
    expect(readiness.score).toBeGreaterThanOrEqual(28)
    expect(readiness.score).toBeLessThanOrEqual(55)
    expect(readiness.planCvMatch).not.toBe('good_match')
  })

  it('good_match when security keywords are present', () => {
    const r = comparePlanToCv(
      {
        fullName: 'Alex Reed',
        email: 'alex@test.com',
        summary:
          'Reliable matchday steward with SIA Door Supervisor licence, customer service experience, flexible availability and right to work in the UK.',
        skills: ['customer service', 'reliability', 'SIA', 'crowd awareness'],
        experience: [
          {
            jobTitle: 'Event Steward',
            company: 'Venue Ltd',
            bullets: ['Managed crowd flow at football venues and supported guests safely.'],
          },
        ],
        certifications: [{ title: 'SIA Door Supervisor' }],
      },
      securityPlan,
      { hasSavedCvRow: true }
    )
    expect(r.planCvMatch).toBe('good_match')
  })
})
