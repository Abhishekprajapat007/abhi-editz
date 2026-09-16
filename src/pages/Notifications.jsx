import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function Notifications() {
  const [user, setUser] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let channel

    const loadNotifications = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      setUser(user)

      const { data, error } = await supabase
        .from('notifications')
        .select(
          'id, project_id, title, message, is_read, created_at'
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Notifications error:', error.message)
      } else {
        setNotifications(data || [])
      }

      channel = supabase
        .channel(`notifications-page-${user.id}`)
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

      setLoading(false)
    }

    loadNotifications()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [])

  const markAsRead = async (notificationId) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Read notification error:', error.message)
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

  const markAllAsRead = async () => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (error) {
      alert(error.message)
      return
    }

    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        is_read: true,
      }))
    )
  }

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-content">
          <p>Loading notifications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-eyebrow">ABHI EDITZ</p>
          <h1>Notifications</h1>
          <p>Stay updated with your projects and messages.</p>
        </div>

        <Link to="/dashboard" className="secondary-btn">
          ← Dashboard
        </Link>
      </header>

      <main className="dashboard-content">
        <div className="dashboard-card">
          <div className="notifications-page-header">
            <div>
              <h2>🔔 All Notifications</h2>
              <p>
                {notifications.filter(
                  (notification) => !notification.is_read
                ).length}{' '}
                unread notifications
              </p>
            </div>

            {notifications.some(
              (notification) => !notification.is_read
            ) && (
              <button
                type="button"
                className="secondary-btn"
                onClick={markAllAsRead}
              >
                Mark All as Read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="empty-notifications">
              <div>🔕</div>
              <h3>No notifications yet</h3>
              <p>
                You will see project updates and important messages here.
              </p>
            </div>
          ) : (
            <div className="notifications-list">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${
                    notification.is_read ? '' : 'unread'
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="notification-content">
                    <div className="notification-title-row">
                      <h3>{notification.title}</h3>

                      {!notification.is_read && (
                        <span className="notification-dot"></span>
                      )}
                    </div>

                    <p>{notification.message}</p>

                    <small>
                      {new Date(
                        notification.created_at
                      ).toLocaleString()}
                    </small>
                  </div>

                  {notification.project_id && (
                    <Link
                      to={`/projects/${notification.project_id}`}
                      className="notification-project-link"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View Project →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default Notifications