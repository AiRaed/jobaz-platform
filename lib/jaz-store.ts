import { create } from 'zustand'

export type JazMode = 'ask' | 'guide' | 'translate' | 'apply'
/** @deprecated Tab modes removed — UI is unified. Internal API still uses ask/guide/translate intents. */

export interface JobData {
  title: string
  company: string
  description: string
  requirements?: string
  id?: string
}

interface JazStore {
  isOpen: boolean
  mode: JazMode
  jobData: JobData | null
  openJaz: (mode?: JazMode, jobData?: JobData | null) => void
  closeJaz: () => void
  setMode: (mode: JazMode) => void
  setJobData: (jobData: JobData | null) => void
}

export const useJazStore = create<JazStore>((set) => ({
  isOpen: false,
  mode: 'ask',
  jobData: null,
  openJaz: (mode = 'ask', jobData = null) => set({ isOpen: true, mode, jobData }),
  closeJaz: () => set({ isOpen: false, jobData: null }),
  setMode: (mode) => set({ mode }),
  setJobData: (jobData) => set({ jobData }),
}))

