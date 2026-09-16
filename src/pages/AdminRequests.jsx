import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { uploadVideoToCloudinary } from '../lib/cloudinary'

function AdminRequests() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState({})
  const [uploadingProject, setUploadingProject] = useState(null)
  const [deletingProject, setDeletingProject] = useState(null)
  const [originalVideoUrls, setOriginalVideoUrls] = useState({})
  const [previewVideo, setPreviewVideo] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [clientFilter, setClientFilter] = useState('all')
  const [searchParams] = useSearchParams()
  const selectedProjectId = searchParams.get('project')

  useEffect(() => {
    const loadRequests = async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(
  'id, title, description, status, created_at, updated_at, client_id, original_file_path, revision_requested, revision_message, revision_count'
)
        
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Requests error:', error.message)
      } else {
  setProjects(data || [])

  const secureUrls = {}

  for (const project of data || []) {
    if (!project.original_file_path) continue

    const { data: secureVideo, error: secureError } =
      await supabase.functions.invoke(
        'get-secure-video-url',
        {
          body: {
            projectId: project.id,
            filePath: project.original_file_path,
          },
        }
      )

    if (secureError) {
      console.error(
        'Secure original video error:',
        secureError.message
      )
      continue
    }

    if (secureVideo?.url) {
      secureUrls[project.id] = secureVideo.url
    }
  }

  setOriginalVideoUrls(secureUrls)
}

      setLoading(false)
    }

    loadRequests()
  }, [])

  const createNotification = async (userId, projectId, title, message) => {
  const { error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      project_id: projectId,
      title,
      message,
    })

  if (error) {
    console.error('Notification error:', error.message)
  }
}

const updateStatus = async (projectId, newStatus) => {
  const project = projects.find((item) => item.id === projectId)

  if (!project) return

  const { error } = await supabase
    .from('projects')
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId)

  if (error) {
    alert(error.message)
    return
  }

  await createNotification(
    project.client_id,
    project.id,
    'Project Status Updated',
    `Your project "${project.title}" is now ${newStatus}.`
  )

  setProjects((currentProjects) =>
    currentProjects.map((item) =>
      item.id === projectId
        ? { ...item, status: newStatus }
        : item
    )
  )
}

const handleDeleteProject = async (projectId) => {
  const confirmed = window.confirm(
    'Are you sure you want to permanently delete this project and its original video?'
  )

  if (!confirmed) return

  setDeletingProject(projectId)

  try {
    const { data, error } = await supabase.functions.invoke(
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
        data?.error || 'Project deletion failed.'
      )
    }

    setProjects((currentProjects) =>
      currentProjects.filter(
        (project) => project.id !== projectId
      )
    )

    setOriginalVideoUrls((currentUrls) => {
      const updatedUrls = { ...currentUrls }
      delete updatedUrls[projectId]
      return updatedUrls
    })

    alert('Project and original video deleted successfully.')
  } catch (error) {
    console.error('Delete project error:', error)
    alert(error.message || 'Project deletion failed.')
  } finally {
    setDeletingProject(null)
  }
}

const uploadFinalVideo = async (projectId) => {
  const video = selectedVideo[projectId]
  const project = projects.find((item) => item.id === projectId)

  if (!project) return

  if (!video) {
    alert('Please select the final edited video.')
    return
  }

  if (!video.type.startsWith('video/')) {
    alert('Please select a valid video file.')
    return
  }

  const allowedTypes = [
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-msvideo',
  'video/x-matroska',
]

if (!allowedTypes.includes(video.type)) {
  alert('Allowed video formats: MP4, MOV, WEBM, AVI, MKV.')
  return
}

const allowedExtensions = [
  '.mp4',
  '.mov',
  '.webm',
  '.avi',
  '.mkv',
]

const fileName = video.name.toLowerCase()

const hasValidExtension = allowedExtensions.some(
  (extension) => fileName.endsWith(extension)
)

if (!hasValidExtension) {
  alert('Allowed video formats: MP4, MOV, WEBM, AVI, MKV.')
  return
}

  const maxSize = 500 * 1024 * 1024

  if (video.size > maxSize) {
    alert('Video size must be 500 MB or less.')
    return
  }

  setUploadingProject(projectId)

  try {
    const data = await uploadVideoToCloudinary(video)

    const finalFilePath = `${data.public_id}.${data.format}`

    const { error } = await supabase
      .from('projects')
      .update({
        final_file_path: finalFilePath,
        revision_requested: false,
        revision_message: null,
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)

    if (error) {
      throw new Error(error.message)
    }

    setProjects((currentProjects) =>
      currentProjects.map((item) =>
        item.id === projectId
          ? {
              ...item,
              final_file_path: finalFilePath,
              revision_requested: false,
              revision_message: null,
              status: 'completed',
            }
          : item
      )
    )

    await createNotification(
      project.client_id,
      project.id,
      'Final Video Ready 🎉',
      `Your project "${project.title}" has been completed. Your final edited video is ready.`
    )

    alert('Final video uploaded successfully!')
  } catch (error) {
    console.error('Final video upload error:', error)
    alert(error.message || 'Final video upload failed.')
  } finally {
    setUploadingProject(null)
  }
}

const filteredProjects = projects.filter((project) => {
  const matchesSearch =
    project.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
    project.description
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
    project.client_id
      .toLowerCase()
      .includes(searchTerm.toLowerCase())

  const matchesStatus =
    statusFilter === 'all' ||
    project.status === statusFilter

  const matchesClient =
    clientFilter === 'all' ||
    project.client_id === clientFilter

  return matchesSearch && matchesStatus && matchesClient
})

const clientIds = [
  ...new Set(projects.map((project) => project.client_id)),
]

  return (
    <div className="dashboard-page">

      <header className="dashboard-header">
        <div>
          <p className="dashboard-label">ADMIN</p>
          <h1>Incoming Requests</h1>
          <p>
            New video editing requests from clients.
          </p>
        </div>

        <Link to="/admin" className="dashboard-home">
          ← Admin Dashboard
        </Link>
      </header>

      <main className="dashboard-content">

<div className="dashboard-card">
  <h2>🔎 Search & Filter</h2>

  <input
    type="text"
    placeholder="Search project, description or client ID..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
  />

  <select
    value={statusFilter}
    onChange={(e) => setStatusFilter(e.target.value)}
  >
    <option value="all">All Statuses</option>
    <option value="submitted">Submitted</option>
    <option value="downloaded">Downloaded</option>
    <option value="editing">Editing</option>
    <option value="review">Review</option>
    <option value="completed">Completed</option>
  </select>

  <select
    value={clientFilter}
    onChange={(e) => setClientFilter(e.target.value)}
  >
    <option value="all">All Clients</option>

    {clientIds.map((clientId) => (
      <option key={clientId} value={clientId}>
        {clientId}
      </option>
    ))}
  </select>
</div>

        {loading ? (
          <div className="dashboard-card">
            <p>Loading requests...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="dashboard-card">
            <h2>No new requests</h2>
            <p>New client requests will appear here.</p>
          </div>
        ) : (
          filteredProjects.map((project) => (
            <div
  className="dashboard-card"
  key={project.id}
  style={
    selectedProjectId === project.id
      ? { border: '2px solid #a855f7' }
      : {}
  }
>
              <h2>{project.title}</h2>

              <p>{project.description}</p>

              <p>
                Status: <strong>{project.status}</strong>
              </p>

{project.revision_requested && (
  <div className="revision-request">
    <h3>🔄 Revision Requested</h3>

    <p>
      <strong>Client's Changes:</strong>
    </p>

    <p>{project.revision_message}</p>

    <p>
      <strong>Revision Count:</strong> {project.revision_count}
    </p>
  </div>
)}

{project.revision_requested && (
  <button
    type="button"
    onClick={() => updateStatus(project.id, 'editing')}
  >
    🔄 Start Revision
  </button>
)}
              <p>
                Submitted:{' '}
                {new Date(project.created_at).toLocaleDateString()}
              </p>

              <p>
                Client ID: {project.client_id}
              </p>

<Link
  to={`/admin/chat?project=${project.id}`}
  className="dashboard-action"
>
  💬 Chat with Client
</Link>

{project.original_file_path && (
  originalVideoUrls[project.id] ? (
    <>
      <button
        type="button"
        className="secondary-btn"
        onClick={() =>
          setPreviewVideo(originalVideoUrls[project.id])
        }
      >
        ▶️ View Original Video
      </button>

      <a
        href={originalVideoUrls[project.id]}
        target="_blank"
        rel="noreferrer"
        className="secondary-btn"
      >
        ⬇️ Download Original Video
      </a>
    </>
  ) : (
    <p>Loading secure video...</p>
  )
)}

{project.original_file_path && (
  <button
    type="button"
    className="delete-video-btn"
    onClick={() => handleDeleteProject(project.id)}
    disabled={deletingProject === project.id}
  >
    {deletingProject === project.id
      ? 'Deleting Project...'
      : '🗑️ Delete Project & Original Video'}
  </button>
)}

<div className="final-video-upload">
  <label>Upload Final Edited Video</label>

  <input
    type="file"
    accept="video/*"
    onChange={(e) =>
      setSelectedVideo((current) => ({
        ...current,
        [project.id]: e.target.files[0],
      }))
    }
  />

  <button
    type="button"
    onClick={() => uploadFinalVideo(project.id)}
    disabled={uploadingProject === project.id}
  >
    {uploadingProject === project.id
      ? 'Uploading Final Video...'
      : 'Upload Final Video'}
  </button>
</div>

              <button
  type="button"
  onClick={() => updateStatus(project.id, 'downloaded')}
>
  Mark as Downloaded
</button>

<button
  type="button"
  onClick={() => updateStatus(project.id, 'editing')}
>
  Start Editing
</button>

            </div>
          ))
        )}

      </main>

{previewVideo && (
  <div
    className="video-modal"
    onClick={() => setPreviewVideo(null)}
  >
    <div
      className="video-modal-content"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className="video-modal-close"
        onClick={() => setPreviewVideo(null)}
      >
        ✕
      </button>

      <video
        src={previewVideo}
        controls
        autoPlay
        className="video-preview-player"
      />
    </div>
  </div>
)}

    </div>
  )
}

export default AdminRequests