'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/lib/types'
import { Users, UserPlus, Trash2, Search, Mail, Music, Shield } from 'lucide-react'

export default function UsersPage() {
  const { profile } = useAuth()
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const supabase = createClient()

  useEffect(() => {
    fetchUsers()
  }, [profile])

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name')

    if (data) setUsers(data)
    setLoading(false)
  }

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Weet je zeker dat je deze gebruiker wilt verwijderen? Dit kan niet ongedaan gemaakt worden.')) return
    
    const { error } = await supabase.auth.admin.deleteUser(id)
    
    if (error) {
      alert('Fout bij verwijderen: ' + error.message)
    } else {
      setUsers(users.filter(u => u.id !== id))
    }
  }

  const filteredUsers = users.filter(u => 
    u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const teachers = filteredUsers.filter(u => u.role === 'teacher')
  const students = filteredUsers.filter(u => u.role === 'student')

  if (!profile || profile.role !== 'teacher') {
    return (
      <div className="text-center py-12">
        <p className="text-stone-500">Je hebt geen toegang tot deze pagina</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gebruikers</h1>
          <p className="text-stone-500">Beheer alle geregistreerde gebruikers</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
        <input
          type="text"
          placeholder="Zoek op naam of email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-field has-icon"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {teachers.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-stone-500 mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Leraren ({teachers.length})
              </h2>
              <div className="grid gap-3">
                {teachers.map(user => (
                  <UserCard 
                    key={user.id} 
                    user={user} 
                    onDelete={handleDeleteUser}
                    canDelete={profile.id !== user.id}
                  />
                ))}
              </div>
            </div>
          )}

          {students.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-stone-500 mb-3 flex items-center gap-2">
                <Music className="w-4 h-4" />
                Studenten ({students.length})
              </h2>
              <div className="grid gap-3">
                {students.map(user => (
                  <UserCard 
                    key={user.id} 
                    user={user} 
                    onDelete={handleDeleteUser}
                    canDelete={true}
                  />
                ))}
              </div>
            </div>
          )}

          {filteredUsers.length === 0 && (
            <div className="card p-12 text-center">
              <Users className="w-12 h-12 text-stone-300 mx-auto mb-4" />
              <p className="text-stone-500">Geen gebruikers gevonden</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function UserCard({ 
  user, 
  onDelete, 
  canDelete 
}: { 
  user: Profile
  onDelete: (id: string) => void
  canDelete: boolean
}) {
  const initials = user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="card p-4 flex items-center gap-4">
      <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
        {user.avatar_url ? (
          <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold">
            {initials}
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{user.full_name}</p>
        <p className="text-sm text-stone-500 truncate flex items-center gap-1">
          <Mail className="w-3 h-3" />
          {user.email}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          user.role === 'teacher' 
            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
            : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
        }`}>
          {user.role === 'teacher' ? 'Leraar' : 'Student'}
        </span>
        
        {canDelete && (
          <button
            onClick={() => onDelete(user.id)}
            className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
