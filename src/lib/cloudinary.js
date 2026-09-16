export const uploadVideoToCloudinary = async (video, onProgress) => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary configuration is missing.')
  }

  const chunkSize = 20 * 1024 * 1024 // 20 MB
  const uploadId = crypto.randomUUID()

  let start = 0
  let result = null

  while (start < video.size) {
    const end = Math.min(start + chunkSize, video.size)
    const chunk = video.slice(start, end)

    const formData = new FormData()
    formData.append('file', chunk)
    formData.append('upload_preset', uploadPreset)

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
      {
        method: 'POST',
        headers: {
          'X-Unique-Upload-Id': uploadId,
          'Content-Range': `bytes ${start}-${end - 1}/${video.size}`,
        },
        body: formData,
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(
        data.error?.message || 'Cloudinary upload failed.'
      )
    }

    result = data
    start = end

    if (onProgress) {
      onProgress(Math.round((start / video.size) * 100))
    }
  }

  if (!result?.public_id) {
    throw new Error('Cloudinary did not return a valid video.')
  }

  return result
}