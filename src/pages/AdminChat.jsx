import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function AdminChat() {
  const [searchParams] = useSearchParams()
  const projectId = searchParams.get('project')

  const [user, setUser] = useState(null)
  const [project, setProject] = useState(null)
  const [messages, setMessages] = useState([])
  const [message, setMessage] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingText, setEditingText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    let channel

    const loadChat = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user || !projectId) {
        setLoading(false)
        return
      }

      setUser(user)

      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('id, title, client_id')
        .eq('id', projectId)
        .single()

      if (projectError) {
        console.error('Project error:', projectError.message)
        setLoading(false)
        return
      }

      setProject(projectData)

      const { data, error } = await supabase
        .from('messages')
        .select(
          'id, sender_id, receiver_id, message, created_at, updated_at'
        )
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Chat error:', error.message)
      } else {
        setMessages(data || [])
      }

      await supabase.rpc('mark_project_messages_read', {
  p_project_id: projectId,
})

      channel = supabase
        .channel(`admin-project-chat-${projectId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `project_id=eq.${projectId}`,
          },
          (payload) => {
            setMessages((current) => {
              const exists = current.some(
                (item) => item.id === payload.new.id
              )

              if (exists) {
                return current
              }

              return [...current, payload.new]
            })
          }
        )
        .subscribe()

      setLoading(false)
    }

    loadChat()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [projectId])

  const sendMessage = async () => {
    if (!message.trim() || !user || !project) {
      return
    }

    setSending(true)

    const { data, error } = await supabase
      .from('messages')
      .insert({
        project_id: project.id,
        sender_id: user.id,
        receiver_id: project.client_id,
        message: message.trim(),
      })
      .select(
        'id, sender_id, receiver_id, message, created_at, updated_at'
      )
      .single()

    if (error) {
      alert(error.message)
    } else {
      setMessages((current) => {
        const exists = current.some((item) => item.id === data.id)

        if (exists) {
          return current
        }

        return [...current, data]
      })

      setMessage('')
    }

    setSending(false)
  }

const editMessage = async (messageId) => {
  if (!editingText.trim()) return

  const updatedText = editingText.trim()

  const { error } = await supabase
    .from('messages')
    .update({
      message: updatedText,
      updated_at: new Date().toISOString(),
    })
    .eq('id', messageId)
    .eq('sender_id', user.id)

  if (error) {
    alert(error.message)
    return
  }

  setMessages((current) =>
    current.map((item) =>
      item.id === messageId
        ? {
            ...item,
            message: updatedText,
            updated_at: new Date().toISOString(),
          }
        : item
    )
  )

  setEditingId(null)
  setEditingText('')
}

const deleteMessage = async (messageId) => {
  const confirmed = window.confirm(
    'Are you sure you want to delete this message?'
  )

  if (!confirmed) return

  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId)
    .eq('sender_id', user.id)

  if (error) {
    alert(error.message)
    return
  }

  setMessages((current) =>
    current.filter((item) => item.id !== messageId)
  )
}

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-card">
          <p>Loading chat...</p>
        </div>
      </div>
    )
  }

  if (!projectId || !project) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-card">
          <h2>Project Chat</h2>
          <p>Please open chat from an admin project.</p>

          <Link to="/admin/requests" className="dashboard-action">
            ← Admin Requests
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-label">PROJECT CHAT</p>
          <h1>Chat with Client</h1>
          <p>{project.title}</p>
        </div>

        <Link
          to="/admin/requests"
          className="dashboard-home"
        >
          ← Admin Requests
        </Link>
      </header>

      <main className="dashboard-content">
        <div className="dashboard-card">
          <div className="chat-messages">
            {messages.length === 0 ? (
              <p>No messages yet.</p>
            ) : (
              messages.map((item) => (
                <div
                  key={item.id}
                  className={
                    item.sender_id === user.id
                      ? 'chat-message own'
                      : 'chat-message'
                  }
                >
                  {editingId === item.id ? (
  <div>
    <textarea
      value={editingText}
      onChange={(e) => setEditingText(e.target.value)}
      rows="2"
    />

    <button
      type="button"
      onClick={() => editMessage(item.id)}
    >
      💾 Save
    </button>

    <button
      type="button"
      onClick={() => {
        setEditingId(null)
        setEditingText('')
      }}
    >
      Cancel
    </button>
  </div>
) : (
  <>
    <p>{item.message}</p>

    {item.sender_id === user.id && (
      <div>
        <button
          type="button"
          onClick={() => {
            setEditingId(item.id)
            setEditingText(item.message)
          }}
        >
          ✏️ Edit
        </button>

        <button
          type="button"
          onClick={() => deleteMessage(item.id)}
        >
          🗑️ Delete
        </button>
      </div>
    )}
  </>
)}
                  <small>
                    {new Date(item.created_at).toLocaleString()}
                  </small>
                </div>
              ))
            )}
          </div>

          <div className="chat-input-area">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              rows="3"
            />

            <button
              type="button"
              className="primary-btn"
              onClick={sendMessage}
              disabled={sending}
            >
              {sending ? 'Sending...' : 'Send Message →'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default AdminChat