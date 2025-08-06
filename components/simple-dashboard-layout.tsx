"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import Link from "next/link"

import { 
  Home
} from "lucide-react"
import { NotificationSystem } from "./notification-system"

interface SimpleDashboardLayoutProps {
  children: React.ReactNode
  currentRole: "tenant" | "admin" | "service_provider"
  title?: string
}

export function SimpleDashboardLayout({
  children,
  currentRole,
  title,
}: SimpleDashboardLayoutProps) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [])



  const roleConfig = {
    tenant: {
      title: title || "Tenant Dashboard",
      color: "bg-blue-600",
    },
    admin: {
      title: title || "Admin Dashboard", 
      color: "bg-red-600",
    },
    service_provider: {
      title: title || "Support Dashboard",
      color: "bg-green-600",
    }
  }

  const config = roleConfig[currentRole]

  return (
    <div className="bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">RH</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Reality Housing & Support</h1>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-4">
            {/* Back to Home Link */}
            <Link 
              href="/" 
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Home</span>
            </Link>

            {/* Notifications */}
            <NotificationSystem />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  )
}
