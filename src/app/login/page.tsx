'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { Guitar, Mail, Lock, User, UserCog, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'student' | 'teacher'>('student')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { signIn, signUp } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        const { error } = await signIn(email, password)
        if (error) {
          setError(error.message === 'Invalid login credentials' 
            ? 'Ongeldige inloggegevens' 
            : error.message)
        } else {
          router.push('/dashboard')
        }
      } else {
        const { error } = await signUp(email, password, fullName, role)
        if (error) {
          setError(error.message)
        } else {
          router.push('/dashboard')
        }
      }
    } catch {
      setError('Er is iets fout gegaan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-amber-900 via-amber-800 to-stone-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-72 h-72 bg-amber-500 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-orange-600 rounded-full filter blur-3xl"></div>
        </div>
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl">
              <Guitar className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white">Strummer</h1>
          </div>
          <p className="text-amber-100 text-xl text-center max-w-md">
            Jouw persoonlijke gitaarles platform
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="bg-amber-100 p-3 rounded-xl">
              <Guitar className="w-8 h-8 text-amber-700" />
            </div>
            <span className="text-2xl font-bold">Strummer</span>
          </div>

          <h2 className="text-2xl font-bold mb-1">
            {isLogin ? 'Welkom terug' : 'Account aanmaken'}
          </h2>
          <p className="text-stone-500 mb-6">
            {isLogin ? 'Log in om verder te gaan' : 'Start je gitaarles avontuur'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-4">
                <div>
                  <label className="label">Naam</label>
                  <div className="input-group">
                    <User className="input-icon w-5 h-5" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="input-field has-icon"
                      placeholder="Jan Jansen"
                      required={!isLogin}
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Ik ben een...</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole('student')}
                      className={`p-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
                        role === 'student'
                          ? 'border-amber-500 bg-amber-50 text-amber-700'
                          : 'border-stone-200 dark:border-stone-700 text-stone-600'
                      }`}
                    >
                      <UserCog className="w-5 h-5" />
                      <span className="font-medium text-sm">Student</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('teacher')}
                      className={`p-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
                        role === 'teacher'
                          ? 'border-amber-500 bg-amber-50 text-amber-700'
                          : 'border-stone-200 dark:border-stone-700 text-stone-600'
                      }`}
                    >
                      <Guitar className="w-5 h-5" />
                      <span className="font-medium text-sm">Leraar</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="label">Email</label>
              <div className="input-group">
                <Mail className="input-icon w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field has-icon"
                  placeholder="jouw@email.nl"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Wachtwoord</label>
              <div className="input-group">
                <Lock className="input-icon w-5 h-5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field has-icon"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {error && (
              <div className="form-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? 'Even geduld...' : isLogin ? 'Inloggen' : 'Aanmaken'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-stone-500">
            {isLogin ? 'Nog geen account? ' : 'Al een account? '}
            <button
              onClick={() => {
                setIsLogin(!isLogin)
                setError('')
              }}
              className="text-amber-600 hover:text-amber-700 font-medium"
            >
              {isLogin ? 'Maak er een aan' : 'Log in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
