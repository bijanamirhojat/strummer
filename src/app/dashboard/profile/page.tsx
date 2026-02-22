'use client'

import { useState, useRef } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import { User, Lock, Mail, Save, Eye, EyeOff, CheckCircle, Camera, Loader2 } from 'lucide-react'

export default function ProfilePage() {
  const { profile, user, refreshProfile } = useAuth()
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    setUploading(true)
    setMessage('')

    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = reader.result as string

      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: base64 })
        .eq('id', profile.id)

      if (error) {
        setMessage('Fout bij opslaan: ' + error.message)
      } else {
        setMessage('Foto opgeslagen!')
        refreshProfile()
        setTimeout(() => setMessage(''), 3000)
      }
      setUploading(false)
    }
    reader.onerror = () => {
      setMessage('Fout bij lezen van bestand')
      setUploading(false)
    }
    reader.readAsDataURL(file)
  }

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', profile!.id)

    if (error) {
      setMessage('Fout: ' + error.message)
    } else {
      setMessage('Naam opgeslagen!')
      refreshProfile()
      setTimeout(() => setMessage(''), 3000)
    }
    setLoading(false)
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (newPassword !== confirmPassword) {
      setMessage('Wachtwoorden komen niet overeen')
      setLoading(false)
      return
    }

    if (newPassword.length < 6) {
      setMessage('Minimaal 6 tekens')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      setMessage('Fout: ' + error.message)
    } else {
      setMessage('Wachtwoord gewijzigd!')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setMessage(''), 3000)
    }
    setLoading(false)
  }

  const initials = profile?.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profiel</h1>
        <p className="text-stone-500">Beheer je account</p>
      </div>

      {message && (
        <div className={message.includes('Fout') || message.includes('minimaal') ? 'form-error' : 'form-success'}>
          {message}
        </div>
      )}

      <div className="card p-6">
        <div className="flex items-center gap-5 mb-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full overflow-hidden">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profielfoto"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-2xl font-bold">
                  {initials}
                </div>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 hover:opacity-100 transition-opacity"
            >
              {uploading ? (
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              ) : (
                <Camera className="w-6 h-6 text-white" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
          <div>
            <p className="font-semibold">{profile?.full_name}</p>
            <p className="text-sm text-stone-500">{profile?.role === 'teacher' ? 'Leraar' : 'Student'}</p>
          </div>
        </div>

        <form onSubmit={handleUpdateName} className="space-y-4">
          <div>
            <label className="label">Naam</label>
            <div className="input-group">
              <User className="input-icon w-5 h-5" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input-field has-icon"
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Email</label>
            <div className="input-group">
              <Mail className="input-icon w-5 h-5" />
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="input-field has-icon"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || fullName === profile?.full_name}
            className="btn btn-primary w-full"
          >
            <Save className="w-4 h-4" />
            Opslaan
          </button>
        </form>
      </div>

      <div className="card p-6">
        <h2 className="font-semibold mb-4">Wachtwoord wijzigen</h2>

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label className="label">Nieuw wachtwoord</label>
            <div className="input-group">
              <Lock className="input-icon w-5 h-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input-field has-icon pr-10"
                placeholder="Minimaal 6 tekens"
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="label">Bevestig wachtwoord</label>
            <div className="input-group">
              <Lock className="input-icon w-5 h-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field has-icon"
                placeholder="Herhaal wachtwoord"
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !newPassword || !confirmPassword}
            className="btn btn-primary w-full"
          >
            <Lock className="w-4 h-4" />
            Wijzigen
          </button>
        </form>
      </div>
    </div>
  )
}
