import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard'
import ProtectedRoute from './pages/ProtectedRoute'
import NewProject from './pages/NewProject'
import MyProjects from './pages/MyProjects'
import AdminProjects from './pages/AdminProjects'
import AdminRequests from './pages/AdminRequests'
import ProjectDetails from './pages/ProjectDetails'
import Chat from './pages/Chat'
import AdminChat from './pages/AdminChat'
import AdminMessages from './pages/AdminMessages'
import ClientMessages from './pages/ClientMessages'
import Notifications from './pages/Notifications'
import ClientManagement from './pages/ClientManagement'

import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
  path="/dashboard"
  element={
    <ProtectedRoute requiredRole="client">
      <Dashboard />
    </ProtectedRoute>
  }
/>
        <Route
  path="/admin"
  element={
    <ProtectedRoute requiredRole="admin">
      <AdminDashboard />
    </ProtectedRoute>
  }
/>

<Route
  path="/new-project"
  element={
    <ProtectedRoute requiredRole="client">
      <NewProject />
    </ProtectedRoute>
  }
/>

<Route
  path="/projects"
  element={
    <ProtectedRoute requiredRole="client">
      <MyProjects />
    </ProtectedRoute>
  }
/>

<Route
  path="/projects/:id"
  element={
    <ProtectedRoute requiredRole="client">
      <ProjectDetails />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/projects"
  element={
    <ProtectedRoute>
      <AdminProjects />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/requests"
  element={
    <ProtectedRoute requiredRole="admin">
      <AdminRequests />
    </ProtectedRoute>
  }
/>

<Route
  path="/chat"
  element={
    <ProtectedRoute requiredRole="client">
      <Chat />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/chat"
  element={
    <ProtectedRoute requiredRole="admin">
      <AdminChat />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/messages"
  element={
    <ProtectedRoute requiredRole="admin">
      <AdminMessages />
    </ProtectedRoute>
  }
/>

<Route
  path="/messages"
  element={
    <ProtectedRoute requiredRole="client">
      <ClientMessages />
    </ProtectedRoute>
  }
/>

<Route
  path="/notifications"
  element={
    <ProtectedRoute requiredRole="client">
      <Notifications />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/clients"
  element={
    <ProtectedRoute>
      <ClientManagement />
    </ProtectedRoute>
  }
/>

        <Route path="/" element={
    <div className="app">
      {/* Navbar */}
      <nav className="navbar">
        <div className="brand">
          <div className="brand-mark">A</div>
          <div>
            <h2>ABHI EDITZ</h2>
            <span>VIDEO EDITING STUDIO</span>
          </div>
        </div>

        <div className="nav-links">
          <a href="#services">Services</a>
          <a href="#how-it-works">How it works</a>
          <a href="#about">About</a>
        </div>

        <div className="nav-actions">
          <Link to="/login" className="login-btn">Login</Link>
<Link to="/register" className="start-btn">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <main>
        <section className="hero">
          <div className="hero-content">
            <div className="eyebrow">
              <span className="status-dot"></span>
              PROFESSIONAL VIDEO EDITING
            </div>

            <h1>
              Your vision.
              <br />
              <span>Our edit.</span>
            </h1>

            <p className="hero-text">
              Send your footage, tell us what you want, and let ABHI EDITZ
              turn your raw videos into content that stands out.
            </p>

            <div className="hero-actions">
  <Link to="/register" className="primary-btn">
    Start Your Project
  </Link>

  <a href="#services" className="secondary-btn">
  Explore Services
</a>
</div>

            <div className="trust-row">
              <div>
                <strong>Fast</strong>
                <span>Turnaround</span>
              </div>
              <div className="divider"></div>
              <div>
                <strong>Pro</strong>
                <span>Quality</span>
              </div>
              <div className="divider"></div>
              <div>
                <strong>Direct</strong>
                <span>Communication</span>
              </div>
            </div>
          </div>

          {/* Visual */}
          <div className="hero-visual">
            <div className="glow glow-one"></div>
            <div className="glow glow-two"></div>

            <div className="editor-card">
              <div className="card-top">
                <div className="window-dots">
                  <i></i>
                  <i></i>
                  <i></i>
                </div>
                <span>PROJECT_PREVIEW</span>
                <span className="live">● LIVE</span>
              </div>

              <div className="preview">
                <div className="preview-grid"></div>

                <div className="play-button">
                  ▶
                </div>

                <div className="preview-label">
                  <span>ABHI EDITZ</span>
                  <small>CREATIVE STUDIO</small>
                </div>
              </div>

              <div className="timeline">
                <div className="timeline-info">
                  <span>PROJECT_001</span>
                  <span>00:42 / 01:18</span>
                </div>

                <div className="timeline-track">
                  <div className="track-fill"></div>
                  <div className="track-point"></div>
                </div>
              </div>
            </div>

            <div className="floating-card floating-top">
              <span className="floating-icon">✦</span>
              <div>
                <strong>Pro Editing</strong>
                <small>Made for creators</small>
              </div>
            </div>

            <div className="floating-card floating-bottom">
              <span className="check">✓</span>
              <div>
                <strong>Project Ready</strong>
                <small>Final export complete</small>
              </div>
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="services" id="services">
          <div className="section-heading">
            <span>WHAT WE DO</span>
            <h2>Everything your content needs.</h2>
          </div>

          <div className="service-grid">
            <article className="service-card">
              <div className="service-number">01</div>
              <div className="service-icon">▶</div>
              <h3>Short Form</h3>
              <p>
                Reels, Shorts and social content with fast cuts, captions,
                effects and engaging pacing.
              </p>
            </article>

            <article className="service-card featured">
              <div className="service-number">02</div>
              <div className="service-icon">◈</div>
              <h3>Gaming Videos</h3>
              <p>
                High-energy gaming edits with cinematic effects, transitions,
                sound design and highlights.
              </p>
            </article>

            <article className="service-card">
              <div className="service-number">03</div>
              <div className="service-icon">◆</div>
              <h3>Long Form</h3>
              <p>
                YouTube videos, montages and complete edits designed to keep
                viewers watching.
              </p>
            </article>
          </div>
        </section>

        {/* How it works */}
        <section className="workflow" id="how-it-works">
          <div className="section-heading center">
            <span>SIMPLE WORKFLOW</span>
            <h2>From raw footage to final cut.</h2>
          </div>

          <div className="steps">
            <div className="step">
              <div className="step-number">01</div>
              <h3>Send your footage</h3>
              <p>Upload your video and tell us exactly how you want it edited.</p>
            </div>

            <div className="step-line"></div>

            <div className="step">
              <div className="step-number">02</div>
              <h3>We edit it</h3>
              <p>Our editing workflow turns your footage into polished content.</p>
            </div>

            <div className="step-line"></div>

            <div className="step">
              <div className="step-number">03</div>
              <h3>Get your final video</h3>
              <p>Receive the finished video directly through your client dashboard.</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cta" id="about">
          <div>
            <span>READY WHEN YOU ARE</span>
            <h2>Let's create something<br />worth watching.</h2>
          </div>

          <button className="primary-btn">
            Start a Project
            <span>→</span>
          </button>
        </section>
      </main>

      {/* Footer */}
      <footer>
        <div className="brand">
          <div className="brand-mark">A</div>
          <div>
            <h2>ABHI EDITZ</h2>
            <span>VIDEO EDITING STUDIO</span>
          </div>
        </div>

        <p>© 2026 ABHI EDITZ. All rights reserved.</p>

        <a
  href="https://github.com/Abhishek48x"
  target="_blank"
  rel="noopener noreferrer"
>
  GitHub
</a>
      </footer>
    </div>
        } />
      </Routes>
    </BrowserRouter>

  )
}

export default App