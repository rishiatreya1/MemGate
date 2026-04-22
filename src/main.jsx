import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: '100vh', background: '#030712', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'monospace' }}>
          <div style={{ maxWidth: 600 }}>
            <div style={{ color: '#22d3ee', marginBottom: 8, fontSize: 14 }}>MemGate — startup error</div>
            <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>{this.state.error.message}</div>
            <pre style={{ fontSize: 12, color: '#9ca3af', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{this.state.error.stack}</pre>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)
