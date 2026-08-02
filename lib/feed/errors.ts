/**
 * Feed error helpers
 */

export function isFeedTableMissingError(message: string): boolean {
  const m = message.toLowerCase()
  return (
    m.includes('could not find the table') ||
    (m.includes('relation') && m.includes('does not exist')) ||
    m.includes('schema cache')
  )
}

export const FEED_MIGRATION_INSTRUCTIONS =
  'Run Pulse migrations in Supabase SQL Editor: 20250528000000_create_feed_tables.sql and 20250530000000_pulse_upgrade.sql. Then refresh this page.'
