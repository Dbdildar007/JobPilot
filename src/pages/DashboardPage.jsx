import { useQuery } from '@tanstack/react-query'
import { jobs as jobsApi } from '../lib/api'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Briefcase, Send, MessageSquare, TrendingUp, Award, Target, Clock, BarChart2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'

const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b']
const PORTALS = { linkedin: 'LinkedIn', naukri: 'Naukri', naukrigulf: 'NaukriGulf' }

function StatCard({ icon: Icon, label, value, sub, color = 'brand' }) {
  const colors = { brand: 'text-brand-500 bg-brand-900/30', blue: 'text-blue-400 bg-blue-900/30', green: 'text-green-400 bg-green-900/30', amber: 'text-amber-400 bg-amber-900/30' }
  return (
    <div className="card flex items-start gap-4">
      <div className={`p-2.5 rounded-lg ${colors[color]}`}><Icon size={20} /></div>
      <div>
        <p className="text-2xl font-bold text-white">{value ?? '—'}</p>
        <p className="text-sm text-gray-400">{label}</p>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({ queryKey: ['stats'], queryFn: jobsApi.stats })

  if (isLoading) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-400 text-sm">Loading dashboard...</p>
      </div>
    </div>
  )

  const chartData = (stats?.daily || []).slice().reverse().map(d => ({
    date: format(parseISO(d.date), 'MMM d'),
    applied: d.applied,
  }))

  const pieData = (stats?.byPortal || []).map(p => ({ name: PORTALS[p.portal] || p.portal, value: p.count }))

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">Your job application overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Briefcase} label="Total Found" value={stats?.total} color="brand" />
        <StatCard icon={Send} label="Applied" value={stats?.applied} color="blue" />
        <StatCard icon={MessageSquare} label="Interviews" value={stats?.interviews} color="green" />
        <StatCard icon={Award} label="Offers" value={stats?.offers} color="amber" sub={`${stats?.rejected || 0} rejected`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <StatCard icon={TrendingUp} label="Response Rate" value={`${stats?.responseRate || 0}%`} color="green" />
        <StatCard icon={Target} label="Today's Goal" value="40 apps" color="blue" />
        <StatCard icon={BarChart2} label="This Week" value={(stats?.daily || []).slice(0, 7).reduce((a, d) => a + d.applied, 0)} color="brand" sub="applications" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="card lg:col-span-2">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Applications per day (last 30 days)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="applied" stroke="#ef4444" fill="url(#grad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">By portal</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="flex items-center justify-center h-48 text-gray-500 text-sm">No data yet</div>}
          <div className="flex flex-wrap gap-2 mt-2">
            {pieData.map((p, i) => (
              <span key={p.name} className="flex items-center gap-1.5 text-xs text-gray-400">
                <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                {p.name}: {p.value}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Top companies */}
      {stats?.topCompanies?.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Top companies applied to</h3>
          <div className="space-y-2">
            {stats.topCompanies.map((c, i) => (
              <div key={c.company} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-4">{i + 1}</span>
                <span className="flex-1 text-sm text-gray-200">{c.company}</span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 bg-brand-600 rounded-full" style={{ width: `${(c.count / stats.topCompanies[0].count) * 80}px` }} />
                  <span className="text-xs text-gray-400 w-8 text-right">{c.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
