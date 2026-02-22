'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { Calendar, Video, MessageSquare, LogOut, BookOpen, User, ChevronDown, FileText, Users, Settings } from 'lucide-react'
import Link from 'next/link'

const navItems = [
  { href: '/dashboard', label: 'Overzicht', icon: BookOpen },
  { href: '/dashboard/assignments', label: 'Huiswerk', icon: FileText },
  { href: '/dashboard/videos', label: "Video's", icon: Video },
  { href: '/dashboard/schedule', label: 'Rooster', icon: Calendar },
  { href: '/dashboard/messages', label: 'Berichten', icon: MessageSquare },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, profile, loading, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
          <div className="flex items-center justify-between h-16">
            <Link href="/dashboard" className="flex items-center gap-2">
              <img 
                src="/strummer_academy_logo.png" 
                alt="Strummer Academy" 
                className="h-16 w-auto"
              />
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
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="hidden sm:flex items-center gap-2 px-2 py-1.5 bg-stone-100 dark:bg-stone-700 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-600 transition-colors"
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
                  <ChevronDown className={`w-4 h-4 text-stone-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-stone-800 rounded-xl shadow-lg border border-stone-200 dark:border-stone-700 py-1 animate-fade-in">
                    <div className="px-4 py-2 border-b border-stone-100 dark:border-stone-700">
                      <p className="font-medium text-sm truncate">{profile.full_name}</p>
                      <p className="text-xs text-stone-500 truncate">{profile.email}</p>
                    </div>
                    
                    <Link
                      href="/dashboard/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700"
                    >
                      <User className="w-4 h-4" />
                      Mijn profiel
                    </Link>
                    
                    {profile.role === 'teacher' && (
                      <>
                        <div className="border-t border-stone-100 dark:border-stone-700 my-1"></div>
                        <Link
                          href="/dashboard/users"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700"
                        >
                          <Settings className="w-4 h-4" />
                          Gebruikers beheren
                        </Link>
                      </>
                    )}
                    
                    <div className="border-t border-stone-100 dark:border-stone-700 my-1"></div>
                    <button
                      onClick={() => {
                        setDropdownOpen(false)
                        signOut()
                      }}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full"
                    >
                      <LogOut className="w-4 h-4" />
                      Uitloggen
                    </button>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => signOut()}
                className="sm:hidden p-2 text-stone-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                aria-label="Uitloggen"
              >
                <LogOut className="w-5 h-5" />
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
