'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Check,
  Database,
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  UserPlus,
  Merge,
} from 'lucide-react'
import { ConfirmModal } from '@/components/ConfirmModal'
import CleanupDuplicatesModal from '@/components/admin/courses/CleanupDuplicatesModal'
import OpportunityFormModal from '@/components/admin/courses/OpportunityFormModal'
import { RouteChips, ProviderChips, GoalChips, TrackerBadge, VisibilityBadge, CommercialStatusBadge, WieAlignmentBadges } from '@/components/admin/courses/opportunityBadges'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import {
  AFFILIATE_STATUS_OPTIONS,
  COMMERCIAL_STATUS_OPTIONS,
  EDUCATION_FIELD_FILTER_OPTIONS,
  OPPORTUNITY_PUBLISH_STATUS_OPTIONS,
  OPPORTUNITY_PURPOSE_OPTIONS,
  OPPORTUNITY_ROUTE_OPTIONS,
  OPPORTUNITY_STATUS_OPTIONS,
  OPPORTUNITY_GOAL_OPTIONS,
  PROVIDER_NAME_PRESETS,
  VISIBILITY_STATUS_OPTIONS,
  WIE_STAGE_FILTER_OPTIONS,
} from '@/lib/admin/opportunities/constants'
import {
  collectEducationFieldFilterOptions,
  collectSpecialismsForEducationField,
} from '@/lib/admin/opportunities/wieTrackerFilters'
import {
  collectProfessionFieldFilterOptions,
  collectSpecialismsForProfessionField,
  summarizeWipTrackerCounts,
  WIP_PROFESSIONAL_LEVEL_FILTER_OPTIONS,
} from '@/lib/admin/opportunities/wipTrackerFilters'
import {
  createCourseOpportunityRecord,
  deleteCourseOpportunityRecord,
  fetchCourseOpportunities,
  markCourseOpportunityPublished,
  seedCourseOpportunityPlanningTemplate,
  seedWorkInEducationOpportunityBank,
  activateWorkInEducationRecommendationCards,
  seedWieGeneratedCourseTypes,
  seedWipGeneratedCourseTypes,
  cleanupCourseOpportunityDuplicates,
  previewCourseOpportunityDuplicateCleanup,
  syncCourseOpportunitiesWithPublished,
  updateCourseOpportunityRecord,
  bulkSetCourseOpportunityVisibility,
  type OpportunityDataSource,
} from '@/lib/admin/opportunities/repository'
import {
  resolveCommercialStatusForOpportunity,
  resolveVisibilityForOpportunity,
} from '@/lib/recommendations/visibility'
import { AFFILIATE_READINESS_HELPER } from '@/lib/admin/opportunities/affiliateReadiness'
import {
  computeOpportunitySummary,
  filterOpportunities,
  findDuplicatePublishedLinks,
  summarizeAffiliateStatus,
  summarizeProviderStatus,
  type OpportunityQuickView,
} from '@/lib/admin/opportunities/query'
import { opportunityToAdminCourseInput } from '@/lib/admin/opportunities/toPublicCourseInput'
import type { AdminCourseInput } from '@/lib/admin/courses/types'
import type { CourseOpportunity, CourseOpportunityInput } from '@/lib/admin/opportunities/types'
import type { CleanupDuplicatesPlan } from '@/lib/admin/opportunities/cleanupDuplicates'
import {
  classifyOpportunityLike,
  buildWieCourseAlignmentAudit,
  type WieAlignmentAuditSummary,
} from '@/lib/career-engine/work-in-education/course-alignment'
import { isGeneratedWieCourseOpportunity } from '@/lib/admin/opportunities/seedWieGeneratedCourseTypes'

type Props = {
  onCreatePublicCourse: (input: AdminCourseInput) => void
  onEditPublishedCourse?: (courseId: string) => void
}

const QUICK_VIEWS: { id: OpportunityQuickView; label: string }[] = [
  { id: 'recommendation-cards', label: 'Recommendation cards' },
  { id: 'high-priority', label: 'High Priority' },
  { id: 'need-provider', label: 'Need Provider' },
  { id: 'affiliate-ready', label: 'Affiliate ready' },
  { id: 'needs-custom-link', label: 'Needs custom link' },
  { id: 'ready-to-add', label: 'Ready to Add' },
  { id: 'published', label: 'Published' },
  { id: 'later', label: 'Later' },
  { id: 'wie-generated', label: 'WIE generated' },
  { id: 'wie-aligned', label: 'WIE aligned' },
  { id: 'wie-needs-provider', label: 'WIE needs provider' },
  { id: 'wie-affiliate-ready', label: 'WIE affiliate ready' },
  { id: 'wie-contamination', label: 'WIE contamination risk' },
  { id: 'wie-needs-mapping', label: 'WIE missing mapping' },
  { id: 'wie-not-aligned', label: 'Not for WIE' },
  { id: 'wip-generated', label: 'WIP generated' },
  { id: 'wip-aligned', label: 'WIP aligned' },
  { id: 'wip-needs-provider', label: 'WIP needs provider' },
  { id: 'wip-affiliate-ready', label: 'WIP affiliate ready' },
  { id: 'all', label: 'All' },
]

const SUMMARY_CARDS: {
  key: keyof ReturnType<typeof computeOpportunitySummary>
  label: string
  quickView: OpportunityQuickView
}[] = [
  { key: 'total', label: 'Total opportunities', quickView: 'all' },
  { key: 'highPriority', label: 'High priority', quickView: 'high-priority' },
  { key: 'needProvider', label: 'Need provider', quickView: 'need-provider' },
  { key: 'courseAffiliateReady', label: 'Course affiliate ready', quickView: 'affiliate-ready' },
  { key: 'readyToAdd', label: 'Ready to add', quickView: 'ready-to-add' },
  { key: 'published', label: 'Published', quickView: 'published' },
]

export default function CourseOpportunityTracker({
  onCreatePublicCourse,
  onEditPublishedCourse,
}: Props) {
  const { addToast } = useToast()
  const [opportunities, setOpportunities] = useState<CourseOpportunity[]>([])
  const [dataSource, setDataSource] = useState<OpportunityDataSource>('mock')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [routeFilter, setRouteFilter] = useState('all')
  const [purposeFilter, setPurposeFilter] = useState('all')
  const [opportunityStatusFilter, setOpportunityStatusFilter] = useState('all')
  const [affiliateStatusFilter, setAffiliateStatusFilter] = useState('all')
  const [publishStatusFilter, setPublishStatusFilter] = useState('all')
  const [providerFilter, setProviderFilter] = useState('all')
  const [visibilityFilter, setVisibilityFilter] = useState('all')
  const [commercialFilter, setCommercialFilter] = useState('all')
  const [canBeCardFilter, setCanBeCardFilter] = useState('all')
  const [educationFieldFilter, setEducationFieldFilter] = useState('all')
  const [specialisationFilter, setSpecialisationFilter] = useState('all')
  const [stageFilter, setStageFilter] = useState('all')
  const [goalPathFilter, setGoalPathFilter] = useState('all')
  const [professionFieldFilter, setProfessionFieldFilter] = useState('all')
  const [professionSpecialismFilter, setProfessionSpecialismFilter] = useState('all')
  const [professionalLevelFilter, setProfessionalLevelFilter] = useState('all')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [quickView, setQuickView] = useState<OpportunityQuickView>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [focusProviders, setFocusProviders] = useState(false)
  const [editing, setEditing] = useState<CourseOpportunity | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CourseOpportunity | null>(null)
  const [seedConfirmOpen, setSeedConfirmOpen] = useState(false)
  const [educationBankConfirmOpen, setEducationBankConfirmOpen] = useState(false)
  const [generatedTypesConfirmOpen, setGeneratedTypesConfirmOpen] = useState(false)
  const [wipGeneratedTypesConfirmOpen, setWipGeneratedTypesConfirmOpen] = useState(false)
  const [activateCardsConfirmOpen, setActivateCardsConfirmOpen] = useState(false)
  const [cleanupConfirmOpen, setCleanupConfirmOpen] = useState(false)
  const [cleanupPreviewLoading, setCleanupPreviewLoading] = useState(false)
  const [cleanupPreview, setCleanupPreview] = useState<CleanupDuplicatesPlan | null>(null)
  const [cleanupPreviewMessage, setCleanupPreviewMessage] = useState<string | null>(null)
  const [syncConfirmOpen, setSyncConfirmOpen] = useState(false)
  const [seedMessage, setSeedMessage] = useState<string | null>(null)

  const revalidateTrackerState = useCallback(async (): Promise<CourseOpportunity[] | null> => {
    setLoading(true)
    const result = await fetchCourseOpportunities()
    setLoading(false)

    if (!result.ok) {
      addToast({
        title: 'Could not load tracker',
        description: result.error,
        variant: 'error',
        duration: 5000,
      })
      return null
    }

    setOpportunities(result.data.opportunities)
    setDataSource(result.data.source)
    return result.data.opportunities
  }, [addToast])

  const openCleanupModal = useCallback(async () => {
    setCleanupConfirmOpen(true)
    setCleanupPreview(null)
    setCleanupPreviewMessage(null)
    setCleanupPreviewLoading(true)

    const result = await previewCourseOpportunityDuplicateCleanup()
    setCleanupPreviewLoading(false)

    if (!result.ok) {
      addToast({
        title: 'Could not preview cleanup',
        description: result.error,
        variant: 'error',
        duration: 5000,
      })
      setCleanupPreviewMessage('Could not load cleanup preview.')
      return
    }

    setCleanupPreview(result.data.plan)
    setCleanupPreviewMessage(result.data.message)
  }, [addToast])

  const closeCleanupModal = useCallback(() => {
    if (saving) return
    setCleanupConfirmOpen(false)
    setCleanupPreview(null)
    setCleanupPreviewMessage(null)
  }, [saving])

  const refresh = revalidateTrackerState

  useEffect(() => {
    void refresh()
  }, [refresh])

  const summary = useMemo(() => computeOpportunitySummary(opportunities), [opportunities])
  const wieAudit: WieAlignmentAuditSummary = useMemo(
    () => buildWieCourseAlignmentAudit(opportunities),
    [opportunities]
  )

  const [coveragePanel, setCoveragePanel] = useState<{
    total_fields: number
    fields_covered: number
    fields_partially_covered: number
    fields_missing_course_coverage: number
    specialisms_missing_courses: number
    high_priority_missing_course_types: string[]
    fields?: Array<{ field_name: string; status: string; specialisms_missing: number }>
  } | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch('/api/admin/course-opportunities/wie-alignment-audit')
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled && data?.coverage) setCoveragePanel(data.coverage)
      } catch {
        /* ignore — local alignment strip still works */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [opportunities.length])

  const filtered = useMemo(
    () =>
      filterOpportunities(opportunities, {
        search,
        routeKey: routeFilter,
        coursePurpose: purposeFilter,
        opportunityStatus: opportunityStatusFilter,
        affiliateStatus: affiliateStatusFilter,
        publishStatus: publishStatusFilter,
        provider: providerFilter,
        visibilityStatus: visibilityFilter,
        commercialStatus: commercialFilter,
        canBeCourseCard: canBeCardFilter,
        educationField: educationFieldFilter,
        specialisation: specialisationFilter,
        stage: stageFilter,
        goalPath: goalPathFilter,
        professionField: professionFieldFilter,
        professionSpecialism: professionSpecialismFilter,
        professionalLevel: professionalLevelFilter,
        quickView,
      }),
    [
      opportunities,
      search,
      routeFilter,
      purposeFilter,
      opportunityStatusFilter,
      affiliateStatusFilter,
      publishStatusFilter,
      providerFilter,
      visibilityFilter,
      commercialFilter,
      canBeCardFilter,
      educationFieldFilter,
      specialisationFilter,
      stageFilter,
      goalPathFilter,
      professionFieldFilter,
      professionSpecialismFilter,
      professionalLevelFilter,
      quickView,
    ]
  )

  const educationFieldOptions = useMemo(
    () => collectEducationFieldFilterOptions(opportunities),
    [opportunities]
  )

  const specialisationOptions = useMemo(
    () => collectSpecialismsForEducationField(opportunities, educationFieldFilter),
    [opportunities, educationFieldFilter]
  )

  const professionFieldOptions = useMemo(
    () => collectProfessionFieldFilterOptions(opportunities),
    [opportunities]
  )

  const professionSpecialismOptions = useMemo(
    () => collectSpecialismsForProfessionField(opportunities, professionFieldFilter),
    [opportunities, professionFieldFilter]
  )

  const wipCounts = useMemo(() => summarizeWipTrackerCounts(opportunities), [opportunities])

  // Drop specialism selection when it is no longer valid for the selected field
  useEffect(() => {
    if (specialisationFilter === 'all') return
    if (!specialisationOptions.includes(specialisationFilter)) {
      setSpecialisationFilter('all')
    }
  }, [specialisationFilter, specialisationOptions])

  useEffect(() => {
    if (professionSpecialismFilter === 'all') return
    if (!professionSpecialismOptions.includes(professionSpecialismFilter)) {
      setProfessionSpecialismFilter('all')
    }
  }, [professionSpecialismFilter, professionSpecialismOptions])

  const filterSummary = useMemo(() => {
    const parts: string[] = []
    if (goalPathFilter !== 'all') {
      const goalLabel =
        OPPORTUNITY_GOAL_OPTIONS.find((g) => g.goalKey === goalPathFilter)?.goalLabel ??
        goalPathFilter
      parts.push(`Goal: ${goalLabel}`)
    }
    if (educationFieldFilter !== 'all') parts.push(`Field: ${educationFieldFilter}`)
    if (specialisationFilter !== 'all') parts.push(`Specialism: ${specialisationFilter}`)
    if (stageFilter !== 'all') {
      const stageLabel =
        WIE_STAGE_FILTER_OPTIONS.find((s) => s.value === stageFilter)?.label ?? stageFilter
      parts.push(`Stage: ${stageLabel}`)
    }
    if (professionFieldFilter !== 'all') parts.push(`Profession: ${professionFieldFilter}`)
    if (professionSpecialismFilter !== 'all') {
      parts.push(`Profession specialism: ${professionSpecialismFilter}`)
    }
    if (professionalLevelFilter !== 'all') {
      const levelLabel =
        WIP_PROFESSIONAL_LEVEL_FILTER_OPTIONS.find((l) => l.value === professionalLevelFilter)
          ?.label ?? professionalLevelFilter
      parts.push(`Level: ${levelLabel}`)
    }
    if (quickView !== 'all') {
      parts.push(`View: ${QUICK_VIEWS.find((v) => v.id === quickView)?.label ?? quickView}`)
    }
    return parts.join(' · ')
  }, [
    educationFieldFilter,
    specialisationFilter,
    stageFilter,
    goalPathFilter,
    professionFieldFilter,
    professionSpecialismFilter,
    professionalLevelFilter,
    quickView,
  ])

  const clearPathFilters = () => {
    setEducationFieldFilter('all')
    setSpecialisationFilter('all')
    setStageFilter('all')
    setGoalPathFilter('all')
    setProfessionFieldFilter('all')
    setProfessionSpecialismFilter('all')
    setProfessionalLevelFilter('all')
    setSearch('')
    setRouteFilter('all')
    setPurposeFilter('all')
    setOpportunityStatusFilter('all')
    setAffiliateStatusFilter('all')
    setPublishStatusFilter('all')
    setProviderFilter('all')
    setVisibilityFilter('all')
    setCommercialFilter('all')
    setCanBeCardFilter('all')
    setQuickView('all')
  }
  const openAdd = () => {
    setEditing(null)
    setFocusProviders(false)
    setFormOpen(true)
  }

  const openEdit = (opp: CourseOpportunity, providersFocus = false) => {
    setEditing(opp)
    setFocusProviders(providersFocus)
    setFormOpen(true)
  }

  const handleSave = async (input: CourseOpportunityInput, id?: string) => {
    setSaving(true)
    const result = id
      ? await updateCourseOpportunityRecord(id, input)
      : await createCourseOpportunityRecord(input)
    setSaving(false)

    if (!result.ok) {
      addToast({
        title: id ? 'Could not save opportunity' : 'Could not add opportunity',
        description: result.error,
        variant: 'error',
        duration: 5000,
      })
      return
    }

    addToast({ title: id ? 'Opportunity updated' : 'Opportunity added', variant: 'success' })
    setFormOpen(false)
    setEditing(null)
    setFocusProviders(false)
    await refresh()
  }

  const handleMarkPublished = async (opp: CourseOpportunity) => {
    setSaving(true)
    const result = await markCourseOpportunityPublished(opp.id)
    setSaving(false)

    if (!result.ok) {
      addToast({
        title: 'Could not mark published',
        description: result.error,
        variant: 'error',
        duration: 5000,
      })
      return
    }

    addToast({ title: 'Marked as published in tracker', variant: 'success' })
    await refresh()
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setSaving(true)
    const result = await deleteCourseOpportunityRecord(deleteTarget.id)
    setSaving(false)

    if (!result.ok) {
      addToast({
        title: 'Could not delete opportunity',
        description: result.error,
        variant: 'error',
        duration: 5000,
      })
      return
    }

    addToast({ title: 'Opportunity deleted', variant: 'success' })
    setDeleteTarget(null)
    await refresh()
  }

  const duplicatePublishedLinks = useMemo(
    () => findDuplicatePublishedLinks(opportunities),
    [opportunities]
  )

  const duplicateLinkWarning = useMemo(() => {
    if (!duplicatePublishedLinks.length) return null
    return `${duplicatePublishedLinks.length} published course(s) matched by multiple opportunities — review duplicates.`
  }, [duplicatePublishedLinks])

  const handleSyncConfirm = async () => {
    setSaving(true)
    const result = await syncCourseOpportunitiesWithPublished()
    setSaving(false)
    setSyncConfirmOpen(false)

    if (!result.ok) {
      addToast({
        title: 'Could not sync with published courses',
        description: result.error,
        variant: 'error',
        duration: 5000,
      })
      return
    }

    const { synced } = result.data
    addToast({
      title: 'Synced with published courses',
      description: `Synced ${synced} opportunities with published courses`,
      variant: 'success',
      duration: 6000,
    })

    await revalidateTrackerState()
  }

  const handleSeedConfirm = async () => {
    setSaving(true)
    const result = await seedCourseOpportunityPlanningTemplate()
    setSaving(false)
    setSeedConfirmOpen(false)

    if (!result.ok) {
      addToast({
        title: 'Could not import template',
        description: result.error,
        variant: 'error',
        duration: 5000,
      })
      return
    }

    const { summary, message } = result.data
    setSeedMessage(message)
    addToast({
      title: 'Planning template imported',
      description: `${summary.created} added · ${summary.updated} updated · ${summary.routesAdded} route links · ${summary.goalsAdded} goals · ${summary.providersAdded} providers`,
      variant: 'success',
      duration: 6000,
    })
    await refresh()
  }

  const handleEducationBankConfirm = async () => {
    setSaving(true)
    const result = await seedWorkInEducationOpportunityBank()
    setSaving(false)
    setEducationBankConfirmOpen(false)

    if (!result.ok) {
      addToast({
        title: 'Could not import education bank',
        description: result.error,
        variant: 'error',
        duration: 5000,
      })
      return
    }

    const { summary, message } = result.data
    setSeedMessage(message)
    addToast({
      title: 'Work in my Education bank imported',
      description: `${summary.added_count} added · ${summary.updated_count} updated · ${summary.skipped_duplicate_count} duplicates skipped`,
      variant: 'success',
      duration: 6000,
    })
    await refresh()
  }

  const handleGeneratedTypesConfirm = async () => {
    setSaving(true)
    const result = await seedWieGeneratedCourseTypes()
    setSaving(false)
    setGeneratedTypesConfirmOpen(false)

    if (!result.ok) {
      addToast({
        title: 'Could not generate WIE course types',
        description: result.error,
        variant: 'error',
        duration: 5000,
      })
      return
    }

    const { message, inserted_count, skipped_duplicates, updated_count, total_before, total_after } =
      result.data
    setSeedMessage(
      `${message} Inserted ${inserted_count} · updated ${updated_count} · skipped ${skipped_duplicates}. Total ${total_before} → ${total_after}.`
    )
    addToast({
      title: inserted_count > 0 ? 'WIE course types inserted' : 'WIE course types already covered',
      description: `${inserted_count} inserted into Supabase · ${updated_count} mapped · ${skipped_duplicates} skipped · total ${total_before} → ${total_after}`,
      variant: 'success',
      duration: 9000,
    })
    setQuickView('wie-generated')
    await refresh()
  }

  const handleWipGeneratedTypesConfirm = async () => {
    setSaving(true)
    const result = await seedWipGeneratedCourseTypes()
    setSaving(false)
    setWipGeneratedTypesConfirmOpen(false)

    if (!result.ok) {
      addToast({
        title: 'Could not generate Profession course types',
        description: result.error,
        variant: 'error',
        duration: 5000,
      })
      return
    }

    const { message, inserted_count, skipped_duplicates, total_before, total_after } = result.data
    setSeedMessage(
      `${message} Inserted ${inserted_count} · skipped ${skipped_duplicates}. Total ${total_before} → ${total_after}.`
    )
    addToast({
      title:
        inserted_count > 0
          ? 'Profession course types inserted'
          : 'Profession course types already covered',
      description: `${inserted_count} inserted into Supabase · ${skipped_duplicates} skipped · total ${total_before} → ${total_after}`,
      variant: 'success',
      duration: 9000,
    })
    setGoalPathFilter('work_in_profession')
    setQuickView('wip-generated')
    await refresh()
  }

  const handleActivateEducationCardsConfirm = async () => {
    setSaving(true)
    const result = await activateWorkInEducationRecommendationCards()
    setSaving(false)
    setActivateCardsConfirmOpen(false)

    if (!result.ok) {
      addToast({
        title: 'Could not activate recommendation cards',
        description: result.error,
        variant: 'error',
        duration: 5000,
      })
      return
    }

    const { message, opportunities: refreshedOpportunities } = result.data
    setSeedMessage(message)
    addToast({
      title: 'Recommendation cards activated',
      description: message,
      variant: 'success',
      duration: 6000,
    })

    if (refreshedOpportunities) {
      setOpportunities(refreshedOpportunities)
    }

    setQuickView('recommendation-cards')
    await revalidateTrackerState()
  }

  const handleCleanupConfirm = async () => {
    setSaving(true)
    const result = await cleanupCourseOpportunityDuplicates()
    setSaving(false)
    closeCleanupModal()

    if (!result.ok) {
      addToast({
        title: 'Could not clean duplicates',
        description: result.error,
        variant: 'error',
        duration: 5000,
      })
      return
    }

    const { summary, message, opportunities: cleanedOpportunities } = result.data
    const linkedMerged = summary.linkedPublishedGroupsMerged ?? 0
    const nameRouteMerged = summary.nameRouteGroupsMerged ?? 0
    addToast({
      title: summary.removedDuplicates > 0 ? 'Duplicates cleaned' : 'No duplicates found',
      description:
        summary.removedDuplicates > 0
          ? `${summary.removedDuplicates} duplicate rows merged (${linkedMerged} linked published, ${nameRouteMerged} name/route) · ${result.data.total} unique opportunities`
          : message,
      variant: 'success',
      duration: 6000,
    })

    if (summary.removedDuplicates > 0) {
      setSeedMessage(message)
    }

    if (cleanedOpportunities) {
      setOpportunities(cleanedOpportunities)
    }

    await revalidateTrackerState()
  }

  const handleBulkRecommendationOnly = async () => {
    if (!selectedIds.length) return
    setSaving(true)
    const result = await bulkSetCourseOpportunityVisibility(selectedIds, 'recommendation_only')
    setSaving(false)
    if (!result.ok) {
      addToast({
        title: 'Bulk update failed',
        description: result.error,
        variant: 'error',
        duration: 5000,
      })
      return
    }
    addToast({
      title: 'Recommendation-only cards updated',
      description: `${result.data.updated} opportunities set as recommendation-only cards`,
      variant: 'success',
      duration: 5000,
    })
    setSelectedIds([])
    await refresh()
  }

  const toggleSelected = (id: string, checked: boolean) => {
    setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)))
  }

  const storageLabel =
    dataSource === 'supabase'
      ? 'Stored in Supabase'
      : 'Local mock storage (Supabase env not configured)'

  return (
    <div>
      <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-950/15 px-4 py-3 text-sm text-amber-100/90">
        Internal planning matrix — not visible on the public site until converted to a published course.
        Use “Set selected as Recommendation-only cards” to show training types inside Career Coach results
        without publishing them on Courses &amp; Licences.
      </div>

      {duplicateLinkWarning && (
        <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-950/20 px-4 py-3 text-sm text-amber-200">
          {duplicateLinkWarning}
        </div>
      )}

      {duplicatePublishedLinks.length > 0 && (
        <div className="mb-4 rounded-xl border border-amber-500/25 bg-amber-950/15 px-4 py-3 text-xs text-amber-100/90">
          <p className="font-medium mb-1">Duplicate published links detected</p>
          <ul className="space-y-1 text-amber-200/80">
            {duplicatePublishedLinks.map((dup) => (
              <li key={dup.publishedCourseId}>
                {dup.opportunityIds.length} opportunities link to the same published course (
                {dup.opportunityIds.length} rows)
              </li>
            ))}
          </ul>
        </div>
      )}

      {seedMessage && (
        <div className="mb-4 rounded-xl border border-emerald-500/25 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-200">
          {seedMessage}
        </div>
      )}

      <div className="flex flex-col gap-3 mb-4">
        <div className="flex flex-col xl:flex-row xl:items-center gap-3">
          <button
            type="button"
            onClick={openAdd}
            disabled={loading || saving}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 transition shrink-0 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Add opportunity
          </button>

          <button
            type="button"
            onClick={() => setSyncConfirmOpen(true)}
            disabled={loading || saving}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-600 to-violet-600 text-white hover:from-cyan-500 hover:to-violet-500 transition shrink-0 disabled:opacity-50"
          >
            <RefreshCw className={cn('w-4 h-4', saving && 'animate-spin')} />
            Sync with Published Courses
          </button>

          <button
            type="button"
            onClick={() => setSeedConfirmOpen(true)}
            disabled={loading || saving}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-cyan-500/35 bg-cyan-950/20 text-cyan-200 hover:bg-cyan-950/35 transition shrink-0 disabled:opacity-50"
          >
            <Database className="w-4 h-4" />
            Import planning template
          </button>

          <button
            type="button"
            onClick={() => setEducationBankConfirmOpen(true)}
            disabled={loading || saving}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-violet-500/35 bg-violet-950/20 text-violet-200 hover:bg-violet-950/35 transition shrink-0 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            Import Work in my Education bank
          </button>

          <button
            type="button"
            onClick={() => setGeneratedTypesConfirmOpen(true)}
            disabled={loading || saving}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-sky-500/35 bg-sky-950/20 text-sky-200 hover:bg-sky-950/35 transition shrink-0 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            Generate missing WIE course types
          </button>

          <button
            type="button"
            onClick={() => setWipGeneratedTypesConfirmOpen(true)}
            disabled={loading || saving}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-teal-500/35 bg-teal-950/20 text-teal-200 hover:bg-teal-950/35 transition shrink-0 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            Generate missing Profession course types
          </button>

          <button
            type="button"
            onClick={() => setActivateCardsConfirmOpen(true)}
            disabled={loading || saving}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-emerald-500/35 bg-emerald-950/20 text-emerald-200 hover:bg-emerald-950/35 transition shrink-0 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            Set Work in Education bank as Recommendation Cards
          </button>

          <button
            type="button"
            onClick={() => void openCleanupModal()}
            disabled={loading || saving}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-amber-500/35 bg-amber-950/20 text-amber-200 hover:bg-amber-950/35 transition shrink-0 disabled:opacity-50"
          >
            <Merge className="w-4 h-4" />
            Clean duplicate opportunities
          </button>

          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search course name, routes, providers…"
              disabled={loading}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700/60 bg-slate-950/50 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 disabled:opacity-50"
            />
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <select
            value={routeFilter}
            onChange={(e) => setRouteFilter(e.target.value)}
            disabled={loading}
            className="rounded-xl border border-slate-700/60 bg-slate-950/50 px-3 py-2 text-sm text-slate-200"
          >
            <option value="all">All routes</option>
            {OPPORTUNITY_ROUTE_OPTIONS.map((r) => (
              <option key={r.routeKey} value={r.routeKey}>
                {r.routeLabel}
              </option>
            ))}
          </select>
          <select
            value={purposeFilter}
            onChange={(e) => setPurposeFilter(e.target.value)}
            disabled={loading}
            className="rounded-xl border border-slate-700/60 bg-slate-950/50 px-3 py-2 text-sm text-slate-200"
          >
            <option value="all">All purposes</option>
            {OPPORTUNITY_PURPOSE_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <select
            value={opportunityStatusFilter}
            onChange={(e) => setOpportunityStatusFilter(e.target.value)}
            disabled={loading}
            className="rounded-xl border border-slate-700/60 bg-slate-950/50 px-3 py-2 text-sm text-slate-200"
          >
            <option value="all">All opportunity statuses</option>
            {OPPORTUNITY_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={affiliateStatusFilter}
            onChange={(e) => setAffiliateStatusFilter(e.target.value)}
            disabled={loading}
            className="rounded-xl border border-slate-700/60 bg-slate-950/50 px-3 py-2 text-sm text-slate-200"
          >
            <option value="all">All affiliate statuses</option>
            {AFFILIATE_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={publishStatusFilter}
            onChange={(e) => setPublishStatusFilter(e.target.value)}
            disabled={loading}
            className="rounded-xl border border-slate-700/60 bg-slate-950/50 px-3 py-2 text-sm text-slate-200"
          >
            <option value="all">All publish statuses</option>
            {OPPORTUNITY_PUBLISH_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            disabled={loading}
            className="rounded-xl border border-slate-700/60 bg-slate-950/50 px-3 py-2 text-sm text-slate-200"
          >
            <option value="all">All providers</option>
            {PROVIDER_NAME_PRESETS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <select
            value={visibilityFilter}
            onChange={(e) => setVisibilityFilter(e.target.value)}
            disabled={loading}
            className="rounded-xl border border-slate-700/60 bg-slate-950/50 px-3 py-2 text-sm text-slate-200"
          >
            <option value="all">All visibility</option>
            {VISIBILITY_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={commercialFilter}
            onChange={(e) => setCommercialFilter(e.target.value)}
            disabled={loading}
            className="rounded-xl border border-slate-700/60 bg-slate-950/50 px-3 py-2 text-sm text-slate-200"
          >
            <option value="all">All commercial status</option>
            {COMMERCIAL_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={canBeCardFilter}
            onChange={(e) => setCanBeCardFilter(e.target.value)}
            disabled={loading}
            className="rounded-xl border border-slate-700/60 bg-slate-950/50 px-3 py-2 text-sm text-slate-200"
          >
            <option value="all">All card types</option>
            <option value="yes">Can be course card</option>
            <option value="no">Not a course card</option>
          </select>
          <select
            value={educationFieldFilter}
            onChange={(e) => {
              setEducationFieldFilter(e.target.value)
              setSpecialisationFilter('all')
            }}
            disabled={loading}
            className="rounded-xl border border-slate-700/60 bg-slate-950/50 px-3 py-2 text-sm text-slate-200"
            aria-label="Filter by education field"
          >
            <option value="all">All education fields</option>
            {(educationFieldOptions.length
              ? educationFieldOptions
              : [...EDUCATION_FIELD_FILTER_OPTIONS]
            ).map((field) => (
              <option key={field} value={field}>
                {field}
              </option>
            ))}
          </select>
          <select
            value={specialisationFilter}
            onChange={(e) => setSpecialisationFilter(e.target.value)}
            disabled={loading}
            className="rounded-xl border border-slate-700/60 bg-slate-950/50 px-3 py-2 text-sm text-slate-200"
            aria-label="Filter by specialism"
          >
            <option value="all">
              {educationFieldFilter === 'all'
                ? 'All specialisations'
                : `All specialisms in ${educationFieldFilter}`}
            </option>
            {specialisationOptions.map((spec) => (
              <option key={spec} value={spec}>
                {spec}
              </option>
            ))}
          </select>
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            disabled={loading}
            className="rounded-xl border border-slate-700/60 bg-slate-950/50 px-3 py-2 text-sm text-slate-200"
            aria-label="Filter by education or professional stage"
          >
            <option value="all">All stages</option>
            {WIE_STAGE_FILTER_OPTIONS.map((stage) => (
              <option key={stage.value} value={stage.value}>
                {stage.label}
              </option>
            ))}
          </select>
          <select
            value={goalPathFilter}
            onChange={(e) => setGoalPathFilter(e.target.value)}
            disabled={loading}
            className="rounded-xl border border-slate-700/60 bg-slate-950/50 px-3 py-2 text-sm text-slate-200"
            aria-label="Filter by goal path"
          >
            <option value="all">All goal paths</option>
            {OPPORTUNITY_GOAL_OPTIONS.map((g) => (
              <option key={g.goalKey} value={g.goalKey}>
                {g.goalLabel}
              </option>
            ))}
          </select>
          <select
            value={professionFieldFilter}
            onChange={(e) => {
              setProfessionFieldFilter(e.target.value)
              setProfessionSpecialismFilter('all')
            }}
            disabled={loading}
            className="rounded-xl border border-slate-700/60 bg-slate-950/50 px-3 py-2 text-sm text-slate-200"
            aria-label="Filter by profession field"
          >
            <option value="all">All profession fields</option>
            {professionFieldOptions.map((field) => (
              <option key={field} value={field}>
                {field}
              </option>
            ))}
          </select>
          <select
            value={professionSpecialismFilter}
            onChange={(e) => setProfessionSpecialismFilter(e.target.value)}
            disabled={loading}
            className="rounded-xl border border-slate-700/60 bg-slate-950/50 px-3 py-2 text-sm text-slate-200"
            aria-label="Filter by profession specialism"
          >
            <option value="all">
              {professionFieldFilter === 'all'
                ? 'All profession specialisms'
                : `All specialisms in ${professionFieldFilter}`}
            </option>
            {professionSpecialismOptions.map((spec) => (
              <option key={spec} value={spec}>
                {spec}
              </option>
            ))}
          </select>
          <select
            value={professionalLevelFilter}
            onChange={(e) => setProfessionalLevelFilter(e.target.value)}
            disabled={loading}
            className="rounded-xl border border-slate-700/60 bg-slate-950/50 px-3 py-2 text-sm text-slate-200"
            aria-label="Filter by professional level"
          >
            <option value="all">All professional levels</option>
            {WIP_PROFESSIONAL_LEVEL_FILTER_OPTIONS.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </div>

        {(educationFieldFilter !== 'all' ||
          specialisationFilter !== 'all' ||
          stageFilter !== 'all' ||
          goalPathFilter !== 'all' ||
          professionFieldFilter !== 'all' ||
          professionSpecialismFilter !== 'all' ||
          professionalLevelFilter !== 'all' ||
          quickView !== 'all' ||
          search.trim()) && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-cyan-500/20 bg-cyan-950/15 px-3 py-2">
            <p className="text-xs text-cyan-100/90">
              Showing{' '}
              <span className="font-semibold tabular-nums">{filtered.length}</span> of{' '}
              <span className="font-semibold tabular-nums">{opportunities.length}</span> course
              opportunities
              {filterSummary ? (
                <span className="text-slate-400"> · {filterSummary}</span>
              ) : null}
            </p>
            <button
              type="button"
              onClick={clearPathFilters}
              className="text-xs font-medium text-cyan-200 hover:text-white"
            >
              Clear filters
            </button>
          </div>
        )}

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => void handleBulkRecommendationOnly()}
              disabled={loading || saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-violet-500/35 bg-violet-950/25 text-violet-200 hover:bg-violet-950/40 transition disabled:opacity-50"
            >
              Set selected as Recommendation-only cards ({selectedIds.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-xs text-slate-500 hover:text-slate-300"
            >
              Clear selection
            </button>
          </div>
        )}

      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-4">
        {SUMMARY_CARDS.map((card) => (
          <button
            key={card.key}
            type="button"
            onClick={() => setQuickView(card.quickView)}
            disabled={loading}
            className={cn(
              'rounded-xl border px-3 py-2.5 text-left transition disabled:opacity-50',
              quickView === card.quickView
                ? 'border-violet-500/45 bg-violet-950/35'
                : 'border-slate-700/60 bg-slate-950/40 hover:border-slate-600 hover:bg-slate-900/50'
            )}
          >
            <p className="text-[10px] uppercase tracking-wide text-slate-500">{card.label}</p>
            <p className="text-xl font-semibold text-slate-100 tabular-nums mt-0.5">
              {loading ? '—' : summary[card.key]}
            </p>
          </button>
        ))}
      </div>

      <div className="mb-4 rounded-xl border border-cyan-500/20 bg-cyan-950/15 px-3 py-3">
        <p className="text-[10px] uppercase tracking-wide text-cyan-300/90 mb-2">
          Work in My Education course alignment
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-xs text-slate-300">
          <button type="button" className="text-left hover:text-cyan-100" onClick={() => setQuickView('wie-aligned')}>
            Aligned: <span className="font-semibold tabular-nums">{wieAudit.work_in_education_aligned}</span>
          </button>
          <button type="button" className="text-left hover:text-cyan-100" onClick={() => setQuickView('wie-not-aligned')}>
            Excluded: <span className="font-semibold tabular-nums">{wieAudit.excluded_from_work_in_education}</span>
          </button>
          <button type="button" className="text-left hover:text-cyan-100" onClick={() => setQuickView('wie-needs-mapping')}>
            Missing field/spec/stage: <span className="font-semibold tabular-nums">{wieAudit.missing_education_field + wieAudit.missing_specialism + wieAudit.missing_stage}</span>
          </button>
          <button type="button" className="text-left hover:text-rose-200" onClick={() => setQuickView('wie-contamination')}>
            Contamination risks: <span className="font-semibold tabular-nums">{wieAudit.contamination_risks}</span>
          </button>
        </div>
        <p className="mt-2 text-[10px] text-slate-500">
          High-priority WIE rows needing provider: {wieAudit.high_priority_missing_providers}. Classification is
          computed metadata — existing course rows are not removed. Journey analytics (completed selections,
          recommendations, save interest, missing provider) feed Learning Loop when users run Work in My
          Education — no auto-publish.
        </p>

        {coveragePanel ? (
          <div className="mt-3 border-t border-cyan-500/15 pt-3">
            <p className="text-[10px] uppercase tracking-wide text-cyan-300/80 mb-2">
              Library field ↔ course coverage
            </p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5 text-xs text-slate-300">
              <span>
                Fields: <span className="font-semibold tabular-nums">{coveragePanel.total_fields}</span>
              </span>
              <span>
                Covered: <span className="font-semibold tabular-nums text-emerald-300">{coveragePanel.fields_covered}</span>
              </span>
              <span>
                Partial: <span className="font-semibold tabular-nums text-amber-200">{coveragePanel.fields_partially_covered}</span>
              </span>
              <span>
                Missing: <span className="font-semibold tabular-nums text-rose-200">{coveragePanel.fields_missing_course_coverage}</span>
              </span>
              <button type="button" className="text-left hover:text-cyan-100" onClick={() => setQuickView('wie-needs-provider')}>
                Specs missing courses:{' '}
                <span className="font-semibold tabular-nums">{coveragePanel.specialisms_missing_courses}</span>
              </button>
            </div>
            {coveragePanel.fields_missing_course_coverage > 0 && coveragePanel.fields ? (
              <p className="mt-2 text-[10px] text-slate-500">
                Missing coverage:{' '}
                {coveragePanel.fields
                  .filter((f) => f.status === 'missing_course_coverage')
                  .slice(0, 8)
                  .map((f) => f.field_name)
                  .join(' · ') || '—'}
              </p>
            ) : null}
            {coveragePanel.high_priority_missing_course_types?.length ? (
              <p className="mt-1 text-[10px] text-slate-500 truncate" title={coveragePanel.high_priority_missing_course_types.slice(0, 6).join('; ')}>
                Suggested types: {coveragePanel.high_priority_missing_course_types.slice(0, 4).join(' · ')}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mb-4 rounded-xl border border-teal-500/20 bg-teal-950/15 px-3 py-3">
        <p className="text-[10px] uppercase tracking-wide text-teal-300/90 mb-2">
          Work in My Profession course alignment
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-xs text-slate-300">
          <button
            type="button"
            className="text-left hover:text-teal-100"
            onClick={() => {
              setGoalPathFilter('work_in_profession')
              setQuickView('wip-aligned')
            }}
          >
            Profession routes:{' '}
            <span className="font-semibold tabular-nums">{wipCounts.wipAligned}</span>
          </button>
          <button
            type="button"
            className="text-left hover:text-amber-100"
            onClick={() => {
              setGoalPathFilter('work_in_profession')
              setQuickView('wip-needs-provider')
            }}
          >
            Missing provider:{' '}
            <span className="font-semibold tabular-nums">{wipCounts.wipNeedsProvider}</span>
          </button>
          <button
            type="button"
            className="text-left hover:text-emerald-100"
            onClick={() => {
              setGoalPathFilter('work_in_profession')
              setQuickView('wip-affiliate-ready')
            }}
          >
            Affiliate-ready:{' '}
            <span className="font-semibold tabular-nums">{wipCounts.wipAffiliateReady}</span>
          </button>
          <button
            type="button"
            className="text-left hover:text-teal-100"
            onClick={() => {
              setGoalPathFilter('work_in_profession')
              setQuickView('wip-generated')
            }}
          >
            Generated types:{' '}
            <span className="font-semibold tabular-nums">{wipCounts.wipGenerated}</span>
          </button>
        </div>
        <p className="mt-2 text-[10px] text-slate-500">
          Filter by goal path, profession field, specialism, and professional level. Generated
          Profession course types stay recommendation-only — no fake providers or Apply Now links.
        </p>
      </div>

      <p className="text-xs text-slate-500 mb-1">
        Published count reflects unique linked published courses from the Published Courses tab.
        Use Sync with Published Courses to link planning rows automatically.
      </p>
      <p className="text-xs text-slate-500 mb-3">{AFFILIATE_READINESS_HELPER}</p>

      <div className="flex flex-wrap gap-2 mb-4">
        {QUICK_VIEWS.map((view) => (
          <button
            key={view.id}
            type="button"
            onClick={() => setQuickView(view.id)}
            disabled={loading}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium border transition disabled:opacity-50',
              quickView === view.id
                ? 'border-violet-500/50 bg-violet-950/40 text-violet-200'
                : 'border-slate-700/60 bg-slate-950/40 text-slate-400 hover:text-slate-200 hover:border-slate-600'
            )}
          >
            {view.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-700/60 bg-slate-950/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left min-w-[1000px]">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-900/50 text-[9px] uppercase tracking-widest text-slate-500">
                <th className="px-3 py-2 font-medium w-8">
                  <span className="sr-only">Select</span>
                </th>
                <th className="px-3 py-2 font-medium">Course / licence</th>
                <th className="px-3 py-2 font-medium hidden xl:table-cell">Purpose</th>
                <th className="px-3 py-2 font-medium min-w-[140px]">Routes</th>
                <th className="px-3 py-2 font-medium hidden lg:table-cell min-w-[120px]">Goals</th>
                <th className="px-3 py-2 font-medium w-12">Pri</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium hidden xl:table-cell">Visibility</th>
                <th className="px-3 py-2 font-medium hidden xl:table-cell">Commercial</th>
                <th className="px-3 py-2 font-medium hidden lg:table-cell">Providers</th>
                <th className="px-3 py-2 font-medium hidden md:table-cell">Affiliate</th>
                <th className="px-3 py-2 font-medium hidden sm:table-cell">Publish</th>
                <th className="px-3 py-2 font-medium min-w-[140px]">Next action</th>
                <th className="px-3 py-2 font-medium text-right w-[130px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={14} className="px-3 py-12 text-center text-slate-400">
                    <span className="inline-flex items-center gap-2 text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading tracker…
                    </span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={14} className="px-3 py-10 text-center text-slate-500 text-sm">
                    No opportunities match your filters. Try another quick view or adjust filters.
                  </td>
                </tr>
              ) : (
                filtered.map((opp) => {
                  const providerNames = opp.providers.map((p) => p.providerName)
                  const routeLabels = opp.routes.map((r) => r.routeLabel)
                  const goalLabels = (opp.goals ?? []).map((g) => g.goalLabel)
                  const visibility = resolveVisibilityForOpportunity(opp)
                  const commercial = resolveCommercialStatusForOpportunity(opp)
                  return (
                    <tr key={opp.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(opp.id)}
                          onChange={(e) => toggleSelected(opp.id, e.target.checked)}
                          className="rounded border-slate-600"
                          aria-label={`Select ${opp.courseName}`}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <p className="font-medium text-slate-100 text-xs leading-snug">{opp.courseName}</p>
                        {opp.shortLabel && (
                          <p className="text-[10px] text-slate-500 mt-0.5">{opp.shortLabel}</p>
                        )}
                        {opp.publishedCourseId && (
                          <div className="mt-1">
                            <TrackerBadge value="Linked to published course" />
                            {opp.linkedPublishedCourseTitle && (
                              <p className="text-[9px] text-slate-600 mt-0.5 truncate max-w-[180px]" title={opp.linkedPublishedCourseTitle}>
                                → {opp.linkedPublishedCourseTitle}
                              </p>
                            )}
                          </div>
                        )}
                        <WieAlignmentBadges
                          badges={classifyOpportunityLike(opp).admin_badges}
                          max={3}
                          generated={isGeneratedWieCourseOpportunity(opp)}
                        />
                        {isGeneratedWieCourseOpportunity(opp) ? (
                          <div className="mt-1 flex flex-wrap gap-0.5">
                            <TrackerBadge value="Need provider" />
                            <TrackerBadge value="Recommendation-only" />
                            <TrackerBadge value="No link" />
                            <TrackerBadge value="Not published" />
                          </div>
                        ) : null}
                      </td>
                      <td className="px-3 py-2 hidden xl:table-cell text-slate-500 text-[10px] max-w-[100px] truncate">
                        {opp.coursePurpose || '—'}
                      </td>
                      <td className="px-3 py-2">
                        <RouteChips labels={routeLabels} max={3} />
                      </td>
                      <td className="px-3 py-2 hidden lg:table-cell">
                        <GoalChips labels={goalLabels} max={2} />
                      </td>
                      <td className="px-3 py-2 text-slate-300 tabular-nums text-[11px]">{opp.priority}</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col gap-0.5">
                          <TrackerBadge value={opp.opportunityStatus} />
                          <span className="text-[9px] text-slate-600 hidden md:inline">
                            {summarizeProviderStatus(opp)}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 hidden xl:table-cell">
                        <VisibilityBadge value={visibility} />
                      </td>
                      <td className="px-3 py-2 hidden xl:table-cell">
                        <CommercialStatusBadge value={commercial} />
                      </td>
                      <td className="px-3 py-2 hidden lg:table-cell">
                        <ProviderChips names={providerNames} max={2} />
                      </td>
                      <td className="px-3 py-2 hidden md:table-cell">
                        <TrackerBadge value={summarizeAffiliateStatus(opp)} />
                      </td>
                      <td className="px-3 py-2 hidden sm:table-cell">
                        <TrackerBadge value={opp.publishStatus} />
                      </td>
                      <td className="px-3 py-2 text-[10px] text-slate-500 max-w-[160px] truncate" title={opp.nextAction}>
                        {opp.nextAction || '—'}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end gap-0">
                          <button
                            type="button"
                            onClick={() => openEdit(opp)}
                            disabled={saving}
                            className="p-1.5 rounded-md text-slate-400 hover:text-violet-300 hover:bg-violet-500/10 transition disabled:opacity-50"
                            title="View / Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEdit(opp, true)}
                            disabled={saving}
                            className="p-1.5 rounded-md text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition disabled:opacity-50"
                            title="Add provider"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onCreatePublicCourse(opportunityToAdminCourseInput(opp))}
                            disabled={saving || Boolean(opp.publishedCourseId)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition disabled:opacity-50"
                            title={
                              opp.publishedCourseId
                                ? 'Already linked to a published course'
                                : 'Create public course (draft)'
                            }
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>
                          {opp.publishedCourseId && opp.linkedPublishedCourseSlug && (
                            <Link
                              href={`/courses/${opp.linkedPublishedCourseSlug}`}
                              target="_blank"
                              className="p-1.5 rounded-md text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition"
                              title="Open published course"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          )}
                          {opp.publishedCourseId && onEditPublishedCourse && (
                            <button
                              type="button"
                              onClick={() => onEditPublishedCourse(opp.publishedCourseId!)}
                              disabled={saving}
                              className="p-1.5 rounded-md text-slate-400 hover:text-blue-300 hover:bg-blue-500/10 transition disabled:opacity-50"
                              title="Edit published course"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleMarkPublished(opp)}
                            disabled={saving || opp.publishStatus === 'Published' || Boolean(opp.publishedCourseId)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-blue-300 hover:bg-blue-500/10 transition disabled:opacity-50"
                            title="Mark published in tracker (manual)"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(opp)}
                            disabled={saving}
                            className="p-1.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-slate-500 mt-3">
        {loading
          ? 'Loading…'
          : `Showing ${filtered.length} of ${opportunities.length} course opportunities${
              filterSummary ? ` · ${filterSummary}` : ''
            } · ${storageLabel}`}
      </p>

      <OpportunityFormModal
        open={formOpen}
        opportunity={editing}
        saving={saving}
        focusProviders={focusProviders}
        onClose={() => {
          if (saving) return
          setFormOpen(false)
          setEditing(null)
          setFocusProviders(false)
        }}
        onSave={handleSave}
      />

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete opportunity?"
        message={`Remove "${deleteTarget?.courseName ?? 'this opportunity'}" from the tracker?`}
        variant="danger"
        confirmText={saving ? 'Deleting…' : 'Delete'}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          if (!saving) setDeleteTarget(null)
        }}
      />

      <ConfirmModal
        isOpen={seedConfirmOpen}
        title="Import planning template?"
        message="This will add the starter JobAZ course planning template. Existing opportunities will not be duplicated."
        confirmText={saving ? 'Importing…' : 'Import template'}
        onConfirm={handleSeedConfirm}
        onCancel={() => {
          if (!saving) setSeedConfirmOpen(false)
        }}
      />

      <ConfirmModal
        isOpen={educationBankConfirmOpen}
        title="Import Work in my Education bank?"
        message="Adds affiliate-friendly course opportunities for the Work in my Education path. Existing opportunities are updated with missing metadata only — nothing is published automatically."
        confirmText={saving ? 'Importing…' : 'Import education bank'}
        onConfirm={handleEducationBankConfirm}
        onCancel={() => {
          if (!saving) setEducationBankConfirmOpen(false)
        }}
      />

      <ConfirmModal
        isOpen={generatedTypesConfirmOpen}
        title="Generate missing WIE course types?"
        message="Inserts missing Work in My Education course-type rows into the live Supabase course_opportunities table as recommendation-only / need-provider (no providers, referral URLs, or publish). Existing titles are mapped or skipped — published courses are not changed."
        confirmText={saving ? 'Generating…' : 'Generate course types'}
        onConfirm={handleGeneratedTypesConfirm}
        onCancel={() => {
          if (!saving) setGeneratedTypesConfirmOpen(false)
        }}
      />

      <ConfirmModal
        isOpen={wipGeneratedTypesConfirmOpen}
        title="Generate missing Profession course types?"
        message="Inserts missing Work in My Profession course/licence types into Supabase as recommendation-only / need-provider (no providers, referral URLs, or publish). Existing titles are skipped — nothing is auto-published."
        confirmText={saving ? 'Generating…' : 'Generate Profession course types'}
        onConfirm={handleWipGeneratedTypesConfirm}
        onCancel={() => {
          if (!saving) setWipGeneratedTypesConfirmOpen(false)
        }}
      />

      <ConfirmModal
        isOpen={activateCardsConfirmOpen}
        title="Activate Work in my Education recommendation cards?"
        message="Sets matching education bank opportunities to recommendation-only cards for Career Coach results. Nothing is published to Courses & Licences and no published courses are changed."
        confirmText={saving ? 'Activating…' : 'Activate recommendation cards'}
        onConfirm={handleActivateEducationCardsConfirm}
        onCancel={() => {
          if (!saving) setActivateCardsConfirmOpen(false)
        }}
      />

      <CleanupDuplicatesModal
        isOpen={cleanupConfirmOpen}
        saving={saving}
        loadingPreview={cleanupPreviewLoading}
        preview={cleanupPreview}
        previewMessage={cleanupPreviewMessage}
        onConfirm={handleCleanupConfirm}
        onCancel={closeCleanupModal}
      />

      <ConfirmModal
        isOpen={syncConfirmOpen}
        title="Sync with published courses?"
        message="Match planning opportunities to live published courses by name. Linked rows will be marked Published and provider referral data filled from the course when empty. Notes are not overwritten."
        confirmText={saving ? 'Syncing…' : 'Sync now'}
        onConfirm={handleSyncConfirm}
        onCancel={() => {
          if (!saving) setSyncConfirmOpen(false)
        }}
      />
    </div>
  )
}
