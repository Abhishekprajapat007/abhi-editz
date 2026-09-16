import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function Dashboard() {

    const navigate = useNavigate()

const [user, setUser] = useState(null)
const [loading, setLoading] = useState(true)
const [notifications, setNotifications] = useState([])
const [notificationLoading, setNotificationLoading] = useState(true)
const [adminOnline, setAdminOnline] = useState(false)

useEffect(() => {
  let channel = null
  let presenceChannel = null

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      navigate('/login')
      return
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Profile error:', error.message)
    }

    setUser({
      ...user,
      profile,
    })

    const { data: notificationData, error: notificationError } = await supabase
  .from('notifications')
  .select('id, project_id, title, message, is_read, created_at')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })

if (notificationError) {
  console.error('Notification error:', notificationError.message)
} else {
  setNotifications(notificationData || [])
}

setNotificationLoading(false)

channel = supabase
  .channel(`notifications-${user.id}`)
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

 presenceChannel = supabase.channel('abhi-editz-presence', {
  config: {
    presence: {
      key: user.id,
    },
  },
})

const updateAdminPresence = () => {
  const state = presenceChannel.presenceState()

  let isAdminOnline = false

  Object.values(state).forEach((presences) => {
    presences.forEach((presence) => {
      if (presence.role === 'admin') {
        isAdminOnline = true
      }
    })
  })

  setAdminOnline(isAdminOnline)
}

presenceChannel.on(
  'presence',
  { event: 'sync' },
  updateAdminPresence
)

presenceChannel.on(
  'presence',
  { event: 'join' },
  updateAdminPresence
)

presenceChannel.on(
  'presence',
  { event: 'leave' },
  updateAdminPresence
)

await presenceChannel.subscribe(async (status) => {
  if (status === 'SUBSCRIBED') {
    await presenceChannel.track({
      role: 'client',
      online_at: new Date().toISOString(),
    })
  }
})
  
    setLoading(false)
  }

  checkUser()

return () => {
  if (channel) {
    supabase.removeChannel(channel)
  }

  if (presenceChannel) {
    supabase.removeChannel(presenceChannel)
  }
}

}, [navigate])

if (loading) {
  return <div>Loading...</div>
}

const handleLogout = async () => {
  await supabase.auth.signOut()
  navigate('/login')
}

  return (
    <div className="dashboard-page">

      <header className="dashboard-header">
        <div>
          <p className="dashboard-label">CLIENT DASHBOARD</p>
          <h1>Welcome, {user?.profile?.full_name || 'Client'}</h1>
          <p>
            Manage your video editing projects from here.
          </p>

          <p className="admin-online-status">
  <span
    className={
      adminOnline
        ? 'online-dot online'
        : 'online-dot offline'
    }
  />

  {adminOnline ? 'Admin is Online' : 'Admin is Offline'}
</p>

           <p>Account type: {user?.profile?.role}</p>

        </div>

        <Link to="/" className="dashboard-home">
          ← Home
        </Link>

        <button
  type="button"
  onClick={handleLogout}
  className="dashboard-logout"
>
  Logout
</button>

      </header>

      <main className="dashboard-content">

        <div className="dashboard-card">
          <span>🎬</span>
          <h2>My Projects</h2>
          <p>
            View your current and completed editing projects.
          </p>
          <Link to="/projects" className="dashboard-action">
  🎬 My Projects →
</Link>
        </div>

<div className="dashboard-card">
  <span>🔔</span>

  <h2>
    Notifications
    {notifications.filter((item) => !item.is_read).length > 0 && (
      <span className="notification-count">
        {notifications.filter((item) => !item.is_read).length}
      </span>
    )}
  </h2>

  <p>
    View updates, messages, revisions and project notifications.
  </p>

  <Link to="/notifications" className="dashboard-action">
    🔔 View Notifications →
  </Link>
</div>

        <div className="dashboard-card">
          <span>➕</span>
          <h2>New Editing Request</h2>
          <p>
            Send us your video and editing requirements.
          </p>
          <Link to="/new-project" className="dashboard-card-button">
  Start Project
</Link>
        </div>

        <div className="dashboard-card">
  <span>💬</span>
  <h2>Messages</h2>
  <p>
    Chat with the ABHI EDITZ editing team.
  </p>

  <Link to="/messages" className="dashboard-action">
    💬 Messages →
  </Link>
</div>

      </main>

    </div>
  )
}

export default Dashboard