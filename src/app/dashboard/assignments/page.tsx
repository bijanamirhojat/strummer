'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import { Assignment, Profile } from '@/lib/types'
import { Plus, Trash2, X, Clock, FileText, Filter, Pencil } from 'lucide-react'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'

export default function AssignmentsPage() {
  const { profile } = useAuth()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [students, setStudents] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<string>('')
  const supabase = createClient()

  useEffect(() => {
    fetchStudents()
  }, [])

  useEffect(() => {
    fetchAssignments()
  }, [profile, selectedStudent])

  const fetchAssignments = async () => {
    if (!profile) return

    if (profile.role === 'teacher') {
      let query = supabase
        .from('assignments')
        .select('*, student:profiles!student_id(*)')
        .order('created_at', { ascending: false })
      
      if (selectedStudent) {
        query = query.eq('student_id', selectedStudent)
      }
      
      const { data } = await query
      if (data) setAssignments(data)
    } else {
      const { data } = await supabase
        .from('assignments')
        .select('*')
        .eq('student_id', profile.id)
        .order('due_date', { ascending: true })
      
      if (data) setAssignments(data)
    }
    setLoading(false)
  }

  const fetchStudents = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .order('full_name')
    
    if (data) setStudents(data)
  }

  const handleAddAssignment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)

    await supabase.from('assignments').insert({
      teacher_id: profile!.id,
      student_id: formData.get('student_id'),
      title: formData.get('title'),
      description: formData.get('description'),
      due_date: formData.get('due_date') || null
    })

    setShowAddModal(false)
    fetchAssignments()
  }

  const handleEditAssignment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingAssignment) return
    
    const form = e.currentTarget
    const formData = new FormData(form)

    await supabase.from('assignments').update({
      student_id: formData.get('student_id'),
      title: formData.get('title'),
      description: formData.get('description'),
      due_date: formData.get('due_date') || null
    }).eq('id', editingAssignment.id)

    setEditingAssignment(null)
    fetchAssignments()
  }

  const handleDeleteAssignment = async (id: string) => {
    if (!confirm('Weet je zeker dat je deze opdracht wilt verwijderen?')) return
    await supabase.from('assignments').delete().eq('id', id)
    setAssignments(assignments.filter(a => a.id !== id))
  }

  const handleToggleComplete = async (id: string, completed: boolean) => {
    await supabase
      .from('assignments')
      .update({ completed: !completed })
      .eq('id', id)
    
    setAssignments(assignments.map(a => 
      a.id === id ? { ...a, completed: !completed } : a
    ))
  }

  const pendingAssignments = assignments.filter(a => !a.completed)
  const completedAssignments = assignments.filter(a => a.completed)

  if (!profile) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Huiswerk</h1>
          <p className="text-stone-500">
            {profile.role === 'teacher' ? 'Beheer opdrachten voor studenten' : 'Jouw openstaande opdrachten'}
          </p>
        </div>
        {profile.role === 'teacher' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4" />
            Opdracht toevoegen
          </button>
        )}
      </div>

      {profile.role === 'teacher' && students.length > 0 && (
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-stone-400" />
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="input-field w-auto"
          >
            <option value="">Alle studenten</option>
            {students.map(student => (
              <option key={student.id} value={student.id}>
                {student.full_name}
              </option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : assignments.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-stone-400" />
          </div>
          <p className="text-stone-500">
            {profile.role === 'teacher' ? 'Nog geen opdrachten aangemaakt' : 'Je hebt geen openstaand huiswerk'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {pendingAssignments.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-stone-500 mb-3">
                Te maken ({pendingAssignments.length})
              </h2>
              <div className="space-y-3">
                {pendingAssignments.map((assignment) => (
                  <div key={assignment.id} className="card p-4">
                    <div className="flex items-start gap-4">
                      {profile.role === 'student' ? (
                        <button
                          onClick={() => handleToggleComplete(assignment.id, assignment.completed)}
                          className="mt-1 w-6 h-6 rounded-full border-2 border-stone-300 hover:border-green-500 hover:bg-green-50 transition-colors flex-shrink-0"
                        />
                      ) : (
                        <div className="mt-1 w-6 h-6 rounded-full border-2 border-amber-500 bg-amber-50 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <h3 className="font-medium">{assignment.title}</h3>
                        {assignment.description && (
                          <p className="text-sm text-stone-500 mt-1">{assignment.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-stone-400">
                          {profile.role === 'teacher' && assignment.student && (
                            <span>{(assignment.student as Profile).full_name}</span>
                          )}
                          {assignment.due_date && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(assignment.due_date), 'd MMM', { locale: nl })}
                            </span>
                          )}
                        </div>
                      </div>
                      {profile.role === 'teacher' && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingAssignment(assignment)}
                            className="p-2 text-stone-400 hover:text-amber-500 hover:bg-amber-50 transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAssignment(assignment.id)}
                            className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {completedAssignments.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-stone-500 mb-3">
                Afgerond ({completedAssignments.length})
              </h2>
              <div className="space-y-2 opacity-60">
                {completedAssignments.map((assignment) => (
                  <div key={assignment.id} className="card p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="line-through text-stone-500">{assignment.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showAddModal && profile.role === 'teacher' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="card p-6 w-full max-w-md animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Opdracht toevoegen</h2>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddAssignment} className="space-y-4">
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
                <label className="label">Titel</label>
                <input name="title" required className="input-field" placeholder="Oefen akkoord C" />
              </div>
              <div>
                <label className="label">Beschrijving</label>
                <textarea name="description" className="input-field" placeholder="Wat moet de student doen?" />
              </div>
              <div>
                <label className="label">Inleverdatum (optioneel)</label>
                <input name="due_date" type="date" className="input-field" />
              </div>
              <button type="submit" className="btn btn-primary w-full">Opslaan</button>
            </form>
          </div>
        </div>
      )}

      {editingAssignment && profile.role === 'teacher' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="card p-6 w-full max-w-md animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Opdracht bewerken</h2>
              <button 
                onClick={() => setEditingAssignment(null)} 
                className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditAssignment} className="space-y-4">
              <div>
                <label className="label">Student</label>
                <select name="student_id" required className="input-field" defaultValue={editingAssignment.student_id}>
                  <option value="">Kies student...</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>{student.full_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Titel</label>
                <input name="title" required className="input-field" defaultValue={editingAssignment.title} />
              </div>
              <div>
                <label className="label">Beschrijving</label>
                <textarea name="description" className="input-field" defaultValue={editingAssignment.description || ''} />
              </div>
              <div>
                <label className="label">Inleverdatum (optioneel)</label>
                <input name="due_date" type="date" className="input-field" defaultValue={editingAssignment.due_date || ''} />
              </div>
              <button type="submit" className="btn btn-primary w-full">Wijzigingen opslaan</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
