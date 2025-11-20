"use client"

import React, { useEffect, useMemo, useState } from "react"
import {
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Moon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"
import { useTheme } from "@/components/theme-provider"
import { getSession } from "@/lib/auth-storage"

export const ClientTopBar = ({ label, interactive = true }) => {
  const { state, toggleSidebar } = useSidebar()
  const { theme, setTheme } = useTheme()
  const [sessionUser, setSessionUser] = useState(null)

  useEffect(() => {
    const session = getSession()
    setSessionUser(session?.user ?? null)
  }, [])

  const roleLabel = useMemo(() => {
    const baseRole = sessionUser?.role ?? "CLIENT"
    const normalized = baseRole.toLowerCase()
    return normalized.charAt(0).toUpperCase() + normalized.slice(1)
  }, [sessionUser])

  const computedLabel = useMemo(() => {
    if (label) {
      return label
    }
    const fullName = sessionUser?.fullName?.trim()
    if (fullName) {
      return `${fullName}'s dashboard`
    }
    return `${roleLabel} dashboard`
  }, [label, sessionUser, roleLabel])

  const sidebarClosed = state === "collapsed"
  const SidebarToggleIcon = sidebarClosed ? PanelLeftOpen : PanelLeftClose
  const isDarkMode = theme === "dark"
  const ThemeIcon = isDarkMode ? Sun : Moon

  const toggleTheme = () => {
    if (!interactive) return
    setTheme(isDarkMode ? "light" : "dark")
  }

  const handleSidebarToggle = () => {
    if (!interactive) return
    toggleSidebar()
  }

  return (
    <div className="flex w-full flex-wrap items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full border border-border text-muted-foreground hover:text-foreground disabled:opacity-60"
        onClick={handleSidebarToggle}
        disabled={!interactive}
      >
        <SidebarToggleIcon className="size-4" />
        <span className="sr-only">
          {sidebarClosed ? "Open navigation" : "Close navigation"}
        </span>
      </Button>
      <div className="flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium text-muted-foreground">
        <span className="truncate">{computedLabel}</span>
        <ChevronRight className="size-3.5" />
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="rounded-full border border-border text-muted-foreground hover:text-foreground disabled:opacity-60"
        onClick={toggleTheme}
        aria-label="Toggle theme"
        disabled={!interactive}
      >
        <ThemeIcon className="size-4" />
      </Button>
    </div>
  )
}

export default ClientTopBar
