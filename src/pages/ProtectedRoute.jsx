import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function ProtectedRoute({ children, requiredRole }) {
  const [loading, setLoading] = useState(true)
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    const checkAccess = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, is_timed_out, timeout_until')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Role check error:', error.message)
        setLoading(false)
        return
      }

      if (profile.role === requiredRole) {
  if (
    profile.role === 'client' &&
    profile.is_timed_out &&
    profile.timeout_until
  ) {
    const timeoutUntil = new Date(profile.timeout_until)
    const now = new Date()

    if (timeoutUntil > now) {
      await supabase.auth.signOut()
      setAllowed(false)
      setLoading(false)
      return
    }

    // Timeout has expired, reset it in database
    const { error: resetError } = await supabase
      .from('profiles')
      .update({
        is_timed_out: false,
        timeout_until: null,
      })
      .eq('id', user.id)

    if (resetError) {
      console.error('Timeout reset error:', resetError.message)
      setAllowed(false)
      setLoading(false)
      return
    }
  }

  setAllowed(true)
}

      setLoading(false)
    }

    checkAccess()
  }, [requiredRole])

  if (loading) {
    return <div>Checking access...</div>
  }

  if (!allowed) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute