import { describe, expect, it } from 'vitest'
import { isMeaningfulCv, isPlaceholderText } from './isMeaningfulCv'

describe('isMeaningfulCv', () => {
  it('rejects null and empty templates', () => {
    expect(isMeaningfulCv(null)).toBe(false)
    expect(
      isMeaningfulCv({
        personalInfo: { fullName: '', email: '' },
        summary: '',
        experience: [],
        education: [],
        skills: [],
      })
    ).toBe(false)
    expect(isMeaningfulCv({ fullName: 'Your Name', email: 'your email', summary: '' })).toBe(false)
  })

  it('accepts real contact or summary', () => {
    expect(isMeaningfulCv({ fullName: 'Alex Reed', email: '' })).toBe(true)
    expect(
      isMeaningfulCv({
        summary:
          'Reliable steward seeking UK event roles with strong customer service experience.',
      })
    ).toBe(true)
  })

  it('accepts certifications objects', () => {
    expect(
      isMeaningfulCv({
        certifications: [{ title: 'SIA Door Supervisor', provider: 'Get Licensed' }],
      })
    ).toBe(true)
  })

  it('flags placeholder text', () => {
    expect(isPlaceholderText('Your Name')).toBe(true)
    expect(isPlaceholderText('Alex Reed')).toBe(false)
  })
})
