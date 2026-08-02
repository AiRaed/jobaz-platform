import { NextRequest, NextResponse } from 'next/server'
import { unsubscribeByToken } from '@/lib/email'

export const dynamic = 'force-dynamic'

/**
 * GET /api/email/unsubscribe?token=...
 * Public marketing unsubscribe (token-based). Does not expose secrets.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') || ''
  const result = await unsubscribeByToken(token)

  const html = `<!DOCTYPE html>
<html>
<head><title>JobAZ Unsubscribe</title></head>
<body style="font-family:Arial,sans-serif;padding:40px;max-width:520px;margin:0 auto;color:#0f172a;">
  <h1 style="font-size:20px;">JobAZ</h1>
  <p>${result.message}</p>
  <p style="font-size:13px;color:#64748b;">Service emails about your account or plan may still be sent when needed.</p>
</body>
</html>`

  return new NextResponse(html, {
    status: result.ok ? 200 : 400,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
