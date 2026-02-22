'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import { Assignment } from '@/lib/types'
import { CheckCircle, Circle, Clock, Video, ArrowRight, Music } from 'lucide-react'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import Link from 'next/link'

export default function StudentDashboard() {
  const { profile } = useAuth()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (profile && profile.role === 'student') {
      fetchAssignments()
    }
  }, [profile])

  const fetchAssignments = async () => {
    const { data } = await supabase
      .from('assignments')
      .select('*')
      .eq('student_id', profile!.id)
      .order('due_date', { ascending: true })

    if (data) {
      setAssignments(data)
    }
    setLoading(false)
  }

  const toggleComplete = async (id: string, completed: boolean) => {
    await supabase
      .from('assignments')
      .update({ completed: !completed })
      .eq('id', id)
    
    setAssignments(assignments.map(a => 
      a.id === id ? { ...a, completed: !completed } : a
    ))
  }

  if (profile?.role !== 'student') {
    return <TeacherOverview />
  }

  const pendingAssignments = assignments.filter(a => !a.completed)
  const completedAssignments = assignments.filter(a => a.completed)

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
          <Music className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-stone-800 dark:text-white">
            Hoi, {profile?.full_name.split(' ')[0]}!
          </h1>
          <p className="text-stone-500">Laten we vandaag wat gitaar spelen</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/dashboard/videos" className="card p-5 group hover:border-amber-500">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
              <Video className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="font-semibold text-stone-800 dark:text-white group-hover:text-amber-600 transition-colors">Video&apos;s</p>
              <p className="text-sm text-stone-500">Bekijk lessen</p>
            </div>
            <ArrowRight className="w-5 h-5 text-stone-300 ml-auto group-hover:text-amber-500 transition-colors" />
          </div>
        </Link>

        <Link href="/dashboard/schedule" className="card p-5 group hover:border-amber-500">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-stone-800 dark:text-white group-hover:text-amber-600 transition-colors">Rooster</p>
              <p className="text-sm text-stone-500">Je lesmomenten</p>
            </div>
            <ArrowRight className="w-5 h-5 text-stone-300 ml-auto group-hover:text-amber-500 transition-colors" />
          </div>
        </Link>

        <Link href="/dashboard/messages" className="card p-5 group hover:border-amber-500">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
              <Circle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-stone-800 dark:text-white group-hover:text-amber-600 transition-colors">Berichten</p>
              <p className="text-sm text-stone-500">Contact met leraar</p>
            </div>
            <ArrowRight className="w-5 h-5 text-stone-300 ml-auto group-hover:text-amber-500 transition-colors" />
          </div>
        </Link>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-stone-800 dark:text-white mb-4">Huiswerk</h2>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : pendingAssignments.length === 0 && completedAssignments.length === 0 ? (
          <div className="card p-8 text-center">
            <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 text-green-600" />
            </div>
            <h3 className="font-semibold text-stone-800 dark:text-white mb-1">Alles klaar!</h3>
            <p className="text-stone-500 text-sm">Je hebt geen openstaand huiswerk</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingAssignments.map((assignment) => (
              <div key={assignment.id} className="card p-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => toggleComplete(assignment.id, assignment.completed)}
                    className="text-green-500 hover:text-green-600 hover:scale-110 transition-all"
                  >
                    <Circle className="w-7 h-7" />
                  </button>
                  <div className="flex-1">
                    <h3 className="font-medium text-stone-800 dark:text-white">{assignment.title}</h3>
                    {assignment.description && (
                      <p className="text-sm text-stone-500 mt-0.5">{assignment.description}</p>
                    )}
                    {assignment.due_date && (
                      <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(assignment.due_date), 'd MMM', { locale: nl })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function TeacherOverview() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({ students: 0, assignments: 0, videos: 0 })
  const [recentMessages, setRecentMessages] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    if (profile?.role === 'teacher') {
      fetchStats()
    }
  }, [profile])

  const fetchStats = async () => {
    const [{ count: students }, { count: assignments }, { count: videos }, { data: messages }] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
      supabase.from('assignments').select('*', { count: 'exact', head: true }),
      supabase.from('videos').select('*', { count: 'exact', head: true }),
      supabase.from('messages').select('*').eq('receiver_id', profile!.id).eq('read', false)
    ])

    setStats({
      students: students || 0,
      assignments: assignments || 0,
      videos: videos || 0
    })
    setRecentMessages(messages?.length || 0)
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
          <Music className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-stone-800 dark:text-white">
            Welkom terug!
          </h1>
          <p className="text-stone-500">Hier is je dagoverzicht</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <p className="text-3xl font-bold text-stone-800 dark:text-white">{stats.students}</p>
          <p className="text-sm text-stone-500">Studenten</p>
        </div>
        <div className="card p-5">
          <p className="text-3xl font-bold text-stone-800 dark:text-white">{stats.assignments}</p>
          <p className="text-sm text-stone-500">Huiswerk</p>
        </div>
        <div className="card p-5">
          <p className="text-3xl font-bold text-stone-800 dark:text-white">{stats.videos}</p>
          <p className="text-sm text-stone-500">Video&apos;s</p>
        </div>
        <div className="card p-5">
          <p className="text-3xl font-bold text-stone-800 dark:text-white">{recentMessages}</p>
          <p className="text-sm text-stone-500">Berichten</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/dashboard/videos" className="card p-5 group hover:border-amber-500">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
              <Video className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-stone-800 dark:text-white">Video&apos;s</p>
              <p className="text-sm text-stone-500">Beheer lesmateriaal</p>
            </div>
            <ArrowRight className="w-5 h-5 text-stone-300 group-hover:text-amber-500 transition-colors" />
          </div>
        </Link>

        <Link href="/dashboard/schedule" className="card p-5 group hover:border-amber-500">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-stone-800 dark:text-white">Rooster</p>
              <p className="text-sm text-stone-500">Lesmomenten beheren</p>
            </div>
            <ArrowRight className="w-5 h-5 text-stone-300 group-hover:text-amber-500 transition-colors" />
          </div>
        </Link>

        <Link href="/dashboard/messages" className="card p-5 group hover:border-amber-500">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
              <Circle className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-stone-800 dark:text-white">Berichten</p>
              <p className="text-sm text-stone-500">Communicatie met studenten</p>
            </div>
            <ArrowRight className="w-5 h-5 text-stone-300 group-hover:text-amber-500 transition-colors" />
          </div>
        </Link>

        <Link href="/dashboard/assignments" className="card p-5 group hover:border-amber-500">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-stone-800 dark:text-white">Huiswerk</p>
              <p className="text-sm text-stone-500">Opdrachten voor studenten</p>
            </div>
            <ArrowRight className="w-5 h-5 text-stone-300 group-hover:text-amber-500 transition-colors" />
          </div>
        </Link>
      </div>
    </div>
  )
}
