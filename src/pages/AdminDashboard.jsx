import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function AdminDashboard() {

    const [clients, setClients] = useState([])
    const [loading, setLoading] = useState(true)
    const [notifications, setNotifications] = useState([])
    const [notificationLoading, setNotificationLoading] = useState(true)
    const [projects, setProjects] = useState([])
    const [onlineUsers, setOnlineUsers] = useState({})

useEffect(() => {
  const loadClients = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, created_at')
      .eq('role', 'client')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Clients error:', error.message)
      setLoading(false)
      return
    }

    setClients(data || [])
    setLoading(false)
  }

const loadProjects = async () => {
  const { data, error } = await supabase
    .from('projects')
    .select('id, title, status, client_id, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Projects error:', error.message)
    return
  }

  setProjects(data || [])
}

  const loadNotifications = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setNotificationLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('id, title, message, project_id, is_read, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Notifications error:', error.message)
      setNotificationLoading(false)
      return
    }

    setNotifications(data || [])
    setNotificationLoading(false)
  }

  loadNotifications()
  loadClients()
  loadProjects()

const setupPresence = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const channel = supabase.channel('abhi-editz-presence', {
    config: {
      presence: {
        key: user.id,
      },
    },
  })

  const updateOnlineUsers = () => {
    const state = channel.presenceState()

    const users = {}

    Object.keys(state).forEach((userId) => {
      users[userId] = true
    })

    setOnlineUsers(users)
  }

  channel.on('presence', { event: 'sync' }, updateOnlineUsers)
  channel.on('presence', { event: 'join' }, updateOnlineUsers)
  channel.on('presence', { event: 'leave' }, updateOnlineUsers)

  await channel.subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({
  role: 'admin',
  online_at: new Date().toISOString(),
})
    }
  })

  return channel
}

let presenceChannel

setupPresence().then((channel) => {
  presenceChannel = channel
})

  const setupNotificationRealtime = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const channel = supabase
    .channel(`admin-notifications-${user.id}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      },
      (payload) => {
        setNotifications((current) => {
          const exists = current.some(
            (item) => item.id === payload.new.id
          )

          if (exists) return current

          return [payload.new, ...current]
        })
      }
    )
    .subscribe()

  return channel
}

let notificationChannel

setupNotificationRealtime().then((channel) => {
  notificationChannel = channel
})

return () => {
  if (notificationChannel) {
    supabase.removeChannel(notificationChannel)
  }

  if (presenceChannel) {
    supabase.removeChannel(presenceChannel)
  }
}

}, [])

const markNotificationAsRead = async (notificationId) => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)

  if (error) {
    console.error('Mark read error:', error.message)
    return
  }

  setNotifications((current) =>
    current.map((notification) =>
      notification.id === notificationId
        ? { ...notification, is_read: true }
        : notification
    )
  )
}

const groupedNotifications = notifications.reduce((groups, notification) => {
  const key = notification.project_id || notification.id

  if (!groups[key]) {
    groups[key] = []
  }

  groups[key].push(notification)
  return groups
}, {})

const totalProjects = projects.length

const completedProjects = projects.filter(
  (project) => project.status === 'completed'
).length

const activeProjects = projects.filter(
  (project) => project.status !== 'completed'
).length

  return (
    <div className="dashboard-page">

      <header className="dashboard-header">
        <div>
          <p className="dashboard-label">ADMIN DASHBOARD</p>
          <h1>Welcome, Admin</h1>
          <p>
            Manage ABHI EDITZ clients and editing projects.
          </p>
        </div>

        <Link to="/" className="dashboard-home">
          ← Home
        </Link>
      </header>

      <main className="dashboard-content">

        <div className="dashboard-card">
          <span>👥</span>
          <h2>Clients</h2>
          <p>Manage your editing clients.</p>

          <Link to="/admin/clients" className="dashboard-action">
            View Clients →
          </Link>
        </div>

        <div className="dashboard-card"> 
  <span>🎬</span> 
  <h2>Projects</h2> 
  <p>View and manage editing projects.</p>

  <Link to="/admin/projects" className="dashboard-action">
    View Projects →
  </Link>
</div>

        <div className="dashboard-card">
  <span>📥</span>
  <h2>Requests</h2>
  <p>View incoming editing requests.</p>

  <Link to="/admin/requests" className="dashboard-action">
    View Requests →
  </Link>
</div>

<div className="dashboard-card">
  <span>💬</span>
  <h2>Messages</h2>
  <p>
    Chat with the ABHI EDITZ editing team.
  </p>

  <Link to="/admin/messages" className="dashboard-action">
    💬 Chat with client →
  </Link>
</div>

<div className="dashboard-card">
  <span>🔔</span>
  <h2>Notifications</h2>

  {notificationLoading ? (
    <p>Loading notifications...</p>
  ) : notifications.length === 0 ? (
    <p>No notifications yet.</p>
  ) : (
    
      Object.entries(groupedNotifications).map(([projectId, projectNotifications]) => (
  <div
    key={projectId}
    className={
      projectNotifications.some((notification) => !notification.is_read)
        ? 'notification-unread'
        : ''
    }
  >
    {projectNotifications.map((notification) => (
      <div key={notification.id}>
        <strong>{notification.title}</strong>
        <p>{notification.message}</p>

        {!notification.is_read && (
          <button
            type="button"
            onClick={() => markNotificationAsRead(notification.id)}
            className="dashboard-action"
          >
            ✓ Mark as Read
          </button>
        )}
      </div>
    ))}

    {projectNotifications[0].project_id && (
      <Link
        to={`/admin/requests?project=${projectNotifications[0].project_id}`}
        className="dashboard-action"
      >
        🎬 Open Project →
      </Link>
    )}
  </div>
))

  )}
</div>

<div className="dashboard-card">
  <h2>Registered Clients</h2>

  {loading ? (
    <p>Loading clients...</p>
  ) : clients.length === 0 ? (
    <p>No clients registered yet.</p>
  ) : (
    clients.map((client) => (
  <div key={client.id}>
    <div className="client-online-status">
      <span
        className={
          onlineUsers[client.id]
            ? 'online-dot online'
            : 'online-dot offline'
        }
      />

      <strong>
        {client.full_name || 'Unnamed Client'}
      </strong>
    </div>

    <p>
      {onlineUsers[client.id] ? '🟢 Online' : '⚪ Offline'}
    </p>

    <p>Role: {client.role}</p>
  </div>
))
  )}
</div>

      </main>

    </div>
  )
}

export default AdminDashboard