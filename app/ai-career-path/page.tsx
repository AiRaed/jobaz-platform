import { redirect } from 'next/navigation'

/**
 * AI Career Path wizard merged into UK Career Assistant.
 * Preserves this route for existing links and homepage CTAs.
 */
export default function AiCareerPathRedirectPage() {
  redirect('/uk-career-assistant')
}
