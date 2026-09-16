import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function MyProjects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    const loadProjects = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('projects')
        .select('id, title, description, status, original_file_path, created_at')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Projects error:', error.message)
      } else {
        setProjects(data || [])
      }

      setLoading(false)
    }

    loadProjects()
  }, [])

const handleDeleteVideo = async (projectId) => {
  const confirmed = window.confirm(
    'Are you sure you want to delete this original video?'
  )

  if (!confirmed) return

  setDeleting(projectId)

  try {
    const { data, error } =
      await supabase.functions.invoke(
        'delete-project-video',
        {
          body: {
            projectId,
          },
        }
      )

    if (error) {
      throw error
    }

    if (!data?.success) {
      throw new Error(
        data?.error || 'Video deletion failed.'
      )
    }

    setProjects((current) =>
  current.filter((project) => project.id !== projectId)
)

    alert('Original video deleted successfully.')
  } catch (error) {
    console.error('Delete video error:', error)
    alert(error.message || 'Video deletion failed.')
  } finally {
    setDeleting(null)
  }
}

  return (
    <div className="dashboard-page">

      <header className="dashboard-header">
        <div>
          <p className="dashboard-label">MY PROJECTS</p>
          <h1>Your Editing Projects</h1>
          <p>
            Track all your submitted editing requests.
          </p>
        </div>

        <Link to="/dashboard" className="dashboard-home">
          ← Dashboard
        </Link>
      </header>

      <main className="dashboard-content">

        {loading ? (
          <div className="dashboard-card">
            <p>Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="dashboard-card">
            <h2>No projects yet</h2>
            <p>
              Start your first editing project.
            </p>

            <Link to="/new-project">
              Start Project →
            </Link>
          </div>
        ) : (
          projects.map((project) => (
            <div
  className="dashboard-card project-card-link"
  key={project.id}
>
  <Link
    to={`/projects/${project.id}`}
    className="project-card-main-link"
  >
    <h2>{project.title}</h2>

    <p>{project.description}</p>

    <div className="project-status">
      <span className={`status-badge ${project.status}`}>
        {project.status === 'submitted' && 'Submitted'}
        {project.status === 'downloaded' && 'Downloaded'}
        {project.status === 'editing' && 'Editing'}
        {project.status === 'review' && 'Review'}
        {project.status === 'completed' && 'Completed'}
      </span>
    </div>

    <div className="status-progress">
      <div className={project.status === 'submitted' ? 'active' : ''}>
        1. Submitted
      </div>

      <div
        className={
          ['downloaded', 'editing', 'review', 'completed'].includes(
            project.status
          )
            ? 'active'
            : ''
        }
      >
        2. Downloaded
      </div>

      <div
        className={
          ['editing', 'review', 'completed'].includes(project.status)
            ? 'active'
            : ''
        }
      >
        3. Editing
      </div>

      <div
        className={
          ['review', 'completed'].includes(project.status)
            ? 'active'
            : ''
        }
      >
        4. Review
      </div>

      <div className={project.status === 'completed' ? 'active' : ''}>
        5. Completed
      </div>
    </div>

    <p>
      Created:{' '}
      {new Date(project.created_at).toLocaleDateString()}
    </p>
  </Link>

  {project.original_file_path &&
    project.status === 'submitted' && (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          handleDeleteVideo(project.id)
        }}
        disabled={deleting === project.id}
        className="delete-video-btn"
      >
        {deleting === project.id
          ? 'Deleting...'
          : '🗑️ Delete Original Video'}
      </button>
    )}
</div>
          ))
        )}

      </main>

    </div>
  )
}

export default MyProjects