import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function ClientManagement() {

  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadClients = async () => {
      const { data, error } = await supabase
        .from('profiles')
         .select('id, full_name, role, is_timed_out, timeout_until, created_at')
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

    loadClients()
  }, [])

const handleTimeoutClient = async (clientId) => {
  const client = clients.find((item) => item.id === clientId)

  if (!client) return

  if (client.is_timed_out) {
    const { error } = await supabase
      .from('profiles')
      .update({
        is_timed_out: false,
        timeout_until: null,
      })
      .eq('id', clientId)

    if (error) {
      console.error('Remove timeout error:', error.message)
      alert('Failed to remove timeout.')
      return
    }

    setClients((current) =>
      current.map((item) =>
        item.id === clientId
          ? {
              ...item,
              is_timed_out: false,
              timeout_until: null,
            }
          : item
      )
    )

    return
  }

  const duration = window.prompt(
    'Enter timeout duration in minutes:'
  )

  if (!duration) return

  const minutes = Number(duration)

  if (!Number.isFinite(minutes) || minutes <= 0) {
    alert('Please enter a valid number of minutes.')
    return
  }

  const timeoutUntil = new Date(
    Date.now() + minutes * 60 * 1000
  ).toISOString()

  const { error } = await supabase
    .from('profiles')
    .update({
      is_timed_out: true,
      timeout_until: timeoutUntil,
    })
    .eq('id', clientId)

  if (error) {
    console.error('Timeout error:', error.message)
    alert('Failed to update client timeout.')
    return
  }

  setClients((current) =>
    current.map((item) =>
      item.id === clientId
        ? {
            ...item,
            is_timed_out: true,
            timeout_until: timeoutUntil,
          }
        : item
    )
  )
}

const handleDeleteClient = async (clientId) => {
  const confirmed = window.confirm(
    'Are you sure you want to delete this client?'
  )

  if (!confirmed) return

  const { data, error } = await supabase.functions.invoke(
    'delete-client',
    {
      body: {
        clientId,
      },
    }
  )

  if (error) {
    console.error('Delete client error:', error.message)
    alert('Failed to delete client.')
    return
  }

  if (data?.error) {
    alert(data.error)
    return
  }

  setClients((current) =>
    current.filter((client) => client.id !== clientId)
  )

  alert('Client deleted successfully.')
}

  return (
    <div className="dashboard-page">

      <header className="dashboard-header">
        <div>
          <p className="dashboard-label">CLIENT MANAGEMENT</p>
          <h1>Clients</h1>
          <p>Manage your ABHI EDITZ clients.</p>
        </div>

        <Link to="/admin" className="dashboard-home">
          ← Admin Dashboard
        </Link>
      </header>

      <main className="dashboard-content">

        <div className="dashboard-card">
          <h2>Client List</h2>

          {loading ? (
            <p>Loading clients...</p>
          ) : clients.length === 0 ? (
            <p>No clients found.</p>
          ) : (
            clients.map((client) => (
              <div key={client.id}>
                <strong>
                  {client.full_name || 'Unnamed Client'}
                </strong>

                <p>
                  {client.is_timed_out
                    ? '⏱️ Timed Out'
                    : ''}
                </p>

                <button
  type="button"
  className={
    client.is_timed_out
      ? 'client-action-btn remove-timeout-btn'
      : 'client-action-btn timeout-btn'
  }
  onClick={() => handleTimeoutClient(client.id)}
>
  {client.is_timed_out ? '🔓 Remove Timeout' : '⏱️ Timeout'}
</button>

<button
  type="button"
  className="client-action-btn delete-client-btn"
  onClick={() => handleDeleteClient(client.id)}
>
  🗑️ Delete
</button>
              </div>
            ))
          )}
        </div>

      </main>

    </div>
  )
}

export default ClientManagement