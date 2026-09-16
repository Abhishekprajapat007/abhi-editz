 import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
function Login() { 
  const navigate = useNavigate()

const [email, setEmail] = useState('')
const [password, setPassword] = useState('')
const [loading, setLoading] = useState(false)
const [showPassword, setShowPassword] = useState(false)

const handleLogin = async (e) => {
  e.preventDefault()

  setLoading(true)

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    setLoading(false)
    alert(error.message)
    return
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, is_timed_out, timeout_until')
    .eq('id', data.user.id)
    .single()

  setLoading(false)

  if (profileError) {
    console.error('Profile error:', profileError.message)
    alert(profileError.message)
    return
  }

  if (profile.role === 'admin') {
  navigate('/admin')
} else {
  if (
    profile.is_timed_out &&
    profile.timeout_until &&
    new Date(profile.timeout_until) > new Date()
  ) {
    await supabase.auth.signOut()
    alert(
      `Your account is temporarily timed out until ${new Date(
        profile.timeout_until
      ).toLocaleString()}`
    )
    return
  }

  navigate('/dashboard')
}
}

  return ( 
    <div className="auth-page"> 
      <div className="auth-card"> 
 
        <Link to="/" className="auth-logo"> 
          A 
        </Link> 
 
        <p className="auth-label">WELCOME BACK</p> 
 
        <h1>Login to ABHI EDITZ</h1> 
 
        <p className="auth-subtitle"> 
          Access your editing projects and dashboard. 
        </p> 
 
        <form onSubmit={handleLogin}>
          <label>Email</label> 
 
          <input
  type="email"
  placeholder="Enter your email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
 
          <label>Password</label> 
 
          <div className="password-input-wrapper">
  <input
    type={showPassword ? 'text' : 'password'}
    placeholder="Enter your password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
  />

  <button
    type="button"
    className="password-toggle"
    onClick={() => setShowPassword((current) => !current)}
    aria-label={showPassword ? 'Hide password' : 'Show password'}
  >
    {showPassword ? '🙈' : '👁️'}
  </button>
</div>
 
          <button
  type="submit"
  className="auth-submit"
  disabled={loading}
>
  {loading ? 'Logging in...' : 'Login →'}
</button>
        </form> 
 
        <p className="auth-switch"> 
          Don't have an account?{' '} 
          <Link to="/register"> 
            Create account 
          </Link> 
        </p> 
 
        <Link to="/" className="back-home"> 
          ← Back to home 
        </Link> 
 
      </div> 
    </div> 
  ) 
} 
 
export default Login     