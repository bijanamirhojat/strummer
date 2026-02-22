import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    return NextResponse.json(
      { error: 'Service role key not configured' },
      { status: 500 }
    )
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

  const students = [
    'Anna de Student',
    'Bart de Student',
    'Cindy de Student',
    'Daan de Student',
    'Emma de Student'
  ]

  const demoUsers = [
    {
      email: 'leraar@demo.nl',
      password: 'demo1234',
      user_metadata: { full_name: 'Jan de Leraar', role: 'teacher' }
    },
    ...students.map((name, i) => ({
      email: `student${i + 1}@demo.nl`,
      password: 'demo1234',
      user_metadata: { full_name: name, role: 'student' }
    }))
  ]

  const results = []

  for (const user of demoUsers) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: user.user_metadata
    })

    if (error) {
      results.push({ email: user.email, error: error.message })
    } else {
      results.push({ email: user.email, success: true, id: data.user.id })
    }
  }

  return NextResponse.json({ results })
}
