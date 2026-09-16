import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function ProjectDetails() {
  const { id } = useParams()

  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [originalVideoUrl, setOriginalVideoUrl] = useState(null)
  const [finalVideoUrl, setFinalVideoUrl] = useState(null)
  const [videoLoading, setVideoLoading] = useState(false)
  const [history, setHistory] = useState([])
  const [revisionMessage, setRevisionMessage] = useState('')
  const [revisionLoading, setRevisionLoading] = useState(false)
  const [revisionSent, setRevisionSent] = useState(false)

  const requestRevision = async () => {
  if (!revisionMessage.trim()) {
    alert('Please describe the changes you want.')
    return
  }

  setRevisionLoading(true)

  const { error } = await supabase
    .from('projects')
    .update({
      revision_requested: true,
      revision_message: revisionMessage.trim(),
      revision_count: (project.revision_count || 0) + 1,
      status: 'editing',
      updated_at: new Date().toISOString(),
    })
    .eq('id', project.id)
    .eq('client_id', (await supabase.auth.getUser()).data.user.id)

  if (error) {
    alert(error.message)
    setRevisionLoading(false)
    return
  }

  setProject((current) => ({
    ...current,
    revision_requested: true,
    revision_message: revisionMessage.trim(),
    revision_count: (current.revision_count || 0) + 1,
    status: 'editing',
  }))

  setRevisionMessage('')
  setRevisionSent(true)
  setRevisionLoading(false)
}

  useEffect(() => {
    const loadProject = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('projects')
        .select(
  'id, title, description, status, original_file_path, final_file_path, revision_requested, revision_message, revision_count, created_at, updated_at'
)
        
        .eq('id', id)
        .eq('client_id', user.id)
        .single()

      if (error) {
        console.error('Project details error:', error.message)
      } else {
  setProject(data)

  const { data: historyData, error: historyError } = await supabase
    .from('project_history')
    .select('id, action, old_status, new_status, note, created_at')
    .eq('project_id', data.id)
    .order('created_at', { ascending: false })

  if (historyError) {
    console.error('History error:', historyError.message)
  } else {
    setHistory(historyData || [])
  }

  setVideoLoading(true)

  if (data.original_file_path) {
    const { data: originalVideo, error: originalError } =
      await supabase.functions.invoke(
        'get-secure-video-url',
        {
          body: {
            projectId: data.id,
            filePath: data.original_file_path,
          },
        }
      )

    if (originalError) {
      console.error(
        'Original video security error:',
        originalError.message
      )
    } else {
      setOriginalVideoUrl(originalVideo?.url || null)
    }
  }

  if (data.final_file_path) {
    const { data: finalVideo, error: finalError } =
      await supabase.functions.invoke(
        'get-secure-video-url',
        {
          body: {
            projectId: data.id,
            filePath: data.final_file_path,
          },
        }
      )

    if (finalError) {
      console.error(
        'Final video security error:',
        finalError.message
      )
    } else {
      setFinalVideoUrl(finalVideo?.url || null)
    }
  }

  setVideoLoading(false)
}

      setLoading(false)
    }

    loadProject()
  }, [id])

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-card">
          <p>Loading project...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-card">
          <h2>Project not found</h2>
          <p>This project does not exist or you don't have access to it.</p>

          <Link to="/projects">
            ← Back to My Projects
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-page">

      <header className="dashboard-header">
        <div>
          <p className="dashboard-label">PROJECT DETAILS</p>
          <h1>{project.title}</h1>
          <p>Track your video editing project.</p>
        </div>

        <Link to="/projects" className="dashboard-home">
          ← My Projects
        </Link>
      </header>

      <main className="dashboard-content">

        <div className="dashboard-card">
          <h2>Project Information</h2>

          <p>
            <strong>Description:</strong>
          </p>

          <p>
            {project.description || 'No description provided.'}
          </p>

          <p>
            <strong>Status:</strong> {project.status}
          </p>

          <p>
            <strong>Submitted:</strong>{' '}
            {new Date(project.created_at).toLocaleString()}
          </p>

          <p>
            <strong>Last Updated:</strong>{' '}
            {new Date(project.updated_at).toLocaleString()}
          </p>

          <Link
  to={`/chat?project=${project.id}`}
  className="dashboard-action"
>
  💬 Chat with Admin
</Link>

        </div>

        <div className="dashboard-card">
          <h2>Project Progress</h2>

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
        </div>

<div className="dashboard-card">
  <h2>Project Files</h2>

  <div className="project-file">
    <h3>🎬 Original Video</h3>

    {project.original_file_path ? (
  <div>
    <p>Original video uploaded by you 🎬</p>

    {videoLoading ? (
  <p>Loading secure video...</p>
) : originalVideoUrl ? (
  <video
    controls
    width="100%"
    src={originalVideoUrl}
  >
    Your browser does not support video playback.
  </video>
) : (
  <p>Unable to load secure video.</p>
)}
  </div>
) : (
  <p>No original video available.</p>
)}
  </div>

  <div className="project-file">
    <h3>🎞️ Final Edited Video</h3>

    {project.final_file_path ? (
  <div>
    <p>Your edited video is ready 🎉</p>

    {videoLoading ? (
  <p>Loading secure video...</p>
) : finalVideoUrl ? (
  <video
    controls
    width="100%"
    src={finalVideoUrl}
  >
    Your browser does not support video playback.
  </video>
) : (
  <p>Unable to load secure video.</p>
)}

{finalVideoUrl && (
  <a
    href={finalVideoUrl}
    target="_blank"
    rel="noopener noreferrer"
    className="primary-btn"
  >
    Download Final Video ↓
  </a>
)}

  </div>
) : (
      <p>The final edited video will appear here once your project is completed.</p>
    )}
  </div>
</div>

<div className="dashboard-card">
  <h2>Request a Revision</h2>

  {revisionSent ? (
    <p>
      ✅ Revision request sent successfully. The project is back in editing.
    </p>
  ) : (
    <>
      <p>
        Need any changes in your edited video? Tell the editor what you want.
      </p>

      <textarea
        value={revisionMessage}
        onChange={(e) => setRevisionMessage(e.target.value)}
        placeholder="Describe the changes you want..."
        rows="5"
      />

      <button
        type="button"
        className="primary-btn"
        onClick={requestRevision}
        disabled={revisionLoading}
      >
        {revisionLoading
          ? 'Sending Revision Request...'
          : 'Request Revision →'}
      </button>
    </>
  )}
</div>

<div className="dashboard-card">
  <h2>📋 Project History</h2>

  {history.length === 0 ? (
    <p>No history yet.</p>
  ) : (
    <div>
      {history.map((item) => (
        <div key={item.id} className="history-item">
          <strong>
            {item.action === 'project_created'
              ? '🎬 Project Created'
              : item.action === 'status_changed'
                ? `🔄 Status: ${item.old_status} → ${item.new_status}`
                : item.action === 'revision_requested'
                  ? '♻️ Revision Requested'
                  : item.action === 'final_video_uploaded'
                    ? '✅ Final Video Uploaded'
                    : item.action}
          </strong>

          {item.note && <p>{item.note}</p>}

          <small>
            {new Date(item.created_at).toLocaleString()}
          </small>
        </div>
      ))}
    </div>
  )}
</div>

      </main>
    </div>
  )
}

export default ProjectDetails