'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import { Message, Profile } from '@/lib/types'
import { Send, User, Search, MessageCircle } from 'lucide-react'
import { format, isToday, isYesterday } from 'date-fns'
import { nl } from 'date-fns/locale'

interface Conversation {
  profile: Profile
  lastMessage?: Message
  unreadCount: number
}

export default function MessagesPage() {
  const { profile } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const fetchConversations = useCallback(async () => {
    if (!profile) return

    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', profile.id)

    if (!profiles) {
      setLoading(false)
      return
    }

    const otherProfiles = profile.role === 'teacher' 
      ? profiles.filter(p => p.role === 'student')
      : profiles.filter(p => p.role === 'teacher')

    const conversationsWithMessages = await Promise.all(
      otherProfiles.map(async (p) => {
        const { data: messages } = await supabase
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${profile.id},receiver_id.eq.${p.id}),and(sender_id.eq.${p.id},receiver_id.eq.${profile.id})`)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        const { count: unread } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('sender_id', p.id)
          .eq('receiver_id', profile.id)
          .eq('read', false)

        return {
          profile: p,
          lastMessage: messages || undefined,
          unreadCount: unread || 0
        }
      })
    )

    const sorted = conversationsWithMessages.sort((a, b) => {
      if (!a.lastMessage) return 1
      if (!b.lastMessage) return -1
      return new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()
    })

    setConversations(sorted)
    setLoading(false)
  }, [profile, supabase])

  const fetchMessages = useCallback(async (otherUserId: string) => {
    if (!profile) return

    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${profile.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${profile.id})`)
      .order('created_at', { ascending: true })

    if (data) {
      setMessages(data)
    }
  }, [profile, supabase])

  const markAsRead = useCallback(async (senderId: string) => {
    if (!profile) return

    await supabase
      .from('messages')
      .update({ read: true })
      .eq('sender_id', senderId)
      .eq('receiver_id', profile.id)
      .eq('read', false)

    fetchConversations()
  }, [profile, supabase, fetchConversations])

  useEffect(() => {
    if (profile) {
      fetchConversations()
    }
  }, [profile, fetchConversations])

  useEffect(() => {
    if (selectedProfile) {
      fetchMessages(selectedProfile.id)
      markAsRead(selectedProfile.id)
    }
  }, [selectedProfile, fetchMessages, markAsRead])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const channel = supabase
      .channel('messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMessage = payload.new as Message
        if (selectedProfile && (newMessage.sender_id === selectedProfile.id || newMessage.sender_id === profile?.id)) {
          setMessages(prev => [...prev, newMessage])
        }
        fetchConversations()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedProfile, profile, supabase, fetchConversations])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedProfile || !profile) return

    setSending(true)
    const { error } = await supabase
      .from('messages')
      .insert({
        sender_id: profile.id,
        receiver_id: selectedProfile.id,
        content: newMessage.trim()
      })

    if (!error) {
      setNewMessage('')
      fetchConversations()
    }
    setSending(false)
  }

  const formatMessageDate = (date: string) => {
    const d = new Date(date)
    if (isToday(d)) return format(d, 'HH:mm')
    if (isYesterday(d)) return 'Gisteren'
    return format(d, 'd MMM', { locale: nl })
  }

  const filteredConversations = conversations.filter(c => 
    c.profile.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!profile) return null

  return (
    <div className="h-[calc(100vh-12rem)]">
      <h1 className="text-2xl font-bold text-stone-800 dark:text-white mb-6">Berichten</h1>

      <div className="card overflow-hidden h-full flex">
        <div className="w-80 border-r border-stone-200 dark:border-stone-700 flex flex-col">
          <div className="p-4 border-b border-stone-200 dark:border-stone-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                placeholder="Zoek contacten..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-stone-200 dark:border-stone-600 rounded-xl text-sm bg-stone-50 dark:bg-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle className="w-10 h-10 text-stone-300 mx-auto mb-3" />
                <p className="text-stone-500 text-sm">Geen contacten gevonden</p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <button
                  key={conv.profile.id}
                  onClick={() => setSelectedProfile(conv.profile)}
                  className={`w-full p-4 flex items-start gap-3 hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors text-left ${
                    selectedProfile?.id === conv.profile.id ? 'bg-amber-50 dark:bg-amber-900/20' : ''
                  }`}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-stone-800 dark:text-white truncate">
                        {conv.profile.full_name}
                      </p>
                      {conv.lastMessage && (
                        <span className="text-xs text-stone-400 ml-2">
                          {formatMessageDate(conv.lastMessage.created_at)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-stone-500 truncate">
                        {conv.lastMessage 
                          ? (conv.lastMessage.sender_id === profile.id ? 'Jij: ' : '') + conv.lastMessage.content
                          : 'Nog geen berichten'}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="badge ml-2">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {selectedProfile ? (
            <>
              <div className="p-4 border-b border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50">
                <h2 className="font-semibold text-stone-800 dark:text-white">
                  {selectedProfile.full_name}
                </h2>
                <p className="text-sm text-stone-500">
                  {selectedProfile.role === 'teacher' ? 'Leraar' : 'Student'}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-stone-500 py-8">
                    <MessageCircle className="w-10 h-10 text-stone-300 mx-auto mb-3" />
                    <p>Nog geen berichten. Start het gesprek!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isSent = msg.sender_id === profile.id
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isSent ? 'justify-end' : 'justify-start'} animate-fade-in`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                            isSent
                              ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-br-md'
                              : 'bg-stone-100 dark:bg-stone-700 text-stone-800 dark:text-stone-100 rounded-bl-md'
                          }`}
                        >
                          <p>{msg.content}</p>
                          <p className={`text-xs mt-1 ${isSent ? 'text-amber-100' : 'text-stone-400'}`}>
                            {format(new Date(msg.created_at), 'HH:mm')}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={sendMessage} className="p-4 border-t border-stone-200 dark:border-stone-700">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Typ een bericht..."
                    className="flex-1 px-4 py-3 border border-stone-200 dark:border-stone-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-stone-700"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="btn-primary px-4"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-stone-500">
              <div className="text-center">
                <div className="w-16 h-16 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-stone-400" />
                </div>
                <p>Selecteer een contact om te beginnen</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
