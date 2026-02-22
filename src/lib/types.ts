export type UserRole = 'student' | 'teacher'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  avatar_url?: string
  created_at: string
}

export interface Assignment {
  id: string
  teacher_id: string
  student_id: string
  title: string
  description: string
  due_date: string
  completed: boolean
  created_at: string
}

export interface Video {
  id: string
  teacher_id: string
  title: string
  description: string
  video_url: string
  video_type: 'youtube' | 'vimeo'
  created_at: string
  video_access?: VideoAccess[]
}

export interface VideoAccess {
  video_id: string
  student_id: string
}

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  read: boolean
  created_at: string
  sender?: Profile
  receiver?: Profile
}

export interface Schedule {
  id: string
  teacher_id: string
  student_id: string
  day_of_week: number
  start_time: string
  end_time: string
  created_at: string
  student?: Profile
}
