import { redirect } from 'next/navigation'

/** /pulse → /feed (Pulse UI lives on /feed route for now) */
export default function PulseRedirectPage() {
  redirect('/feed')
}
