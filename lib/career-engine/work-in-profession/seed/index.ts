import { dedupeProfessionRoles } from '../dedupe'

import { PROFESSIONAL_LEVELS } from '../levels'

import type { ProfessionKnowledgeBundle } from '../types'

import { WIP_LIBRARY_VERSION, WIP_STATUS } from '../types'

import { PROFESSION_FIELDS } from './fields'

import { PROFESSION_SPECIALISMS } from './specialisms'

import { PROFESSION_ROLES_A } from './roles-a'

import { PROFESSION_ROLES_B } from './roles-b'



type ProfessionLibraryMeta = {

  raw_roles: number

  duplicates_removed: number

}



let cached: ProfessionKnowledgeBundle | null = null

let cachedMeta: ProfessionLibraryMeta | null = null



/** Load in-memory Work in My Profession knowledge (draft / internal). */

export function loadProfessionKnowledge(): ProfessionKnowledgeBundle {

  if (cached) return cached



  const rawRoles = [...PROFESSION_ROLES_A, ...PROFESSION_ROLES_B]

  const deduped = dedupeProfessionRoles(rawRoles)



  cachedMeta = {

    raw_roles: deduped.raw_count,

    duplicates_removed: deduped.duplicates_removed,

  }



  cached = {

    version: WIP_LIBRARY_VERSION,

    status: WIP_STATUS,

    levels: PROFESSIONAL_LEVELS,

    fields: [...PROFESSION_FIELDS].sort((a, b) => a.sort_order - b.sort_order),

    specialisms: [...PROFESSION_SPECIALISMS].sort((a, b) => a.sort_order - b.sort_order),

    roles: deduped.roles,

  }

  return cached

}



export function getProfessionLibraryCounts() {

  const k = loadProfessionKnowledge()

  const meta = cachedMeta ?? { raw_roles: k.roles.length, duplicates_removed: 0 }

  return {

    version: k.version,

    status: k.status,

    fields: k.fields.length,

    specialisms: k.specialisms.length,

    levels: k.levels.length,

    roles: k.roles.length,

    role_targets: k.roles.length,

    raw_roles: meta.raw_roles,

    duplicates_removed: meta.duplicates_removed,

  }

}


