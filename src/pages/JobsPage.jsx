import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { jobs as jobsApi } from '../lib/api'
import { Search, ExternalLink, Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, Trash2, Star } from 'lucide-react'
import { formatDistanceToNow, parseISO } from 'date-fns'
import clsx from 'clsx'

const STATUS_COLORS = {
  found: 'bg-gray-700 text-gray-300',
  applied: 'bg-blue-900/50 text-blue-300',
  skipped: 'bg-gray-800 text-gray-500',
  interview: 'bg-green-900/50 text-green-300',
  offer: 'bg-amber-900/50 text-amber-300',
  rejected: 'bg-red-900/50 text-red-400',
}
const PORTALS = { linkedin: '🔵 LinkedIn', naukri: '🟠 Naukri', naukrigulf: '🟢 Gulf' }
const STATUSES = ['all', 'found', 'applied', 'interview', 'offer', 'rejected', 'skipped']

export default function JobsPage() {
  const qc = useQueryClient()
  const [filters, setFilters] = useState({ status: 'applied', portal: 'all', search: '', page: 1, limit: 25, sortBy: 'applied_at', sortDir: 'desc' })

  const { data, isLoading } = useQuery({
    queryKey: ['jobs', filters],
    queryFn: () => jobsApi.list(filters),
    keepPreviousData: true,
  })

  const update = useMutation({
    mutationFn: ({ id, updates }) => jobsApi.update(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  })
  const remove = useMutation({
    mutationFn: (id) => jobsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  })

  const setF = (k, v) => setFilters(f => ({ ...f, [k]: v, page: 1 }))

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Jobs</h1>
          <p className="text-gray-400 mt-1">{data?.total ?? 0} total jobs tracked</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input className="input pl-9 py-1.5 text-sm" placeholder="Search jobs..."
            value={filters.search} onChange={e => setF('search', e.target.value)} />
        </div>
        <select className="input py-1.5 text-sm w-auto" value={filters.status} onChange={e => setF('status', e.target.value)}>
          {STATUSES.map(s => <option key={s} value={s}>{s === 'all' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <select className="input py-1.5 text-sm w-auto" value={filters.portal} onChange={e => setF('portal', e.target.value)}>
          <option value="all">All Portals</option>
          {Object.entries(PORTALS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="input py-1.5 text-sm w-auto" value={`${filters.sortBy}-${filters.sortDir}`}
          onChange={e => { const [k, d] = e.target.value.split('-'); setFilters(f => ({ ...f, sortBy: k, sortDir: d })); }}>
          <option value="applied_at-desc">Applied (Newest)</option>
          <option value="created_at-desc">Found (Newest)</option>
          <option value="match_score-desc">Best Match</option>
          <option value="company-asc">Company A-Z</option>
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-dark-600">
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                {['Job', 'Company', 'Portal', 'Score', 'Status', 'Response', 'Applied', ''].map(h => (
                  <th key={h} className="px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {isLoading ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-500">Loading...</td></tr>
              ) : data?.jobs?.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-500">No jobs found. Run the bot to start applying!</td></tr>
              ) : data?.jobs?.map(job => (
                <tr key={job.id} className="hover:bg-dark-700/50 transition-colors group">
                  <td className="px-4 py-3 max-w-xs">
                    <p className="text-white font-medium truncate">{job.title}</p>
                    {job.location && <p className="text-xs text-gray-500 truncate">{job.location}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-300">{job.company}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{PORTALS[job.portal] || job.portal}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Star size={11} className={job.match_score >= 70 ? 'text-amber-400' : 'text-gray-600'} fill={job.match_score >= 70 ? 'currentColor' : 'none'} />
                      <span className={clsx('text-xs font-medium', job.match_score >= 70 ? 'text-amber-400' : job.match_score >= 40 ? 'text-gray-300' : 'text-gray-600')}>
                        {job.match_score}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={clsx('badge text-xs', STATUS_COLORS[job.status] || STATUS_COLORS.found)}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {job.status === 'applied' && (
                      <select className="bg-dark-700 border border-dark-500 text-xs text-gray-300 rounded px-2 py-1"
                        value={job.response_type || ''}
                        onChange={e => update.mutate({ id: job.id, updates: { response_type: e.target.value, status: e.target.value || 'applied' } })}>
                        <option value="">Waiting</option>
                        <option value="interview">Interview</option>
                        <option value="offer">Offer</option>
                        <option value="rejected">Rejected</option>
                        <option value="ghosted">Ghosted</option>
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {job.applied_at ? formatDistanceToNow(parseISO(job.applied_at), { addSuffix: true }) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {job.url && (
                        <a href={job.url} target="_blank" rel="noreferrer" className="btn-ghost p-1.5 text-gray-400 hover:text-blue-400" title="Open job">
                          <ExternalLink size={14} />
                        </a>
                      )}
                      <button className="btn-ghost p-1.5" title="Bookmark"
                        onClick={() => update.mutate({ id: job.id, updates: { is_bookmarked: job.is_bookmarked ? 0 : 1 } })}>
                        {job.is_bookmarked ? <BookmarkCheck size={14} className="text-amber-400" /> : <Bookmark size={14} className="text-gray-400" />}
                      </button>
                      <button className="btn-ghost p-1.5 text-gray-400 hover:text-red-400" title="Delete"
                        onClick={() => { if (confirm('Remove this job?')) remove.mutate(job.id) }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-dark-600">
            <span className="text-xs text-gray-500">Page {data.page} of {data.pages}</span>
            <div className="flex gap-2">
              <button className="btn-secondary py-1 px-2 text-xs flex items-center gap-1" disabled={filters.page <= 1}
                onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}>
                <ChevronLeft size={13} /> Prev
              </button>
              <button className="btn-secondary py-1 px-2 text-xs flex items-center gap-1" disabled={filters.page >= data.pages}
                onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}>
                Next <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
