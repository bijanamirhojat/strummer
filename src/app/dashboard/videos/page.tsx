'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import { Video, Profile } from '@/lib/types'
import { Play, Plus, Trash2, Users, X, Video as VideoIcon, Pencil, Globe, RefreshCcw } from 'lucide-react'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'

export default function VideosPage() {
  const { profile } = useAuth()
  const [videos, setVideos] = useState<Video[]>([])
  const [students, setStudents] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingVideo, setEditingVideo] = useState<Video | null>(null)
  const [showAccessModal, setShowAccessModal] = useState<{ videoId: string; isPublic: boolean } | null>(null)
  const [accessList, setAccessList] = useState<string[]>([])
  const supabase = createClient()

  useEffect(() => {
    fetchVideos()
    if (profile?.role === 'teacher') {
      fetchStudents()
    }
  }, [profile])

  const fetchVideos = async () => {
    const { data } = await supabase.from('videos').select('*').order('created_at', { ascending: false })

    if (data) {
      if (profile?.role === 'teacher') {
        setVideos(data)
      } else {
        const { data: accessible } = await supabase
          .from('video_access')
          .select('video_id')
          .eq('student_id', profile!.id)
        
        const accessibleIds = accessible?.map((a: { video_id: string }) => a.video_id) || []
        setVideos(data.filter((v: Video) => v.is_public || accessibleIds.includes(v.id)))
      }
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

  const getVideoId = (url: string, type: string) => {
    if (type === 'youtube') {
      const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)
      return match?.[1]
    } else if (type === 'vimeo') {
      const match = url.match(/vimeo\.com\/(\d+)/)
      return match?.[1]
    }
    return null
  }

  const getEmbedUrl = (video: Video) => {
    const id = getVideoId(video.video_url, video.video_type)
    if (video.video_type === 'youtube' && id) {
      return `https://www.youtube.com/embed/${id}`
    } else if (video.video_type === 'vimeo' && id) {
      return `https://player.vimeo.com/video/${id}`
    }
    return null
  }

  const handleAddVideo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    
    const videoUrl = formData.get('video_url') as string
    const videoType = videoUrl.includes('youtube') ? 'youtube' : 'vimeo'

    const { error } = await supabase.from('videos').insert({
      teacher_id: profile!.id,
      title: formData.get('title'),
      description: formData.get('description'),
      video_url: videoUrl,
      video_type: videoType
    })

    if (!error) {
      setShowAddModal(false)
      fetchVideos()
    }
  }

  const handleEditVideo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingVideo) return
    
    const form = e.currentTarget
    const formData = new FormData(form)
    
    const videoUrl = formData.get('video_url') as string
    const videoType = videoUrl.includes('youtube') ? 'youtube' : 'vimeo'

    await supabase.from('videos').update({
      title: formData.get('title'),
      description: formData.get('description'),
      video_url: videoUrl,
      video_type: videoType
    }).eq('id', editingVideo.id)

    setEditingVideo(null)
    fetchVideos()
  }

  const handleDeleteVideo = async (id: string) => {
    if (!confirm('Weet je zeker dat je deze video wilt verwijderen?')) return
    await supabase.from('videos').delete().eq('id', id)
    setVideos(videos.filter(v => v.id !== id))
  }

  const handleAccessChange = async (studentId: string, hasAccess: boolean) => {
    if (!showAccessModal) return
    
    if (hasAccess) {
      await supabase.from('video_access').insert({ video_id: showAccessModal.videoId, student_id: studentId })
    } else {
      await supabase.from('video_access').delete().eq('video_id', showAccessModal.videoId).eq('student_id', studentId)
    }
    fetchAccessList(showAccessModal.videoId)
  }

  const handlePublicChange = async (isPublic: boolean) => {
    if (!showAccessModal) return
    
    await supabase.from('videos').update({ is_public: isPublic }).eq('id', showAccessModal.videoId)
    setShowAccessModal({ ...showAccessModal, isPublic })
    fetchVideos()
  }
  
  const handleResetAccess = async () => {
    if (!showAccessModal) return
    if (!confirm('Weet je zeker dat je alle toegang wilt verwijderen? Niemand zal de video kunnen zien (behalve als je "Iedereen" aanzet).')) return
    
    await supabase.from('video_access').delete().eq('video_id', showAccessModal.videoId)
    await supabase.from('videos').update({ is_public: false }).eq('id', showAccessModal.videoId)
    setAccessList([])
    setShowAccessModal({ ...showAccessModal, isPublic: false })
    fetchVideos()
  }
  
  const fetchAccessList = async (videoId: string) => {
    const { data } = await supabase.from('video_access').select('student_id').eq('video_id', videoId)
    setAccessList(data?.map((d: { student_id: string }) => d.student_id) || [])
  }

  const openAccessModal = (video: Video) => {
    setShowAccessModal({ videoId: video.id, isPublic: video.is_public || false })
    fetchAccessList(video.id)
  }

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
          <h1 className="text-2xl font-bold text-stone-800 dark:text-white">Video&apos;s</h1>
          <p className="text-stone-500">Bekijk en beheer lesmateriaal</p>
        </div>
        {profile?.role === 'teacher' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4" />
            Video toevoegen
          </button>
        )}
      </div>

      {videos.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <VideoIcon className="w-8 h-8 text-stone-400" />
          </div>
          <p className="text-stone-500">Geen video&apos;s beschikbaar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {videos.map((video, i) => (
            <div 
              key={video.id} 
              className="card overflow-hidden animate-fade-in"
              style={{ animationDelay: `${i * 75}ms` }}
            >
              <div className="aspect-video bg-stone-900 relative">
                <iframe
                  src={getEmbedUrl(video) || ''}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-stone-800 dark:text-white text-lg">{video.title}</h3>
                    {video.description && (
                      <p className="text-stone-600 dark:text-stone-400 text-sm mt-1">{video.description}</p>
                    )}
                    {video.is_public && (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600 mt-2">
                        <Globe className="w-3 h-3" /> Iedereen kan zien
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-stone-400 text-xs mt-3">
                  {format(new Date(video.created_at), 'd MMMM yyyy', { locale: nl })}
                </p>
                {profile?.role === 'teacher' && (
                  <div className="flex gap-2 mt-4 pt-4 border-t border-stone-100 dark:border-stone-700">
                    <button
                      onClick={() => setEditingVideo(video)}
                      className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400 hover:text-amber-600 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                      Bewerk
                    </button>
                    <button
                      onClick={() => openAccessModal(video)}
                      className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400 hover:text-amber-600 transition-colors"
                    >
                      <Users className="w-4 h-4" />
                      Toegang
                    </button>
                    <button
                      onClick={() => handleDeleteVideo(video.id)}
                      className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 ml-auto transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Verwijder
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="card p-6 w-full max-w-md animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-stone-800 dark:text-white">Video toevoegen</h2>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddVideo} className="space-y-4">
              <div>
                <label className="label">Titel</label>
                <input name="title" required className="input-field" placeholder="Les 1: Basisakkoorden" />
              </div>
              <div>
                <label className="label">Beschrijving</label>
                <textarea name="description" className="input-field" placeholder="Wat leren studenten in deze video?" />
              </div>
              <div>
                <label className="label">YouTube/Vimeo URL</label>
                <input name="video_url" required placeholder="https://youtube.com/... of https://vimeo.com/..." className="input-field" />
              </div>
              <button type="submit" className="btn btn-primary w-full">Video opslaan</button>
            </form>
          </div>
        </div>
      )}

      {editingVideo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="card p-6 w-full max-w-md animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-stone-800 dark:text-white">Video bewerken</h2>
              <button 
                onClick={() => setEditingVideo(null)} 
                className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditVideo} className="space-y-4">
              <div>
                <label className="label">Titel</label>
                <input name="title" required className="input-field" defaultValue={editingVideo.title} />
              </div>
              <div>
                <label className="label">Beschrijving</label>
                <textarea name="description" className="input-field" defaultValue={editingVideo.description || ''} />
              </div>
              <div>
                <label className="label">YouTube/Vimeo URL</label>
                <input name="video_url" required className="input-field" defaultValue={editingVideo.video_url} />
              </div>
              <button type="submit" className="btn btn-primary w-full">Wijzigingen opslaan</button>
            </form>
          </div>
        </div>
      )}

      {showAccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="card p-6 w-full max-w-md animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-stone-800 dark:text-white">Toegang tot video</h2>
              <button 
                onClick={() => setShowAccessModal(null)} 
                className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between p-4 bg-stone-50 dark:bg-stone-700/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-stone-500" />
                  <span className="font-medium">Iedereen kan zien</span>
                </div>
                <button
                  onClick={() => handlePublicChange(!showAccessModal.isPublic)}
                  className={`w-12 h-6 rounded-full transition-colors ${showAccessModal.isPublic ? 'bg-green-500' : 'bg-stone-300'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${showAccessModal.isPublic ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-stone-50 dark:bg-stone-700/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <RefreshCcw className="w-5 h-5 text-stone-500" />
                  <span className="font-medium">Reset toegang</span>
                </div>
                <button
                  type="button"
                  onClick={handleResetAccess}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Reset
                </button>
              </div>
            </div>

            <p className="text-stone-600 dark:text-stone-400 mb-3">Of selecteer specifieke studenten:</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {students.map(student => (
                <label 
                  key={student.id} 
                  className="flex items-center gap-3 p-3 hover:bg-stone-50 dark:hover:bg-stone-700/50 rounded-xl cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={accessList.includes(student.id)}
                    onChange={(e) => handleAccessChange(student.id, e.target.checked)}
                    disabled={showAccessModal.isPublic}
                    className="w-5 h-5 text-amber-600 rounded-lg border-stone-300 focus:ring-amber-500 disabled:opacity-50"
                  />
                  <span className="text-stone-800 dark:text-stone-200">{student.full_name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
