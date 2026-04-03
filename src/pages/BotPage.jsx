import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bot as botApi } from '../lib/api'
import { Play, Square, RefreshCw, CheckCircle, XCircle, Clock, Zap, AlertTriangle } from 'lucide-react'
import { formatDistanceToNow, parseISO, format } from 'date-fns'
import clsx from 'clsx'

const PORTALS = [
  { key: 'linkedin', name: 'LinkedIn', icon: '🔵', limit: '~40/day', color: 'blue' },
  { key: 'naukri', name: 'Naukri', icon: '🟠', limit: '~100/day', color: 'orange' },
  { key: 'naukrigulf', name: 'NaukriGulf', icon: '🟢', limit: '~80/day', color: 'green' },
]

function PortalCard({ portal, status, onRun }) {
  const last = status?.lastSession
  const running = status?.running

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{portal.icon}</span>
          <div>
            <h3 className="font-semibold text-white">{portal.name}</h3>
            <p className="text-xs text-gray-500">{portal.limit} capacity</p>
          </div>
        </div>
        <div className={clsx('w-2.5 h-2.5 rounded-full mt-1', running ? 'bg-green-400 animate-pulse' : 'bg-gray-600')} />
      </div>

      {last && (
        <div className="bg-dark-700 rounded-lg p-3 mb-4 text-xs space-y-1.5">
          <div className="flex justify-between text-gray-400">
            <span>Last run</span>
            <span>{last.started_at ? formatDistanceToNow(parseISO(last.started_at), { addSuffix: true }) : '—'}</span>
          </div>
          <div className="flex gap-4">
            <span className="text-green-400">✓ {last.total_applied} applied</span>
            <span className="text-gray-500">↷ {last.total_skipped} skipped</span>
            {last.total_failed > 0 && <span className="text-red-400">✗ {last.total_failed} failed</span>}
          </div>
          <div className="flex justify-between text-gray-500">
            <span className={clsx('font-medium', last.status === 'completed' ? 'text-green-400' : last.status === 'running' ? 'text-amber-400' : 'text-red-400')}>
              {last.status}
            </span>
            {last.duration_seconds && <span>{Math.round(last.duration_seconds / 60)}m {last.duration_seconds % 60}s</span>}
          </div>
        </div>
      )}

      <button className={clsx('w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all',
        running ? 'bg-dark-600 text-gray-400 cursor-not-allowed' : 'bg-brand-600 hover:bg-brand-700 text-white')}
        onClick={() => !running && onRun(portal.key)} disabled={running}>
        {running ? <><RefreshCw size={14} className="animate-spin" /> Running...</> : <><Play size={14} fill="currentColor" /> Start Bot</>}
      </button>
    </div>
  )
}

export default function BotPage() {
  const qc = useQueryClient()
  const [selectedSession, setSelectedSession] = useState(null)
  const [runMsg, setRunMsg] = useState('')

  const { data: status, refetch: refetchStatus } = useQuery({
    queryKey: ['bot-status'],
    queryFn: botApi.status,
    refetchInterval: 3000,
  })

  const { data: sessions } = useQuery({ queryKey: ['bot-sessions'], queryFn: botApi.sessions, refetchInterval: 5000 })
  const { data: logs } = useQuery({
    queryKey: ['session-logs', selectedSession],
    queryFn: () => botApi.sessionLogs(selectedSession),
    enabled: !!selectedSession,
    refetchInterval: selectedSession ? 2000 : false,
  })

  const runMutation = useMutation({
    mutationFn: (portal) => botApi.run(portal),
    onSuccess: (_, portal) => {
      setRunMsg(`Bot started for ${portal}. Check sessions below.`)
      setTimeout(() => setRunMsg(''), 4000)
      qc.invalidateQueries({ queryKey: ['bot-status'] })
    },
  })

  const isAnyRunning = Object.values(status || {}).some(s => s.running)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Bot Control</h1>
          <p className="text-gray-400 mt-1">Manage automated job applications</p>
        </div>
        <button className="btn-primary flex items-center gap-2"
          onClick={() => runMutation.mutate('all')} disabled={isAnyRunning || runMutation.isPending}>
          <Zap size={15} /> Run All Portals
        </button>
      </div>

      {runMsg && (
        <div className="bg-green-900/30 border border-green-700 text-green-300 px-4 py-3 rounded-lg text-sm mb-4 flex items-center gap-2">
          <CheckCircle size={15} /> {runMsg}
        </div>
      )}

      {/* Warning */}
      <div className="bg-amber-900/20 border border-amber-800 text-amber-300 px-4 py-3 rounded-lg text-sm mb-6 flex items-start gap-2">
        <AlertTriangle size={15} className="mt-0.5 shrink-0" />
        <span>Bot runs in background. Do not close the server. LinkedIn may require manual 2FA verification on first login. Check logs if bot fails.</span>
      </div>

      {/* Portal cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {PORTALS.map(p => (
          <PortalCard key={p.key} portal={p} status={status?.[p.key]} onRun={runMutation.mutate} />
        ))}
      </div>

      {/* Sessions log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><Clock size={16} /> Recent Sessions</h3>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {(sessions || []).map(s => (
              <button key={s.id} onClick={() => setSelectedSession(s.id)}
                className={clsx('w-full text-left px-3 py-2.5 rounded-lg text-xs transition-all border',
                  selectedSession === s.id ? 'bg-brand-900/30 border-brand-700' : 'bg-dark-700 border-dark-600 hover:border-dark-500')}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-200 capitalize">{s.portal}</span>
                  <span className={clsx('badge', s.status === 'completed' ? 'bg-green-900/50 text-green-400' : s.status === 'running' ? 'bg-amber-900/50 text-amber-400' : 'bg-red-900/50 text-red-400')}>
                    {s.status}
                  </span>
                </div>
                <div className="flex gap-3 text-gray-500">
                  <span>✓ {s.total_applied}</span>
                  <span>↷ {s.total_skipped}</span>
                  <span className="ml-auto">{s.started_at ? format(parseISO(s.started_at), 'MMM d, HH:mm') : ''}</span>
                </div>
              </button>
            ))}
            {(!sessions || sessions.length === 0) && <p className="text-gray-500 text-sm py-4 text-center">No sessions yet. Run a bot!</p>}
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-white mb-3">Session Logs {selectedSession && <span className="text-xs text-gray-500 ml-1">(live)</span>}</h3>
          <div className="bg-dark-900 rounded-lg p-3 h-72 overflow-y-auto font-mono text-xs space-y-0.5">
            {!selectedSession && <p className="text-gray-600">← Select a session to view logs</p>}
            {logs?.logs?.map(log => (
              <div key={log.id} className={clsx('flex gap-2', log.level === 'error' ? 'text-red-400' : log.level === 'warn' ? 'text-amber-400' : 'text-gray-400')}>
                <span className="text-gray-600 shrink-0">{format(parseISO(log.created_at), 'HH:mm:ss')}</span>
                <span>{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
