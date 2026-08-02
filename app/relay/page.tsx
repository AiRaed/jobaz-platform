import { redirect } from 'next/navigation'

/** Alias — Relay lives at /messages */
export default function RelayAliasPage() {
  redirect('/messages')
}
