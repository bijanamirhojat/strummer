'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { Guitar, Calendar, Video, MessageSquare, LogOut, BookOpen, User } from 'lucide-react'
import Link from 'next/link'

const navItems = [
  { href: '/dashboard', label: 'Overzicht', icon: BookOpen },
  { href: '/dashboard/videos', label: "Video's", icon: Video },
  { href: '/dashboard/schedule', label: 'Rooster', icon: Calendar },
  { href: '/dashboard/messages', label: 'Berichten', icon: MessageSquare },
  { href: '/dashboard/profile', label: 'Profiel', icon: User },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, profile, loading, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-900">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-stone-500">Laden...</p>
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    return null
  }

  const initials = profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900">
      <header className="bg-white dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                <Guitar className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg text-stone-800 dark:text-white">Strummer</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(item => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive 
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' 
                        : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            <div className="flex items-center gap-3">
              <Link 
                href="/dashboard/profile"
                className="hidden sm:flex items-center gap-2 px-2 py-1 bg-stone-100 dark:bg-stone-700 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-600 transition-colors"
              >
                {profile.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt="" 
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                    {initials}
                  </div>
                )}
                <span className="text-sm text-stone-700 dark:text-stone-300">{profile.full_name.split(' ')[0]}</span>
              </Link>
              
              <button
                onClick={() => signOut()}
                className="p-2 text-stone-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                aria-label="Uitloggen"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <nav className="md:hidden border-t border-stone-200 dark:border-stone-700">
          <div className="flex justify-around py-2">
            {navItems.map(item => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
                    isActive 
                      ? 'text-amber-600' 
                      : 'text-stone-500'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-xs">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>
    </div>
  )
}
