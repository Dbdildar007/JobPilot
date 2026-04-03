import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { auth } from '../lib/api'
import { useAuth } from '../store/auth'
import { Zap, Loader2 } from 'lucide-react'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await auth.register(form)
      login(res.user, res.token)
      navigate('/settings')
    } catch (err) {
      setError(err.error || 'Registration failed')
    } finally { setLoading(false) }
  }

  const f = (k) => e => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-600 mb-4">
            <Zap size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
          <p className="text-gray-400 mt-1">Start automating your job search</p>
        </div>
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-red-900/30 border border-red-700 text-red-300 px-3 py-2 rounded-lg text-sm">{error}</div>}
            {[['name','Full Name','Your name'],['email','Email','you@example.com'],['password','Password','••••••••']].map(([k,l,p]) => (
              <div key={k}>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">{l}</label>
                <input className="input" type={k==='password'?'password':k==='email'?'email':'text'} placeholder={p} value={form[k]} onChange={f(k)} required />
              </div>
            ))}
            <button className="btn-primary w-full py-2.5 flex items-center justify-center gap-2" disabled={loading}>
              {loading ? <><Loader2 size={16} className="animate-spin" />Creating...</> : 'Create Account'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-4">
            Have an account? <Link to="/login" className="text-brand-500 hover:text-brand-400">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
