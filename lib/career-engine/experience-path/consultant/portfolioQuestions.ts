/**
 * Contextual portfolio / professional evidence questions — not one-size-fits-all GitHub.
 */

import type { ExperienceIndustryId } from '../types'
import type { ProfessionArchetype } from './professionInterview'

export type PortfolioEvidenceConfig = {
  questionId: string
  questionText: string
  cvTitle: string
  cvDescription: string
}

const SOFTWARE_ARCHETYPES = new Set<ProfessionArchetype>([
  'software_engineering',
  'qa_testing',
  'data_tech',
])

const PORTFOLIO_ARCHETYPES = new Set<ProfessionArchetype>([
  ...SOFTWARE_ARCHETYPES,
  'finance_accounting',
  'manufacturing_engineering',
  'trades_construction',
  'trades_electrical',
  'marketing_digital',
  'regulated_health',
  'nursing',
  'dental',
  'care_support',
  'sales_business',
  'hospitality_kitchen',
  'hospitality_foh',
])

function softwareConfig(label: string): PortfolioEvidenceConfig {
  return {
    questionId: 'github_portfolio',
    questionText: 'Do you have a GitHub, live application, or technical portfolio?',
    cvTitle: `${label} Technical Portfolio`,
    cvDescription:
      'Link GitHub repos, live demos, or deployed applications — UK tech employers hire on demonstrated code.',
  }
}

function dataConfig(label: string): PortfolioEvidenceConfig {
  return {
    questionId: 'portfolio_projects',
    questionText: 'Do you have portfolio projects such as GitHub repos, dashboards, or SQL analytics work?',
    cvTitle: `${label} Data Portfolio`,
    cvDescription:
      'Show GitHub projects, dashboards, or SQL portfolios with business outcomes — UK data roles hire on evidence.',
  }
}

function manufacturingConfig(label: string): PortfolioEvidenceConfig {
  return {
    questionId: 'professional_portfolio',
    questionText:
      'Do you have evidence of engineering projects, maintenance work, technical reports, CMMS records, improvement initiatives, or a professional engineering portfolio?',
    cvTitle: `${label} Professional Evidence`,
    cvDescription:
      'Document engineering projects, maintenance work, CMMS records, root-cause analysis, and continuous improvement initiatives.',
  }
}

function accountingConfig(label: string): PortfolioEvidenceConfig {
  return {
    questionId: 'professional_portfolio',
    questionText:
      'Do you have examples of financial reports, dashboards, process improvements, or professional accounting work?',
    cvTitle: `${label} Finance Evidence`,
    cvDescription:
      'Highlight financial reports, management accounts, reconciliations, process improvements, and systems used (Sage, Xero, Excel).',
  }
}

function constructionConfig(label: string): PortfolioEvidenceConfig {
  return {
    questionId: 'professional_portfolio',
    questionText:
      'Do you have project documentation, site experience, drawings, or completed construction projects?',
    cvTitle: `${label} Project Evidence`,
    cvDescription:
      'List completed projects, site types, drawings produced, snagging records, and trade-specific competencies.',
  }
}

function healthcareConfig(label: string): PortfolioEvidenceConfig {
  return {
    questionId: 'professional_portfolio',
    questionText:
      'Do you have evidence of clinical experience, training records, CPD, or professional achievements?',
    cvTitle: `${label} Professional Evidence`,
    cvDescription:
      'Include clinical settings, caseload, CPD hours, regulator registration status, and specialist competencies.',
  }
}

function salesConfig(label: string): PortfolioEvidenceConfig {
  return {
    questionId: 'professional_portfolio',
    questionText:
      'Do you have sales achievements, client success stories, CRM experience, or performance reports?',
    cvTitle: `${label} Sales Evidence`,
    cvDescription:
      'Quantify quota attainment, pipeline value, client wins, and CRM systems used — UK sales employers expect metrics.',
  }
}

function marketingConfig(label: string): PortfolioEvidenceConfig {
  return {
    questionId: 'marketing_portfolio',
    questionText:
      'Do you have campaign examples, design work, analytics, or a marketing portfolio?',
    cvTitle: `${label} Marketing Portfolio`,
    cvDescription:
      'Show campaign ROI, channel performance, creative samples, and analytics — UK marketing hires on demonstrated results.',
  }
}

function qaConfig(label: string): PortfolioEvidenceConfig {
  return {
    questionId: 'github_portfolio',
    questionText:
      'Do you have test automation examples, QA portfolios, or GitHub repos demonstrating your testing work?',
    cvTitle: `${label} QA Portfolio`,
    cvDescription:
      'Link test automation repos (Selenium, Cypress, Playwright), test plans, and API test suites.',
  }
}

function hospitalityConfig(label: string): PortfolioEvidenceConfig {
  return {
    questionId: 'professional_portfolio',
    questionText:
      'Do you have evidence of service standards, team leadership, venue experience, or hospitality achievements?',
    cvTitle: `${label} Experience Evidence`,
    cvDescription:
      'Highlight venue types, covers served, team size, customer service metrics, and relevant certifications.',
  }
}

function genericProfessionalConfig(label: string): PortfolioEvidenceConfig {
  return {
    questionId: 'professional_portfolio',
    questionText: `Do you have professional work samples or evidence relevant to ${label} roles?`,
    cvTitle: `${label} Professional Evidence`,
    cvDescription: `Add work samples, case studies, or achievements UK employers expect for ${label.toLowerCase()} roles.`,
  }
}

export function resolvePortfolioEvidence(
  industryId: ExperienceIndustryId,
  archetype: ProfessionArchetype,
  _specId: string,
  label: string
): PortfolioEvidenceConfig | null {
  if (industryId === 'software_developer' || SOFTWARE_ARCHETYPES.has(archetype)) {
    if (archetype === 'data_tech') return dataConfig(label)
    if (archetype === 'qa_testing') return qaConfig(label)
    return softwareConfig(label)
  }

  if (industryId === 'marketing_digital' || archetype === 'marketing_digital') {
    return marketingConfig(label)
  }

  if (industryId === 'accountant' || archetype === 'finance_accounting') {
    return accountingConfig(label)
  }

  if (industryId === 'manufacturing_engineering' || archetype === 'manufacturing_engineering') {
    return manufacturingConfig(label)
  }

  if (industryId === 'construction' || archetype === 'trades_construction') {
    return constructionConfig(label)
  }

  if (industryId === 'electrician' || archetype === 'trades_electrical') {
    return manufacturingConfig(label)
  }

  if (
    industryId === 'healthcare' ||
    archetype === 'regulated_health' ||
    archetype === 'nursing' ||
    archetype === 'dental' ||
    archetype === 'care_support'
  ) {
    return healthcareConfig(label)
  }

  if (industryId === 'sales' || archetype === 'sales_business') {
    return salesConfig(label)
  }

  if (industryId === 'chef' || industryId === 'hospitality' || archetype === 'hospitality_kitchen' || archetype === 'hospitality_foh') {
    return hospitalityConfig(label)
  }

  if (PORTFOLIO_ARCHETYPES.has(archetype)) {
    return genericProfessionalConfig(label)
  }

  return null
}

export function shouldRequirePortfolioEvidence(
  industryId: ExperienceIndustryId,
  archetype: ProfessionArchetype,
  specId: string,
  label: string,
  blueprintPortfolioRequired?: boolean
): boolean {
  if (resolvePortfolioEvidence(industryId, archetype, specId, label)) return true
  return Boolean(blueprintPortfolioRequired && (industryId === 'software_developer' || SOFTWARE_ARCHETYPES.has(archetype)))
}
