import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { profile as profileApi } from '../lib/api'
import { Save, Eye, EyeOff, CheckCircle, Loader2 } from 'lucide-react'

const PORTALS = ['linkedin', 'naukri', 'naukrigulf']
const PORTAL_LABELS = { linkedin: 'LinkedIn', naukri: 'Naukri', naukrigulf: 'NaukriGulf' }
const CRON_PRESETS = [
  { label: 'Twice daily (9am & 2pm)', value: '0 9,14 * * 1-5' },
  { label: 'Morning only (9am)', value: '0 9 * * 1-5' },
  { label: 'Three times daily', value: '0 9,13,17 * * 1-5' },
  { label: 'Weekdays at 10am', value: '0 10 * * 1-5' },
  { label: 'Custom', value: 'custom' },
]

function Section({ title, children }) {
  return (
    <div className="card mb-4">
      <h3 className="font-semibold text-white text-sm mb-4 pb-3 border-b border-dark-600">{title}</h3>
      {children}
    </div>
  )
}

export default function SettingsPage() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['profile'], queryFn: profileApi.get })
  const [profile, setProfile] = useState({})
  const [creds, setCreds] = useState({ linkedin: { email: '', password: '' }, naukri: { email: '', password: '' }, naukrigulf: { email: '', password: '' } })
  const [showPw, setShowPw] = useState({})
  const [saved, setSaved] = useState('')

  useEffect(() => {
    if (data?.profile) {
      const p = data.profile
      setProfile({
        title: p.title || '', summary: p.summary || '', location: p.location || '',
        experience_years: p.experience_years || 0, notice_period: p.notice_period || '30 days',
        skills: Array.isArray(p.skills) ? p.skills.join(', ') : p.skills ? JSON.parse(p.skills || '[]').join(', ') : '',
        preferred_roles: Array.isArray(p.preferred_roles) ? p.preferred_roles.join(', ') : p.preferred_roles ? JSON.parse(p.preferred_roles || '[]').join(', ') : '',
        keywords_exclude: Array.isArray(p.keywords_exclude) ? p.keywords_exclude.join(', ') : p.keywords_exclude ? JSON.parse(p.keywords_exclude || '[]').join(', ') : '',
        preferred_companies_blacklist: Array.isArray(p.preferred_companies_blacklist) ? p.preferred_companies_blacklist.join(', ') : p.preferred_companies_blacklist ? JSON.parse(p.preferred_companies_blacklist || '[]').join(', ') : '',
        salary_min: p.salary_min || '', salary_max: p.salary_max || '',
      })
    }
    if (data?.credentials) {
      data.credentials.forEach(c => { setCreds(prev => ({ ...prev, [c.portal]: { email: c.email, password: '' } })) })
    }
  }, [data])

  const toArray = (str) => str.split(',').map(s => s.trim()).filter(Boolean)

  const saveProfile = useMutation({
    mutationFn: () => profileApi.update({
      ...profile,
      skills: JSON.stringify(toArray(profile.skills)),
      preferred_roles: JSON.stringify(toArray(profile.preferred_roles)),
      keywords_exclude: JSON.stringify(toArray(profile.keywords_exclude)),
      preferred_companies_blacklist: JSON.stringify(toArray(profile.preferred_companies_blacklist)),
      experience_years: parseInt(profile.experience_years) || 0,
    }),
    onSuccess: () => { setSaved('profile'); setTimeout(() => setSaved(''), 3000) },
  })

  const saveCreds = useMutation({
    mutationFn: ({ portal, email, password }) => profileApi.setCredentials({ portal, email, password }),
    onSuccess: (_, { portal }) => { setSaved(`cred-${portal}`); setTimeout(() => setSaved(''), 3000) },
  })

  const p = (k) => e => setProfile(prev => ({ ...prev, [k]: e.target.value }))
  const c = (portal, k) => e => setCreds(prev => ({ ...prev, [portal]: { ...prev[portal], [k]: e.target.value } }))

  if (isLoading) return <div className="flex items-center justify-center h-full"><div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-1">Configure your profile, portals, and schedule</p>
      </div>

      {/* Profile */}
      <Section title="Your Profile">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {[['title','Job Title','Software Developer'],['location','Location','Hyderabad'],['experience_years','Experience (years)','2'],['notice_period','Notice Period','30 days'],['salary_min','Min Salary (LPA)',''],['salary_max','Max Salary (LPA)','']].map(([k,l,ph]) => (
            <div key={k}>
              <label className="block text-xs font-medium text-gray-400 mb-1">{l}</label>
              <input className="input text-sm py-2" placeholder={ph} value={profile[k] || ''} onChange={p(k)} />
            </div>
          ))}
        </div>
        {[['skills','Skills (comma-separated)','React, Node.js, Python, SQL'],['preferred_roles','Target Roles','Software Developer, Frontend Developer'],['keywords_exclude','Exclude Keywords','intern, unpaid, fresher, 0-1 years'],['preferred_companies_blacklist','Blacklist Companies','']].map(([k,l,ph]) => (
          <div key={k} className="mb-3">
            <label className="block text-xs font-medium text-gray-400 mb-1">{l}</label>
            <input className="input text-sm py-2" placeholder={ph} value={profile[k] || ''} onChange={p(k)} />
          </div>
        ))}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-400 mb-1">Summary / Headline</label>
          <textarea className="input text-sm py-2 resize-none h-20" placeholder="Brief professional summary..." value={profile.summary || ''} onChange={p('summary')} />
        </div>
        <button className="btn-primary flex items-center gap-2 text-sm" onClick={() => saveProfile.mutate()} disabled={saveProfile.isPending}>
          {saveProfile.isPending ? <Loader2 size={14} className="animate-spin" /> : saved === 'profile' ? <CheckCircle size={14} /> : <Save size={14} />}
          {saved === 'profile' ? 'Saved!' : 'Save Profile'}
        </button>
      </Section>

      {/* Portal credentials */}
      <Section title="Portal Credentials">
        <p className="text-xs text-gray-500 mb-4">Passwords are encrypted at rest. Leave password blank to keep existing.</p>
        <div className="space-y-4">
          {PORTALS.map(portal => (
            <div key={portal} className="bg-dark-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-200">{PORTAL_LABELS[portal]}</h4>
                {data?.credentials?.find(c => c.portal === portal)?.login_status === 'success' && (
                  <span className="badge bg-green-900/50 text-green-400 text-xs">Connected</span>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input className="input text-sm py-2" type="email" placeholder="Email" value={creds[portal].email} onChange={c(portal, 'email')} />
                <div className="relative">
                  <input className="input text-sm py-2 pr-9" type={showPw[portal] ? 'text' : 'password'} placeholder="Password (leave blank to keep)" value={creds[portal].password} onChange={c(portal, 'password')} />
                  <button className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300" onClick={() => setShowPw(p => ({ ...p, [portal]: !p[portal] }))}>
                    {showPw[portal] ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <button className="btn-secondary mt-3 text-xs flex items-center gap-1.5"
                onClick={() => saveCreds.mutate({ portal, email: creds[portal].email, password: creds[portal].password })}
                disabled={!creds[portal].email || !creds[portal].password}>
                {saved === `cred-${portal}` ? <><CheckCircle size={12} /> Saved!</> : <><Save size={12} /> Save {PORTAL_LABELS[portal]}</>}
              </button>
            </div>
          ))}
        </div>
      </Section>

      {/* AI Settings */}
      <Section title="AI Settings">
        <p className="text-xs text-gray-500 mb-3">Used for generating cover letters. Set in <code className="bg-dark-700 px-1 rounded">.env</code> file.</p>
        <div className="bg-dark-700 rounded-lg p-4 text-xs font-mono text-gray-400 space-y-1">
          <p>AI_PROVIDER=ollama <span className="text-gray-600"># ollama | openai | none</span></p>
          <p>OLLAMA_URL=http://localhost:11434</p>
          <p>OPENAI_API_KEY=sk-... <span className="text-gray-600"># optional</span></p>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          For free local AI: <a href="https://ollama.ai" target="_blank" rel="noreferrer" className="text-brand-500 hover:text-brand-400">Install Ollama</a> → run <code className="bg-dark-700 px-1 rounded">ollama pull llama3.1</code>
        </p>
      </Section>
    </div>
  )
}
