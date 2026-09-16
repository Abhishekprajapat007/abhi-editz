import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { uploadVideoToCloudinary } from '../lib/cloudinary'

function NewProject() {
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [video, setVideo] = useState(null)
  const [uploading, setUploading] = useState(false)

const uploadVideo = async () => {
  if (!video) {
    alert('Please select a video.')
    return null
  }

  const maxSize = 500 * 1024 * 1024

  const allowedTypes = [
    'video/mp4',
    'video/quicktime',
    'video/webm',
    'video/x-msvideo',
    'video/x-matroska',
  ]

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
  return null
}

  if (!allowedTypes.includes(video.type)) {
    alert('Allowed video formats: MP4, MOV, WEBM, AVI, MKV.')
    return null
  }

  if (video.size > maxSize) {
    alert('Video size must be 500 MB or less.')
    return null
  }

  setUploading(true)

  try {
    const data = await uploadVideoToCloudinary(video)

    return data
  } catch (error) {
    console.error('Video upload error:', error)
    alert(error.message || 'Video upload failed.')
    return null
  } finally {
    setUploading(false)
  }
}

  const handleSubmit = async (e) => {
    e.preventDefault()

    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      navigate('/login')
      return
    }

const cloudinaryVideo = await uploadVideo()

if (!cloudinaryVideo) {
  setLoading(false)
  return
}

    const { error } = await supabase
  .from('projects')
  .insert({
    client_id: user.id,
    title,
    description,
    original_file_path: `${cloudinaryVideo.public_id}.${cloudinaryVideo.format}`,
  })

    setLoading(false)

    if (error) {
      console.error(error.message)
      alert(error.message)
      return
    }

    alert('Editing request submitted successfully!')
    navigate('/dashboard')
  }

  return (
    <div className="dashboard-page">

      <header className="dashboard-header">
        <div>
          <p className="dashboard-label">NEW PROJECT</p>
          <h1>Start Your Editing Project</h1>
          <p>
            Tell us what you need edited.
          </p>
        </div>

        <Link to="/dashboard" className="dashboard-home">
          ← Dashboard
        </Link>
      </header>

      <main className="dashboard-content">

        <div className="dashboard-card">

          <form onSubmit={handleSubmit}>

            <label>Project Title</label>

            <input
              type="text"
              placeholder="Example: YouTube Gaming Video"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <label>Editing Instructions</label>

            <textarea
              placeholder="Describe how you want your video edited..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="7"
              required
            />

<label>Upload Video</label>

<input
  type="file"
  accept="video/*"
  onChange={(e) => setVideo(e.target.files[0])}
  required
/>

            <button
  type="submit"
  className="auth-submit"
  disabled={loading || uploading}
>
  {uploading
    ? 'Uploading Video...'
    : loading
      ? 'Submitting...'
      : 'Submit Editing Request →'}
</button>

          </form>

        </div>

      </main>

    </div>
  )
}

export default NewProject