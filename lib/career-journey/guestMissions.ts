import { buildAuthLoginUrl, buildAuthSignupUrl, GUEST_CAREER_DASHBOARD_PATH } from '@/lib/auth/redirect'
import type { MissionItem } from './actionPlanTypes'

export function getGuestCareerSignupUrl(): string {
  return buildAuthSignupUrl(GUEST_CAREER_DASHBOARD_PATH)
}

export function getGuestCareerLoginUrl(): string {
  return buildAuthLoginUrl(GUEST_CAREER_DASHBOARD_PATH)
}

/** Guest preview missions — never marked complete until the user registers. */
export function buildGuestMissions(signupUrl = getGuestCareerSignupUrl()): MissionItem[] {
  return [
    {
      id: 'account',
      label: 'Create Free Account',
      href: signupUrl,
      completed: false,
      guestLocked: true,
      target: 1,
      current: 0,
    },
    {
      id: 'cv',
      label: 'Build Your First UK CV',
      href: signupUrl,
      completed: false,
      guestLocked: true,
      target: 1,
      current: 0,
    },
    {
      id: 'save-plan',
      label: 'Save Your Career Plan',
      href: signupUrl,
      completed: false,
      guestLocked: true,
      target: 1,
      current: 0,
    },
    {
      id: 'apply',
      label: 'Apply to Your First Job',
      href: signupUrl,
      completed: false,
      guestLocked: true,
      target: 1,
      current: 0,
    },
  ]
}
