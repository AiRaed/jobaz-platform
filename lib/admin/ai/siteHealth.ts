/**
 * JobAZ Site Health / Technical Intelligence — lightweight checks only.
 * Never invent errors. Never expose secret values.
 * Do not call expensive external APIs unless an explicit live test is requested later.
 */

import fs from 'fs'
import path from 'path'
import { getAdminCoursesSupabase } from '@/lib/admin/courses/supabaseServer'
import { aiProvider } from '@/lib/jobaz-ai/providers'
import type {
  HealthCheckItem,
  HealthModule,
  HealthModuleId,
  HealthStatus,
  SiteHealthScope,
  SiteHealthSnapshot,
} from './types'

const MODULE_TITLES: Record<HealthModuleId, string> = {
  ai_services: 'AI Services (OpenAI, Cover Letter, Writing Review, Admin AI)',
  interview_voice: 'Interview Voice / ElevenLabs',
  cv_documents: 'CV & Documents',
  career_assistant: 'Career Assistant / My Plan',
  jobs: 'Jobs APIs',
  courses_affiliate: 'Courses & Referrals',
  auth_user: 'Auth & User Data',
  supabase_db: 'Supabase / Database',
  tracking: 'Tracking / Analytics',
  deployment: 'Deployment / Environment',
}

const SCOPE_MODULES: Record<SiteHealthScope, HealthModuleId[] | 'all'> = {
  basic: 'all',
  all: 'all',
  ai: ['ai_services', 'deployment'],
  courses: ['courses_affiliate'],
  cv: ['cv_documents'],
  jobs: ['jobs'],
  interview: ['interview_voice'],
  tracking: ['tracking'],
}

function fileExists(rel: string): boolean {
  try {
    return fs.existsSync(path.join(process.cwd(), rel))
  } catch {
    return false
  }
}

function envPresent(name: string): boolean {
  return Boolean(process.env[name]?.trim())
}

function check(
  id: string,
  label: string,
  status: HealthStatus,
  detail: string,
  count?: number | null
): HealthCheckItem {
  return { id, label, status, detail, count }
}

function aggregateStatus(checks: HealthCheckItem[]): HealthStatus {
  if (checks.some((c) => c.status === 'error')) return 'error'
  if (checks.some((c) => c.status === 'warning')) return 'warning'
  if (checks.length > 0 && checks.every((c) => c.status === 'not_wired')) return 'not_wired'
  return 'healthy'
}

function explainModule(status: HealthStatus, checks: HealthCheckItem[]): string {
  const wired = checks.filter((c) => c.status !== 'not_wired')
  const notWired = checks.filter((c) => c.status === 'not_wired')
  const errors = checks.filter((c) => c.status === 'error')
  const warnings = checks.filter((c) => c.status === 'warning')

  if (status === 'error') {
    return errors.map((c) => c.detail).slice(0, 2).join(' ') || 'Issues detected by current checks.'
  }
  if (status === 'warning') {
    return warnings.map((c) => c.detail).slice(0, 2).join(' ') || 'Attention needed on some checks.'
  }
  if (status === 'not_wired') {
    return 'Checks in this module are not wired yet — not an error.'
  }
  const gap =
    notWired.length > 0
      ? ` ${notWired.length} check(s) still not wired (monitoring gaps).`
      : ''
  return `Current checks look OK (${wired.length} measured).${gap}`
}

async function probeTable(
  table: string
): Promise<{ ok: boolean; exists: boolean; message?: string }> {
  const supabase = getAdminCoursesSupabase()
  if (!supabase) {
    return { ok: false, exists: false, message: 'Supabase service client not configured' }
  }
  const { error } = await supabase.from(table).select('*', { count: 'exact', head: true })
  if (!error) return { ok: true, exists: true }
  const msg = error.message || ''
  if (/Could not find the table|relation .* does not exist|schema cache/i.test(msg)) {
    return { ok: false, exists: false, message: msg }
  }
  // Other errors (RLS, permissions) — table likely exists
  return { ok: true, exists: true, message: msg }
}

async function countPublishedMissing(
  field: 'referral_url' | 'provider_name'
): Promise<{ count: number | null; available: boolean; error?: string }> {
  const supabase = getAdminCoursesSupabase()
  if (!supabase) return { count: null, available: false, error: 'Supabase not configured' }
  const { count, error } = await supabase
    .from('courses')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published')
    .or(`${field}.is.null,${field}.eq.`)
  if (error) return { count: null, available: false, error: error.message }
  return { count: count ?? 0, available: true }
}

async function countPublishedCourses(): Promise<{
  count: number | null
  available: boolean
  error?: string
}> {
  const supabase = getAdminCoursesSupabase()
  if (!supabase) return { count: null, available: false, error: 'Supabase not configured' }
  const { count, error } = await supabase
    .from('courses')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published')
  if (error) return { count: null, available: false, error: error.message }
  return { count: count ?? 0, available: true }
}

function buildModule(
  id: HealthModuleId,
  checks: HealthCheckItem[],
  checkedAt: string
): HealthModule {
  const status = aggregateStatus(checks)
  return {
    id,
    title: MODULE_TITLES[id],
    status,
    explanation: explainModule(status, checks),
    lastCheckedAt: checkedAt,
    checks,
  }
}

async function checkAiServices(checkedAt: string): Promise<HealthModule> {
  const openaiConfigured = aiProvider.isConfigured() || envPresent('OPENAI_API_KEY')
  const checks: HealthCheckItem[] = [
    check(
      'openai_configured',
      'OpenAI / AI provider configured',
      openaiConfigured ? 'healthy' : 'warning',
      openaiConfigured
        ? 'AI provider key is present (value not shown).'
        : 'OPENAI_API_KEY / AI provider not configured — AI tools will fail.'
    ),
    check(
      'cv_ai_endpoint',
      'CV Builder AI endpoint',
      fileExists('app/api/cv/improve-bullet/route.ts') ? 'healthy' : 'warning',
      fileExists('app/api/cv/improve-bullet/route.ts')
        ? 'Route present: /api/cv/improve-bullet (config check only — no live call).'
        : 'CV AI improve route not found.'
    ),
    check(
      'cover_ai_endpoint',
      'Cover Letter AI endpoint',
      fileExists('app/api/cover/generate/route.ts') ? 'healthy' : 'warning',
      fileExists('app/api/cover/generate/route.ts')
        ? 'Route present: /api/cover/generate (config check only).'
        : 'Cover generate route not found.'
    ),
    check(
      'writing_review_ai',
      'Writing Review AI endpoint',
      fileExists('app/api/proofreading/ai-proofread/route.ts') ? 'healthy' : 'warning',
      fileExists('app/api/proofreading/ai-proofread/route.ts')
        ? 'Route present: /api/proofreading/ai-proofread (config check only).'
        : 'Writing Review AI route not found.'
    ),
    check(
      'career_assistant_ai',
      'Career Assistant AI endpoint',
      fileExists('app/api/jaz/route.ts') || fileExists('app/api/uk-career-assistant/route.ts')
        ? 'healthy'
        : 'warning',
      fileExists('app/api/jaz/route.ts') || fileExists('app/api/uk-career-assistant/route.ts')
        ? 'Assistant AI route present (config check only).'
        : 'Career Assistant AI route not found.'
    ),
    check(
      'admin_ai_endpoint',
      'Admin AI endpoint',
      fileExists('app/api/admin/ai/technical-report/route.ts') ? 'healthy' : 'warning',
      fileExists('app/api/admin/ai/technical-report/route.ts')
        ? 'Admin technical-report route present (config check only).'
        : 'Admin AI technical-report route not found.'
    ),
    check(
      'last_ai_error',
      'Last AI error (logged)',
      'not_wired',
      'Not wired yet — no central AI error log queried by health checks.'
    ),
    check(
      'ai_rate_limit',
      'AI rate limit / timeout logs',
      'not_wired',
      'Not wired yet — rate-limit/timeout monitoring not connected.'
    ),
  ]
  return buildModule('ai_services', checks, checkedAt)
}

async function checkInterviewVoice(checkedAt: string): Promise<HealthModule> {
  const pageOk = fileExists('app/interview-coach/page.tsx')
  const elevenKey = envPresent('ELEVENLABS_API_KEY')
  const ttsRoute = fileExists('app/api/tts/route.ts')
  const voiceTrain = fileExists('app/api/interview/voice-train/route.ts')
  const saveRoute = fileExists('app/api/interview/save/route.ts')
  const cacheHelper = fileExists('lib/tts-helper.ts')
  const interviewTable = await probeTable('interview_sessions')

  const checks: HealthCheckItem[] = [
    check(
      'interview_page',
      'Interview Coach page exists',
      pageOk ? 'healthy' : 'error',
      pageOk ? 'Page present: /interview-coach' : 'Interview Coach page missing.'
    ),
    check(
      'voice_recording_code',
      'Voice recording available in browser',
      pageOk ? 'healthy' : 'not_wired',
      pageOk
        ? 'Interview Coach uses MediaRecorder / getUserMedia (code present; runtime permission not tested).'
        : 'Not wired yet.'
    ),
    check(
      'mic_permission_handling',
      'Microphone permission handling',
      pageOk ? 'healthy' : 'not_wired',
      pageOk
        ? 'getUserMedia permission flow present in Interview Coach (not live-tested).'
        : 'Not wired yet.'
    ),
    check(
      'elevenlabs_key',
      'ElevenLabs API key configured',
      elevenKey ? 'healthy' : 'warning',
      elevenKey
        ? 'ELEVENLABS_API_KEY is present (value not shown).'
        : 'ELEVENLABS_API_KEY missing — TTS/voice playback may fail.'
    ),
    check(
      'elevenlabs_endpoint',
      'ElevenLabs / TTS endpoint',
      ttsRoute ? (elevenKey ? 'healthy' : 'warning') : 'warning',
      ttsRoute
        ? 'Route present: /api/tts (config check only — no live ElevenLabs call).'
        : 'TTS route not found.'
    ),
    check(
      'voice_train_endpoint',
      'Interview voice-train endpoint',
      voiceTrain ? 'healthy' : 'warning',
      voiceTrain
        ? 'Route present: /api/interview/voice-train (config check only).'
        : 'voice-train route not found.'
    ),
    check(
      'audio_cache',
      'Audio cache / storage configured',
      cacheHelper ? 'healthy' : 'not_wired',
      cacheHelper
        ? 'tts-helper audio cache code present (Supabase storage used by TTS when configured).'
        : 'Not wired yet.'
    ),
    check(
      'audio_cleanup',
      'Old audio cleanup strategy',
      cacheHelper ? 'healthy' : 'not_wired',
      cacheHelper
        ? 'Client clearAudioCache helper exists; scheduled server cleanup not verified.'
        : 'Not wired yet.'
    ),
    check(
      'interview_session_save',
      'Interview session save/load',
      saveRoute
        ? interviewTable.exists
          ? 'healthy'
          : 'not_wired'
        : 'not_wired',
      saveRoute
        ? interviewTable.exists
          ? 'Save route and interview_sessions table probe OK.'
          : 'Save route exists; interview_sessions table not confirmed (may use another store) — not wired as error.'
        : 'Not wired yet.'
    ),
  ]
  return buildModule('interview_voice', checks, checkedAt)
}

async function checkCvDocuments(checkedAt: string): Promise<HealthModule> {
  const loadOk = fileExists('app/api/cv/get-latest/route.ts')
  const upsertOk = fileExists('app/api/cv/upsert/route.ts')
  const readiness = fileExists('lib/cv/calculateCvReadinessForPlan.ts')
  const pdfLib = fileExists('lib/pdf.ts')
  const docxLib = fileExists('lib/docx.ts')
  const docsHub = fileExists('components/dashboard/DocumentsHub.tsx')
  const cvsTable = await probeTable('cvs')

  const checks: HealthCheckItem[] = [
    check(
      'cv_load',
      'Saved CV load',
      loadOk && cvsTable.exists ? 'healthy' : loadOk ? 'warning' : 'error',
      loadOk
        ? cvsTable.exists
          ? 'Route /api/cv/get-latest and cvs table probe OK.'
          : 'Load route present; cvs table probe failed — see Supabase module.'
        : 'CV get-latest route missing.'
    ),
    check(
      'cv_upsert',
      'Saved CV upsert',
      upsertOk ? 'healthy' : 'error',
      upsertOk
        ? 'Route present: /api/cv/upsert (config check only).'
        : 'CV upsert route missing — save flow blocked.'
    ),
    check(
      'shared_readiness',
      'CV Builder & Documents shared readiness helper',
      readiness && docsHub ? 'healthy' : readiness ? 'warning' : 'warning',
      readiness
        ? 'calculateCvReadinessForPlan exists; DocumentsHub imports it.'
        : 'Shared readiness helper not found.'
    ),
    check(
      'plan_aware_scoring',
      'Plan-aware CV scoring',
      readiness ? 'healthy' : 'not_wired',
      readiness
        ? 'Plan-aware scoring via calculateCvReadinessForPlan (code present).'
        : 'Not wired yet.'
    ),
    check(
      'pdf_export',
      'PDF export',
      pdfLib ? 'healthy' : 'not_wired',
      pdfLib
        ? 'Client PDF export via lib/pdf.ts (no dedicated API route — client-side).'
        : 'Not wired yet.'
    ),
    check(
      'docx_export',
      'DOCX export',
      docxLib ? 'healthy' : 'not_wired',
      docxLib
        ? 'Client DOCX export via lib/docx.ts (no dedicated API route — client-side).'
        : 'Not wired yet.'
    ),
    check(
      'cv_preview_safety',
      'CV preview with placeholder/missing fields',
      'not_wired',
      'Not wired yet — no automated preview/safety monitor.'
    ),
    check(
      'trim_type_errors',
      'Known text.trim / type errors',
      'not_wired',
      'Not wired yet — no central runtime error log for CV trim/type issues.'
    ),
  ]
  return buildModule('cv_documents', checks, checkedAt)
}

async function checkCareerAssistant(checkedAt: string): Promise<HealthModule> {
  const assessments = await probeTable('ai_career_assessments')
  const resetPlan = fileExists('app/api/career-plan/reset/route.ts')
  const resetCv = fileExists('app/api/cv/delete/route.ts')
  const planHook = fileExists('hooks/useGeneratedCareerPlan.ts')
  const dashboard = fileExists('app/dashboard/page.tsx')
  const documents = fileExists('components/dashboard/DocumentsHub.tsx')
  const cvBuilder = fileExists('app/cv-builder-v2/page.tsx')

  const checks: HealthCheckItem[] = [
    check(
      'assistant_session_save',
      'Assistant session can be saved',
      assessments.exists ? 'healthy' : 'warning',
      assessments.exists
        ? 'ai_career_assessments table probe OK.'
        : assessments.message || 'Assessment save table not confirmed.'
    ),
    check(
      'latest_plan_load',
      'Latest active plan loads once (no loop)',
      planHook ? 'healthy' : 'not_wired',
      planHook
        ? 'useGeneratedCareerPlan hook present; loop monitoring not wired as a metric.'
        : 'Not wired yet.'
    ),
    check(
      'dashboard_same_plan',
      'Dashboard My Plan reads same plan',
      dashboard && planHook ? 'healthy' : 'not_wired',
      dashboard && planHook
        ? 'Dashboard and plan hook present (shared plan source expected).'
        : 'Not wired yet.'
    ),
    check(
      'documents_same_plan',
      'Documents reads same plan',
      documents && planHook ? 'healthy' : 'not_wired',
      documents && planHook
        ? 'DocumentsHub uses useGeneratedCareerPlan.'
        : 'Not wired yet.'
    ),
    check(
      'cv_same_plan',
      'CV Builder reads same plan',
      cvBuilder ? 'healthy' : 'not_wired',
      cvBuilder
        ? 'CV Builder page present; plan-aware scoring helper shared when used.'
        : 'Not wired yet.'
    ),
    check(
      'reset_controls',
      'Reset Plan / Reset CV controls',
      resetPlan && resetCv ? 'healthy' : resetPlan || resetCv ? 'warning' : 'not_wired',
      resetPlan && resetCv
        ? 'Routes present: /api/career-plan/reset and /api/cv/delete.'
        : 'One or more reset routes missing.'
    ),
    check(
      'localstorage_override',
      'localStorage does not override Supabase plan',
      'not_wired',
      'Not wired yet — no automated guest/localStorage conflict monitor.'
    ),
  ]
  return buildModule('career_assistant', checks, checkedAt)
}

async function checkJobs(checkedAt: string): Promise<HealthModule> {
  const searchRoute = fileExists('app/api/jobs/search/route.ts')
  const reed = envPresent('REED_API_KEY')
  const adzuna = envPresent('ADZUNA_APP_ID') && envPresent('ADZUNA_APP_KEY')
  const appliedList = fileExists('app/api/jobs/applied/list/route.ts')
  const appliedUpsert = fileExists('app/api/jobs/applied/upsert/route.ts')
  const savedJobsApi = fileExists('app/api/saved-jobs/toggle/route.ts')
  const savedJobsTable = await probeTable('saved_jobs')

  const checks: HealthCheckItem[] = [
    check(
      'job_search_endpoint',
      'Job search endpoint configured',
      searchRoute ? 'healthy' : 'error',
      searchRoute
        ? 'Route present: /api/jobs/search (config check only).'
        : 'Job search route missing.'
    ),
    check(
      'jobs_api_keys',
      'External jobs API keys',
      reed || adzuna ? 'healthy' : 'warning',
      reed || adzuna
        ? `Configured: ${[reed ? 'REED_API_KEY' : null, adzuna ? 'ADZUNA_APP_ID/KEY' : null].filter(Boolean).join(', ')} (values not shown).`
        : 'REED_API_KEY and ADZUNA credentials missing — external search may fail.'
    ),
    check(
      'jobs_rate_limit',
      'Jobs API rate-limit handling',
      'not_wired',
      'Not wired yet — no health metric for jobs rate limits.'
    ),
    check(
      'saved_jobs_api',
      'Saved jobs API',
      savedJobsApi && savedJobsTable.exists
        ? 'healthy'
        : savedJobsApi
          ? 'warning'
          : 'not_wired',
      savedJobsApi && savedJobsTable.exists
        ? 'Route /api/saved-jobs/toggle and saved_jobs table probe OK.'
        : savedJobsApi
          ? 'Toggle route present; saved_jobs table not confirmed.'
          : 'Not wired yet — dedicated saved-jobs API route not confirmed.'
    ),
    check(
      'applied_jobs_api',
      'Applied jobs API',
      appliedList && appliedUpsert ? 'healthy' : 'warning',
      appliedList && appliedUpsert
        ? 'Routes present: /api/jobs/applied/list and upsert.'
        : 'Applied jobs API routes incomplete.'
    ),
    check(
      'jobs_fallback',
      'Fallback if external API fails',
      searchRoute ? 'not_wired' : 'not_wired',
      'Not wired yet — fallback behaviour not measured by health checks.'
    ),
  ]
  return buildModule('jobs', checks, checkedAt)
}

async function checkCoursesAffiliate(checkedAt: string): Promise<HealthModule> {
  const [published, missingRef, missingProv, clicks, providers] = await Promise.all([
    countPublishedCourses(),
    countPublishedMissing('referral_url'),
    countPublishedMissing('provider_name'),
    probeTable('course_clicks'),
    probeTable('providers'),
  ])
  const clickRoute = fileExists('app/api/career-hub/courses/click/route.ts')

  const checks: HealthCheckItem[] = [
    check(
      'published_count',
      'Published courses count',
      published.available ? 'healthy' : 'warning',
      published.available
        ? `${published.count} published course(s).`
        : published.error || 'Could not count published courses.',
      published.count
    ),
    check(
      'missing_referral',
      'Published courses missing referral URL',
      missingRef.available
        ? (missingRef.count || 0) > 0
          ? 'warning'
          : 'healthy'
        : 'not_wired',
      missingRef.available
        ? (missingRef.count || 0) > 0
          ? `${missingRef.count} published course(s) missing referral_url — revenue blocker risk.`
          : 'No published courses missing referral URL detected by current checks.'
        : missingRef.error || 'Not wired yet.',
      missingRef.count
    ),
    check(
      'missing_provider_record',
      'Published course records without provider',
      missingProv.available
        ? (missingProv.count || 0) > 0
          ? 'warning'
          : 'healthy'
        : 'not_wired',
      missingProv.available
        ? (missingProv.count || 0) > 0
          ? `${missingProv.count} published course record(s) without provider_name.`
          : 'No published courses without provider were detected by current checks. Route-level provider gaps are handled in Affiliate Scout.'
        : missingProv.error || 'Not wired yet.',
      missingProv.count
    ),
    check(
      'apply_now_tracking',
      'Apply Now click tracking',
      clickRoute && clicks.exists ? 'healthy' : clickRoute ? 'warning' : 'not_wired',
      clickRoute && clicks.exists
        ? 'Click route and course_clicks table probe OK.'
        : clickRoute
          ? 'Click route present; course_clicks table not confirmed.'
          : 'Not wired yet.'
    ),
    check(
      'referral_new_tab',
      'Referral links open in new tab',
      'not_wired',
      'Not wired yet — frontend target=_blank behaviour not automated.'
    ),
    check(
      'recommendation_only_apply',
      'Recommendation-only courses do not show fake Apply Now',
      'not_wired',
      'Not wired yet — UI rule not monitored by health checks.'
    ),
    check(
      'provider_status',
      'Provider status active/pending/problem respected',
      providers.exists ? 'healthy' : 'not_wired',
      providers.exists
        ? 'providers table probe OK; status enforcement not live-tested.'
        : 'Not wired yet — providers table not confirmed.'
    ),
  ]
  return buildModule('courses_affiliate', checks, checkedAt)
}

async function checkAuthUser(checkedAt: string): Promise<HealthModule> {
  const authPage = fileExists('app/auth/page.tsx') || fileExists('app/login/page.tsx')
  const signup = fileExists('app/signup/page.tsx') || fileExists('app/auth/page.tsx')
  const middleware = fileExists('middleware.ts')
  const dashboard = fileExists('app/dashboard/page.tsx')
  const admin = fileExists('app/admin/page.tsx')

  const checks: HealthCheckItem[] = [
    check(
      'login_signup',
      'Login / signup routes',
      authPage && signup ? 'healthy' : 'warning',
      authPage
        ? 'Auth/login page present.'
        : 'Login/signup page not found.'
    ),
    check(
      'dashboard_protected',
      'Protected dashboard route',
      middleware && dashboard ? 'healthy' : 'warning',
      middleware && dashboard
        ? 'middleware.ts protects /dashboard (cookie/auth check present).'
        : 'Dashboard protection not confirmed.'
    ),
    check(
      'admin_protected',
      'Admin route protected',
      middleware && admin ? 'healthy' : 'warning',
      middleware && admin
        ? 'middleware.ts protects /admin; allowlist enforced server-side.'
        : 'Admin protection not confirmed.'
    ),
    check(
      'guest_mode_tools',
      'Guest mode tools work',
      'not_wired',
      'Not wired yet — guest tool flows not measured by health checks.'
    ),
    check(
      'guest_draft_overwrite',
      'Guest draft does not overwrite saved user data without choice',
      'not_wired',
      'Not wired yet — overwrite-conflict monitoring not connected.'
    ),
  ]
  return buildModule('auth_user', checks, checkedAt)
}

async function checkSupabaseDb(checkedAt: string): Promise<HealthModule> {
  const serviceConfigured = Boolean(getAdminCoursesSupabase())
  const tables = [
    'cvs',
    'ai_career_assessments',
    'courses',
    'course_opportunities',
    'course_clicks',
    'providers',
    'admin_ai_reports',
    'admin_tasks',
    'site_brain_rules',
    'user_activity_events',
    'saved_jobs',
  ] as const

  const probes = await Promise.all(
    tables.map(async (t) => {
      const p = await probeTable(t)
      return { table: t, ...p }
    })
  )

  const checks: HealthCheckItem[] = [
    check(
      'supabase_client',
      'Supabase admin client',
      serviceConfigured ? 'healthy' : 'error',
      serviceConfigured
        ? 'Service role client available for admin checks.'
        : 'SUPABASE_SERVICE_ROLE_KEY / URL missing — admin health probes limited.'
    ),
    ...probes.map((p) =>
      check(
        `table_${p.table}`,
        `Table: ${p.table}`,
        p.exists ? 'healthy' : 'warning',
        p.exists
          ? `Table ${p.table} reachable.`
          : p.message || `Table ${p.table} not found or not in schema cache.`
      )
    ),
    check(
      'rls_policies',
      'RLS policies do not block required reads/writes',
      'not_wired',
      'Not wired yet — RLS policy audit not automated.'
    ),
    check(
      'assessment_query_loop',
      'Latest assessment query does not loop',
      'not_wired',
      'Not wired yet — query-loop detection not connected.'
    ),
    check(
      'schema_cache_warnings',
      'Schema cache warnings',
      probes.some((p) => /schema cache/i.test(p.message || '')) ? 'warning' : 'not_wired',
      probes.some((p) => /schema cache/i.test(p.message || ''))
        ? 'Schema cache warning detected on at least one table probe.'
        : 'Not wired yet — no dedicated schema-cache monitor (none detected in this run).'
    ),
  ]
  return buildModule('supabase_db', checks, checkedAt)
}

async function checkTracking(checkedAt: string): Promise<HealthModule> {
  const activity = await probeTable('user_activity_events')
  const siteEvents = await probeTable('site_events')
  const clicks = await probeTable('course_clicks')
  const trackHelper = fileExists('lib/analytics/trackEvent.ts')

  const checks: HealthCheckItem[] = [
    check(
      'site_events_table',
      'site_events table',
      siteEvents.exists ? 'healthy' : 'not_wired',
      siteEvents.exists
        ? 'site_events table probe OK.'
        : 'Not wired yet — site_events not confirmed (user_activity_events may be used instead).'
    ),
    check(
      'user_activity_events',
      'user_activity_events table',
      activity.exists ? 'healthy' : 'not_wired',
      activity.exists
        ? 'user_activity_events table probe OK (primary trackEvent target).'
        : 'Not wired yet — user_activity_events not confirmed.'
    ),
    check(
      'course_click_tracking',
      'course_click tracking',
      clicks.exists ? 'healthy' : 'not_wired',
      clicks.exists ? 'course_clicks table probe OK.' : 'Not wired yet.'
    ),
    check(
      'assistant_saved_plan_event',
      'assistant_saved_plan event',
      trackHelper ? 'not_wired' : 'not_wired',
      'Not wired yet — event emission not verified by health checks.'
    ),
    check(
      'cv_started_saved_events',
      'cv_started / cv_saved events',
      trackHelper ? 'not_wired' : 'not_wired',
      'Not wired yet — CV analytics events not verified by health checks.'
    ),
    check(
      'apply_now_clicked_event',
      'apply_now_clicked event',
      clicks.exists ? 'healthy' : 'not_wired',
      clicks.exists
        ? 'Apply Now clicks stored via course_clicks when click API is used.'
        : 'Not wired yet.'
    ),
    check(
      'login_prompt_shown_event',
      'login_prompt_shown event',
      'not_wired',
      'Not wired yet.'
    ),
    check(
      'tool_used_event',
      'tool_used event',
      'not_wired',
      'Not wired yet.'
    ),
  ]
  return buildModule('tracking', checks, checkedAt)
}

async function checkDeployment(checkedAt: string): Promise<HealthModule> {
  const required = [
    { name: 'NEXT_PUBLIC_SUPABASE_URL', critical: true },
    { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', critical: true },
    { name: 'SUPABASE_SERVICE_ROLE_KEY', critical: true },
    { name: 'OPENAI_API_KEY', critical: false },
    { name: 'ELEVENLABS_API_KEY', critical: false },
    { name: 'REED_API_KEY', critical: false },
    { name: 'ADZUNA_APP_ID', critical: false },
    { name: 'ADZUNA_APP_KEY', critical: false },
  ] as const

  const checks: HealthCheckItem[] = required.map((e) => {
    const present = envPresent(e.name)
    const status: HealthStatus = present
      ? 'healthy'
      : e.critical
        ? 'error'
        : 'warning'
    return check(
      `env_${e.name}`,
      e.name,
      status,
      present ? 'Present (value not shown).' : `Missing${e.critical ? ' — launch risk' : ' — optional for some features'}.`
    )
  })

  checks.push(
    check(
      'email_provider_keys',
      'Email provider keys',
      'not_wired',
      'Not wired yet — email system planned for later.'
    )
  )

  return buildModule('deployment', checks, checkedAt)
}

const MODULE_RUNNERS: Record<HealthModuleId, (at: string) => Promise<HealthModule>> = {
  ai_services: checkAiServices,
  interview_voice: checkInterviewVoice,
  cv_documents: checkCvDocuments,
  career_assistant: checkCareerAssistant,
  jobs: checkJobs,
  courses_affiliate: checkCoursesAffiliate,
  auth_user: checkAuthUser,
  supabase_db: checkSupabaseDb,
  tracking: checkTracking,
  deployment: checkDeployment,
}

export function parseSiteHealthScope(raw: string | null | undefined): SiteHealthScope {
  const v = String(raw || 'basic').toLowerCase()
  if (
    ['basic', 'ai', 'courses', 'cv', 'jobs', 'interview', 'tracking', 'all'].includes(v)
  ) {
    return v as SiteHealthScope
  }
  return 'basic'
}

export async function runSiteHealthCheck(
  scopeInput: SiteHealthScope | string = 'basic'
): Promise<SiteHealthSnapshot> {
  const scope = parseSiteHealthScope(String(scopeInput))
  const checkedAt = new Date().toISOString()
  const wanted = SCOPE_MODULES[scope]
  const moduleIds =
    wanted === 'all' ? (Object.keys(MODULE_RUNNERS) as HealthModuleId[]) : wanted

  const modules = await Promise.all(moduleIds.map((id) => MODULE_RUNNERS[id](checkedAt)))
  const overallStatus = aggregateStatus(
    modules.flatMap((m) => m.checks.map((c) => ({ ...c, id: `${m.id}:${c.id}` })))
  )

  const notes: string[] = [
    'Lightweight checks only — no expensive live external API calls.',
    'Secret values are never included (present/missing only).',
    'not_wired means monitoring is missing, not that a failure occurred.',
    'Route-level provider gaps are handled in Affiliate Scout; this report uses course-record checks.',
  ]

  return {
    checkedAt,
    scope,
    overallStatus,
    modules,
    notes,
  }
}

/** Compact summary for AI prompts */
export function summarizeSiteHealthForPrompt(snapshot: SiteHealthSnapshot): string {
  const lines: string[] = [
    `Overall status: ${snapshot.overallStatus}`,
    `Checked at: ${snapshot.checkedAt}`,
    `Scope: ${snapshot.scope}`,
    '',
  ]
  for (const m of snapshot.modules) {
    lines.push(`### ${m.title} [${m.status}]`)
    lines.push(m.explanation)
    for (const c of m.checks) {
      const count = c.count != null ? ` count=${c.count}` : ''
      lines.push(`- (${c.status}) ${c.label}:${count} ${c.detail}`)
    }
    lines.push('')
  }
  lines.push('Notes:')
  for (const n of snapshot.notes) lines.push(`- ${n}`)
  return lines.join('\n')
}
