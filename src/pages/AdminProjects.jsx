import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function AdminProjects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProjects = async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, title, status, client_id, created_at')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Projects error:', error.message)
        setLoading(false)
        return
      }

      setProjects(data || [])
      setLoading(false)
    }

    loadProjects()
  }, [])

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
          <p className="dashboard-label">ADMIN PROJECTS</p>
          <h1>Projects</h1>
          <p>View and manage all editing projects.</p>
        </div>

        <Link to="/admin" className="dashboard-home">
          ← Dashboard
        </Link>
      </header>

      <main className="dashboard-content">

        <div className="dashboard-card">
          <h2>📊 {totalProjects}</h2>
          <p>Total Projects</p>
        </div>

        <div className="dashboard-card">
          <h2>⚡ {activeProjects}</h2>
          <p>Active Projects</p>
        </div>

        <div className="dashboard-card">
          <h2>✅ {completedProjects}</h2>
          <p>Completed Projects</p>
        </div>

        <div className="dashboard-card">
          <h2>All Projects</h2>

          {loading ? (
            <p>Loading projects...</p>
          ) : projects.length === 0 ? (
            <p>No projects found.</p>
          ) : (
            projects.map((project) => (
              <div key={project.id}>
                <strong>{project.title}</strong>
                <p>Status: {project.status}</p>
              </div>
            ))
          )}
        </div>

      </main>
    </div>
  )
}

export default AdminProjects