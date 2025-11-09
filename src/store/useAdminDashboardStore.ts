'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export const ADMIN_TAB_VALUES = [
  'overview',
  'events',
  'races',
  'obstacles',
  'tickets',
  'promocodes',
  'promotions',
  'upsells',
  'members',
  'checkin',
  'logs',
  'emails',
  'distribution-lists',
] as const

export type AdminTabValue = (typeof ADMIN_TAB_VALUES)[number]

interface AdminDashboardStore {
  activeTab: AdminTabValue
  setActiveTab: (tab: AdminTabValue) => void
}

export const useAdminDashboardStore = create<AdminDashboardStore>()(
  persist(
    (set) => ({
      activeTab: 'overview',
      setActiveTab: (tab) => set({ activeTab: tab }),
    }),
    {
      name: 'admin-dashboard-tab',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
