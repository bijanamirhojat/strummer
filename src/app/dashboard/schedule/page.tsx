'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import { Schedule, Profile } from '@/lib/types'
import { Plus, Trash2, X, Calendar, Clock, Pencil } from 'lucide-react'

const daysOfWeek = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag']

function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return 'Geen datum'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return 'Ongeldige datum'
  const dayName = daysOfWeek[date.getDay()]
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${dayName} ${day}-${month}-${year}`
}

export default function SchedulePage() {
  const { profile } = useAuth()
  const [schedule, setSchedule] = useState<Schedule[]>([])
  const [students, setStudents] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchSchedule()
    if (profile?.role === 'teacher') {
      fetchStudents()
    }
  }, [profile])

  const fetchSchedule = async () => {
    let query = supabase.from('schedule').select('*, student:profiles!student_id(*)').order('date')
    
    if (profile?.role === 'student') {
      query = query.eq('student_id', profile.id)
    }

    const { data } = await query

    if (data) {
      setSchedule(data)
    }
    setLoading(false)
  }

  const fetchStudents = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
    
    if (data) setStudents(data)
  }

  const handleAddSchedule = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    
    const studentId = profile?.role === 'teacher' 
      ? formData.get('student_id') 
      : profile?.id

    await supabase.from('schedule').insert({
      teacher_id: profile!.id,
      student_id: studentId,
      date: formData.get('date'),
      start_time: formData.get('start_time'),
      end_time: formData.get('end_time')
    })

    setShowAddModal(false)
    fetchSchedule()
  }

  const handleEditSchedule = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingSchedule) return
    
    const form = e.currentTarget
    const formData = new FormData(form)
    
    const studentId = profile?.role === 'teacher' 
      ? formData.get('student_id') 
      : profile?.id

    await supabase.from('schedule').update({
      student_id: studentId,
      date: formData.get('date'),
      start_time: formData.get('start_time'),
      end_time: formData.get('end_time')
    }).eq('id', editingSchedule.id)

    setEditingSchedule(null)
    fetchSchedule()
  }

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm('Weet je zeker dat je dit tijdstip wilt verwijderen?')) return
    await supabase.from('schedule').delete().eq('id', id)
    setSchedule(schedule.filter(s => s.id !== id))
  }

  const groupedSchedule = schedule.reduce((acc, item) => {
    const dateKey = item.date
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(item)
    return acc
  }, {} as Record<string, Schedule[]>)

  Object.keys(groupedSchedule).forEach(key => {
    groupedSchedule[key].sort((a, b) => a.start_time.localeCompare(b.start_time))
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-800 dark:text-white">Rooster</h1>
          <p className="text-stone-500">Je lesmomenten op een rij</p>
        </div>
        {profile?.role === 'teacher' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4" />
            Les toevoegen
          </button>
        )}
      </div>

      {schedule.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-stone-400" />
          </div>
          <p className="text-stone-500">Geen lesmomenten gepland</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {Object.keys(groupedSchedule).sort().map(dateKey => (
            groupedSchedule[dateKey] && (
              <div key={dateKey} className="card p-5">
                <h2 className="font-semibold text-stone-800 dark:text-white mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-500" />
                  {formatDate(dateKey)}
                </h2>
                <div className="space-y-2">
                  {groupedSchedule[dateKey].map(item => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 bg-stone-50 dark:bg-stone-700/50 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-stone-400" />
                        <span className="font-medium text-stone-800 dark:text-white">
                          {item.start_time} - {item.end_time}
                        </span>
                        {profile?.role === 'teacher' && (
                          <span className="ml-2 text-stone-500">
                            {(item.student as unknown as Profile)?.full_name}
                          </span>
                        )}
                      </div>
                      {profile?.role === 'teacher' && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingSchedule(item)}
                            className="p-2 text-stone-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSchedule(item.id)}
                            className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      )}

      {showAddModal && profile?.role === 'teacher' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="card p-6 w-full max-w-md animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-stone-800 dark:text-white">Les toevoegen</h2>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddSchedule} className="space-y-4">
              <div>
                <label className="label">Student</label>
                <select name="student_id" required className="input-field">
                  <option value="">Kies student...</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>{student.full_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Datum</label>
                <input name="date" type="date" required className="input-field" />
              </div>
            </form>
          </div>
        </div>
      )}

      {editingSchedule && profile?.role === 'teacher' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="card p-6 w-full max-w-md animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-stone-800 dark:text-white">Les bewerken</h2>
              <button 
                onClick={() => setEditingSchedule(null)} 
                className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditSchedule} className="space-y-4">
              <div>
                <label className="label">Student</label>
                <select name="student_id" required className="input-field" defaultValue={editingSchedule.student_id}>
                  <option value="">Kies student...</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>{student.full_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Datum</label>
                <input name="date" type="date" required className="input-field" defaultValue={editingSchedule.date} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Starttijd</label>
                  <input name="start_time" type="time" required className="input-field" defaultValue={editingSchedule.start_time} />
                </div>
                <div>
                  <label className="label">Eindtijd</label>
                  <input name="end_time" type="time" required className="input-field" defaultValue={editingSchedule.end_time} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary w-full">Wijzigingen opslaan</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
