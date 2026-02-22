-- Database Schema for Guitar School Platform
-- Run this SQL in your Supabase SQL Editor

-- Create profiles table (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  full_name text not null,
  role text not null check (role in ('student', 'teacher')),
  created_at timestamptz default now()
);

-- Create trigger to automatically create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'role');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Assignments table
create table public.assignments (
  id uuid default gen_random_uuid() primary key,
  teacher_id uuid references public.profiles(id) on delete cascade not null,
  student_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  due_date date,
  completed boolean default false,
  created_at timestamptz default now()
);

-- Videos table
create table public.videos (
  id uuid default gen_random_uuid() primary key,
  teacher_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  video_url text not null,
  video_type text not null check (video_type in ('youtube', 'vimeo')),
  created_at timestamptz default now()
);

-- Video access table (which students can see which videos)
create table public.video_access (
  video_id uuid references public.videos(id) on delete cascade not null,
  student_id uuid references public.profiles(id) on delete cascade not null,
  primary key (video_id, student_id)
);

-- Messages table
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  read boolean default false,
  created_at timestamptz default now()
);

-- Schedule table
create table public.schedule (
  id uuid default gen_random_uuid() primary key,
  teacher_id uuid references public.profiles(id) on delete cascade not null,
  student_id uuid references public.profiles(id) on delete cascade not null,
  day_of_week int not null check (day_of_week >= 0 and day_of_week <= 6),
  start_time text not null,
  end_time text not null,
  created_at timestamptz default now()
);

-- Row Level Security Policies

-- Profiles: users can read all, update only own
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Assignments: teachers can CRUD on their students, students can read own
create policy "Teachers can manage assignments" on public.assignments for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher')
);
create policy "Students can view own assignments" on public.assignments for select using (
  auth.uid() = student_id
);

-- Videos: teachers can CRUD, students can read accessible
create policy "Teachers can manage videos" on public.videos for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher')
);
create policy "Students can view accessible videos" on public.videos for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher') or
  exists (select 1 from public.video_access where video_id = public.videos.id and student_id = auth.uid())
);

-- Video access: teachers can manage
create policy "Teachers can manage video access" on public.video_access for all using (
  exists (select 1 from public.profiles p 
    join public.videos v on v.id = video_id 
    where p.id = auth.uid() and p.role = 'teacher' and v.teacher_id = p.id)
);

-- Messages: only sender and receiver can read/write
create policy "Users can manage own messages" on public.messages for all using (
  auth.uid() = sender_id or auth.uid() = receiver_id
);

-- Schedule: teachers can manage all, students can view own
create policy "Teachers can manage schedule" on public.schedule for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher')
);
create policy "Students can view own schedule" on public.schedule for select using (
  auth.uid() = student_id
);
