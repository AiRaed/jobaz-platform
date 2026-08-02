import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import {
  CAMPAIGN_TYPES,
  buildCampaignDraft,
  getCampaignDashboardStats,
  getCampaignsSupabase,
  mapCampaign,
  mapRecipient,
  matchRecipientsForCampaign,
  tableExists,
  type AudienceRules,
  type CampaignType,
} from '@/lib/email-campaigns'
import { sendJobazEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

/** GET — list campaigns + dashboard stats, or recipients for ?id= */
export async function GET(req: NextRequest) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  const url = new URL(req.url)
  const campaignId = url.searchParams.get('id')
  const view = url.searchParams.get('view') || 'campaigns'

  const supabase = getCampaignsSupabase()
  if (!supabase) {
    return NextResponse.json({
      ok: true,
      stats: await getCampaignDashboardStats(),
      campaigns: [],
      recipients: [],
      logs: [],
      message: 'Supabase service role not configured',
    })
  }

  if (view === 'stats') {
    return NextResponse.json({ ok: true, stats: await getCampaignDashboardStats() })
  }

  if (view === 'logs') {
    if (!(await tableExists(supabase, 'email_logs'))) {
      return NextResponse.json({ ok: true, logs: [], note: 'email_logs: Not tracked yet' })
    }
    const { data } = await supabase
      .from('email_logs')
      .select('id, user_id, to_email, subject, email_type, status, provider, error_message, created_at, campaign_id')
      .order('created_at', { ascending: false })
      .limit(100)
    return NextResponse.json({ ok: true, logs: data ?? [] })
  }

  if (!(await tableExists(supabase, 'email_campaigns'))) {
    return NextResponse.json({
      ok: true,
      campaigns: [],
      recipients: [],
      stats: await getCampaignDashboardStats(),
      note: 'email_campaigns: Not tracked yet — run migration',
    })
  }

  if (campaignId) {
    const { data: campaign } = await supabase
      .from('email_campaigns')
      .select('*')
      .eq('id', campaignId)
      .maybeSingle()
    const { data: recipients } = await supabase
      .from('email_campaign_recipients')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('match_score', { ascending: false })
      .limit(300)
    return NextResponse.json({
      ok: true,
      campaign: campaign ? mapCampaign(campaign as Record<string, unknown>) : null,
      recipients: (recipients ?? []).map((r) => mapRecipient(r as Record<string, unknown>)),
    })
  }

  const { data: campaigns } = await supabase
    .from('email_campaigns')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  return NextResponse.json({
    ok: true,
    campaigns: (campaigns ?? []).map((c) => mapCampaign(c as Record<string, unknown>)),
    stats: await getCampaignDashboardStats(),
  })
}

/** POST — create campaign, match, approve, send, draft */
export async function POST(req: NextRequest) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  const supabase = getCampaignsSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase service role not configured' }, { status: 503 })
  }

  const body = (await req.json()) as Record<string, unknown>
  const action = String(body.action || 'create')

  if (!(await tableExists(supabase, 'email_campaigns'))) {
    return NextResponse.json(
      { error: 'email_campaigns table missing — run migration 20250728180000_email_matching_system.sql' },
      { status: 503 }
    )
  }

  if (action === 'generate_draft') {
    const type = String(body.campaign_type || 'plan_reminder') as CampaignType
    if (!(CAMPAIGN_TYPES as readonly string[]).includes(type)) {
      return NextResponse.json({ error: 'Invalid campaign type' }, { status: 400 })
    }
    const rules = (body.audience_rules || {}) as AudienceRules
    const draft = buildCampaignDraft(type, rules)
    return NextResponse.json({ ok: true, ...draft })
  }

  if (action === 'create') {
    const title = String(body.title || '').trim()
    const campaign_type = String(body.campaign_type || '') as CampaignType
    if (!title) return NextResponse.json({ error: 'Title required' }, { status: 400 })
    if (!(CAMPAIGN_TYPES as readonly string[]).includes(campaign_type)) {
      return NextResponse.json({ error: 'Invalid campaign type' }, { status: 400 })
    }
    const draft =
      body.draft_subject && body.draft_body
        ? {
            subject: String(body.draft_subject),
            body: String(body.draft_body),
          }
        : buildCampaignDraft(campaign_type, (body.audience_rules || {}) as AudienceRules)

    const { data, error } = await supabase
      .from('email_campaigns')
      .insert({
        title,
        campaign_type,
        status: 'draft',
        source_type: body.source_type ? String(body.source_type) : null,
        source_id: body.source_id ? String(body.source_id) : null,
        audience_rules: body.audience_rules || {},
        draft_subject: draft.subject,
        draft_body: draft.body,
        created_by: auth.user.id,
      })
      .select('*')
      .single()

    if (error) {
      console.error('[email-campaigns create]', error)
      return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
    }
    return NextResponse.json({ ok: true, campaign: mapCampaign(data as Record<string, unknown>) }, { status: 201 })
  }

  if (action === 'match') {
    const campaignId = String(body.campaign_id || '')
    if (!campaignId) return NextResponse.json({ error: 'campaign_id required' }, { status: 400 })

    const { data: campaign } = await supabase
      .from('email_campaigns')
      .select('*')
      .eq('id', campaignId)
      .maybeSingle()
    if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })

    const c = mapCampaign(campaign as Record<string, unknown>)
    const match = await matchRecipientsForCampaign({
      supabase,
      campaignType: c.campaign_type,
      rules: c.audience_rules as AudienceRules,
    })

    await supabase.from('email_campaign_recipients').delete().eq('campaign_id', campaignId)

    if (match.candidates.length > 0) {
      const rows = match.candidates.map((cand) => ({
        campaign_id: campaignId,
        user_id: cand.user_id,
        email: cand.email,
        match_score: cand.match_score,
        match_reasons: cand.match_reasons,
        consent_status: cand.consent_status,
        status: cand.consent_status === 'allowed' ? 'suggested' : 'excluded',
      }))
      const { error: insertErr } = await supabase.from('email_campaign_recipients').insert(rows)
      if (insertErr) {
        console.error('[email-campaigns match insert]', insertErr)
        return NextResponse.json({ error: 'Failed to save recipients' }, { status: 500 })
      }
    }

    await supabase
      .from('email_campaigns')
      .update({
        ai_summary: `${match.ai_summary}\n\n${match.excluded_summary}\n\nWarnings: ${match.compliance_warnings.join(' ')}`,
      })
      .eq('id', campaignId)

    return NextResponse.json({
      ok: true,
      ...match,
      recipients: match.candidates,
    })
  }

  if (action === 'update_recipients') {
    const campaignId = String(body.campaign_id || '')
    const ids = Array.isArray(body.recipient_ids) ? body.recipient_ids.map(String) : []
    const status = String(body.status || 'approved')
    if (!campaignId) {
      return NextResponse.json({ error: 'campaign_id required' }, { status: 400 })
    }
    // Only allow approve/exclude for allowed consent
    if (status === 'approve_all_allowed') {
      await supabase
        .from('email_campaign_recipients')
        .update({ status: 'approved' })
        .eq('campaign_id', campaignId)
        .eq('consent_status', 'allowed')
        .in('status', ['suggested', 'approved'])
    } else if (ids.length === 0) {
      return NextResponse.json({ error: 'campaign_id and recipient_ids required' }, { status: 400 })
    } else if (status === 'approved') {
      await supabase
        .from('email_campaign_recipients')
        .update({ status: 'approved' })
        .eq('campaign_id', campaignId)
        .eq('consent_status', 'allowed')
        .in('id', ids)
    } else {
      await supabase
        .from('email_campaign_recipients')
        .update({ status: 'excluded' })
        .eq('campaign_id', campaignId)
        .in('id', ids)
    }

    await supabase
      .from('email_campaigns')
      .update({
        status: 'reviewed',
        reviewed_by: auth.user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', campaignId)

    return NextResponse.json({ ok: true })
  }

  if (action === 'send') {
    const campaignId = String(body.campaign_id || '')
    const testOnly = Boolean(body.test_only)
    if (!campaignId) return NextResponse.json({ error: 'campaign_id required' }, { status: 400 })

    const { data: campaign } = await supabase
      .from('email_campaigns')
      .select('*')
      .eq('id', campaignId)
      .maybeSingle()
    if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    const c = mapCampaign(campaign as Record<string, unknown>)

    if (testOnly) {
      const adminEmail = auth.user.email
      if (!adminEmail) {
        return NextResponse.json({ error: 'Admin email missing' }, { status: 400 })
      }
      const result = await sendJobazEmail({
        to: adminEmail,
        templateKey: 'admin_custom',
        emailType: 'marketing',
        userId: auth.user.id,
        subject: `[TEST] ${c.draft_subject || c.title}`,
        customMessage: c.draft_body || '',
      })
      return NextResponse.json({ ok: result.ok, result })
    }

    const { data: recipients } = await supabase
      .from('email_campaign_recipients')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('status', 'approved')
      .eq('consent_status', 'allowed')

    const list = recipients ?? []
    if (list.length === 0) {
      return NextResponse.json(
        { error: 'No approved + consent-allowed recipients. Review recipients first.' },
        { status: 400 }
      )
    }

    let sent = 0
    let failed = 0
    let skipped = 0
    for (const raw of list) {
      const r = mapRecipient(raw as Record<string, unknown>)
      const result = await sendJobazEmail({
        to: r.email,
        templateKey: 'admin_custom',
        emailType: c.campaign_type === 'plan_reminder' ? 'service' : 'marketing',
        userId: r.user_id,
        subject: c.draft_subject || c.title,
        customMessage: c.draft_body || '',
      })

      if (result.status === 'sent') {
        sent += 1
        await supabase
          .from('email_campaign_recipients')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', r.id)
      } else if (result.status === 'blocked' || result.status === 'not_configured') {
        skipped += 1
        await supabase
          .from('email_campaign_recipients')
          .update({ status: 'skipped' })
          .eq('id', r.id)
      } else {
        failed += 1
        await supabase
          .from('email_campaign_recipients')
          .update({ status: 'failed' })
          .eq('id', r.id)
      }
    }

    if (sent > 0) {
      await supabase
        .from('email_campaigns')
        .update({
          status: 'sent',
          sent_by: auth.user.id,
          sent_at: new Date().toISOString(),
        })
        .eq('id', campaignId)
    }

    return NextResponse.json({
      ok: true,
      sent,
      failed,
      skipped,
      message:
        sent === 0 && skipped > 0
          ? 'No emails sent — check provider config and consent.'
          : `Sent ${sent}, skipped ${skipped}, failed ${failed}.`,
    })
  }

  if (action === 'save_draft') {
    const campaignId = String(body.campaign_id || '')
    if (!campaignId) return NextResponse.json({ error: 'campaign_id required' }, { status: 400 })
    await supabase
      .from('email_campaigns')
      .update({
        title: body.title ? String(body.title) : undefined,
        draft_subject: body.draft_subject != null ? String(body.draft_subject) : undefined,
        draft_body: body.draft_body != null ? String(body.draft_body) : undefined,
        audience_rules: body.audience_rules || undefined,
        status: 'draft',
      })
      .eq('id', campaignId)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
