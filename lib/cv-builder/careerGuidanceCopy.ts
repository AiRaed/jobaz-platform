import type { CvAiButtonHint } from '@/lib/cv-optimization'
import type { CvCareerPlanContext } from './careerPlanContext'

export function enrichAiHintsWithCareerPlan(
  hints: CvAiButtonHint[],
  plan: CvCareerPlanContext
): CvAiButtonHint[] {
  const role = plan.targetRole

  return hints.map((hint) => {
    switch (hint.id) {
      case 'summary':
        return {
          ...hint,
          impactLabel: `I'm improving your summary to better match ${role} jobs.`,
        }
      case 'experience':
        return {
          ...hint,
          impactLabel: `I'm adding keywords that ${role} employers commonly search for.`,
        }
      case 'skills':
        return {
          ...hint,
          impactLabel:
            plan.suggestedSkills.length > 0
              ? `I'm suggesting skills from your plan: ${plan.suggestedSkills.slice(0, 3).join(', ')}.`
              : `I'm suggesting skills missing from your ${plan.pathLabel} path.`,
        }
      case 'analyze':
        return {
          ...hint,
          impactLabel: `Tailor your CV to a real ${role} job listing.`,
        }
      default:
        return hint
    }
  })
}

export function getCareerWorkflowSubtitle(plan: CvCareerPlanContext): string {
  return `Step 2 of your ${plan.pathLabel} roadmap — build a CV for ${plan.targetRole} roles`
}

export function getJazCvCoachLine(
  plan: CvCareerPlanContext,
  activeTab: string,
  cvScore: number
): string | null {
  if (cvScore >= 70) {
    return `Your profile is now suitable for entry-level ${plan.targetRole} roles. You're almost ready to apply.`
  }
  if (activeTab === 'summary') {
    return `Let's improve your summary to better match ${plan.targetRole} jobs in the UK.`
  }
  if (activeTab === 'experience') {
    return `I noticed measurable achievements help ${plan.targetRole} applications stand out.`
  }
  if (activeTab === 'skills' && plan.suggestedSkills.length > 0) {
    return `I'm suggesting skills from your career plan: ${plan.suggestedSkills.slice(0, 3).join(', ')}.`
  }
  return null
}
