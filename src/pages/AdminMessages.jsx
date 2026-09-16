import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function AdminMessages() {
  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadChats = async () => {
      const { data: projects, error: projectError } = await supabase
        .from('projects')
        .select(`
          id,
          title,
          client_id,
          created_at,
          profiles!projects_client_id_fkey (
            full_name
          )
        `)
        .order('created_at', { ascending: false })

      if (projectError) {
        console.error('Projects error:', projectError.message)
        setLoading(false)
        return
      }

      const projectChats = await Promise.all(
        (projects || []).map(async (project) => {
          const { data: messages, error: messageError } = await supabase
            .from('messages')
            .select('id, sender_id, message, created_at, is_read')
            .eq('project_id', project.id)
            .order('created_at', { ascending: false })

          if (messageError) {
            console.error('Messages error:', messageError.message)
          }

          const projectMessages = messages || []

          const lastMessage = projectMessages[0] || null

          const unreadCount = projectMessages.filter(
  (item) =>
    item.sender_id === project.client_id &&
    item.is_read === false
).length

          return {
            ...project,
            lastMessage,
            unreadCount,
          }
        })
      )

      projectChats.sort((a, b) => {
        const aTime = a.lastMessage?.created_at || a.created_at
        const bTime = b.lastMessage?.created_at || b.created_at

        return new Date(bTime) - new Date(aTime)
      })

      setChats(projectChats)
      setLoading(false)
    }

    loadChats()

const channel = supabase
  .channel('admin-messages-live')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'messages',
    },
    () => {
      loadChats()
    }
  )
  .subscribe()

return () => {
  supabase.removeChannel(channel)
}
}, [])

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-card">
          <p>Loading messages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-label">MESSAGES</p>
          <h1>Client Messages</h1>
          <p>Manage conversations with your clients.</p>
        </div>

        <Link to="/admin" className="dashboard-home">
          ← Admin Dashboard
        </Link>
      </header>

      <main className="dashboard-content">
        {chats.length === 0 ? (
          <div className="dashboard-card">
            <p>No client projects found.</p>
          </div>
        ) : (
          chats.map((chat) => (
            <div className="dashboard-card" key={chat.id}>
              <h2>
                👤 {chat.profiles?.full_name || 'Client'}
              </h2>

              <p>
                🎬 <strong>{chat.title}</strong>
              </p>

              {chat.lastMessage ? (
                <>
                  <p>
                    💬 <strong>Last message:</strong>{' '}
                    {chat.lastMessage.message}
                  </p>

                  <small>
                    {new Date(
                      chat.lastMessage.created_at
                    ).toLocaleString()}
                  </small>
                </>
              ) : (
                <p>No messages yet.</p>
              )}

              {chat.unreadCount > 0 && (
                <p>
                  🔴 <strong>{chat.unreadCount} client message(s)</strong>
                </p>
              )}

              <Link
                to={`/admin/chat?project=${chat.id}`}
                className="dashboard-action"
              >
                💬 Open Chat →
              </Link>
            </div>
          ))
        )}
      </main>
    </div>
  )
}

export default AdminMessages