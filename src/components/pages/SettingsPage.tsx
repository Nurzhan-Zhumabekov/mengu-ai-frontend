import { useState, useEffect } from 'react'
import { Shield, Bell, Plug, Users, CreditCard, CheckCircle, Mail, Calendar, MessageSquare, BookOpen, Database, GraduationCap, BarChart2 } from 'lucide-react'
import { Topbar } from '@/components/layout/Sidebar'
import { Card, Spinner } from '@/components/ui'
import { toast } from '@/components/ui/toast'
import { useAuthStore } from '@/store'

const TABS = [
  { id: 'profile',      label: 'Profile',      icon: Users },
  { id: 'integrations', label: 'Integrations',   icon: Plug },
  { id: 'notifications',label: 'Notifications',  icon: Bell },
  { id: 'security',     label: 'Security', icon: Shield },
  { id: 'billing',      label: 'Billing',     icon: CreditCard },
]

interface Integration { name: string; desc: string; status: 'connected' | 'disconnected'; icon: React.ReactNode }

const INTEGRATIONS: Integration[] = [
  { name: 'Gmail',           desc: 'Inbound email processing',        status: 'connected',    icon: <Mail size={20} /> },
  { name: 'Google Calendar', desc: 'Automatic meeting creation',       status: 'disconnected', icon: <Calendar size={20} /> },
  { name: 'Microsoft Outlook',desc: 'Corporate email',                status: 'disconnected', icon: <Mail size={20} /> },
  { name: 'Slack',           desc: 'Channel notifications',           status: 'disconnected', icon: <MessageSquare size={20} /> },
  { name: 'Notion',          desc: 'Knowledge base for RAG',          status: 'disconnected', icon: <BookOpen size={20} /> },
  { name: '1C:Enterprise',   desc: 'Document flow & finance',         status: 'disconnected', icon: <Database size={20} /> },
  { name: 'Platonus',        desc: 'Educational platform (KZ)',        status: 'disconnected', icon: <GraduationCap size={20} /> },
  { name: 'Bitrix24',        desc: 'CRM and tasks',                   status: 'disconnected', icon: <BarChart2 size={20} /> },
]

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const { user } = useAuthStore()

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Settings" />

      <div className="flex flex-1 overflow-hidden">
        {/* Tabs sidebar */}
        <div className="w-52 min-w-52 border-r border-gray-100 py-4 bg-white overflow-y-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors ${
                activeTab === id
                  ? 'text-magenta-600 bg-pink-50 font-medium border-r-2 border-r-magenta-500'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {activeTab === 'profile' && <ProfileTab user={user} />}
          {activeTab === 'integrations' && <IntegrationsTab />}
          {activeTab === 'notifications' && <NotificationsTab />}
          {activeTab === 'security' && <SecurityTab />}
          {activeTab === 'billing' && <BillingTab />}
        </div>
      </div>
    </div>
  )
}

// ─── Profile Tab ──────────────────────────────────────────────────────────────

function ProfileTab({ user }: { user: { full_name: string; email: string; role: string; department: string } | null }) {
  const updateUser = useAuthStore((s) => s.updateUser)
  const [saving, setSaving] = useState(false)

  const [fullName, setFullName] = useState(user?.full_name ?? '')
  const [department, setDepartment] = useState(user?.department ?? '')
  const [language, setLanguage] = useState('en')
  const [replyStyle, setReplyStyle] = useState('formal')

  useEffect(() => {
    if (user) {
      setFullName(user.full_name)
      setDepartment(user.department)
    }
  }, [user])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await new Promise((r) => setTimeout(r, 400))
    updateUser({ full_name: fullName, department })
    setSaving(false)
    toast('Profile saved', 'success')
  }

  return (
    <Card title="User Profile">
      <form onSubmit={handleSave} className="space-y-4 max-w-md">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Full Name</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Email</label>
          <input value={user?.email ?? ''} className="input-field" disabled />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Department</label>
          <input
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Role</label>
          <div className="input-field bg-gray-50 text-gray-500 cursor-not-allowed">
            {user?.role}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Interface Language</label>
          <select value={language} onChange={(e) => setLanguage(e.target.value)} className="input-field">
            <option value="en">English</option>
            <option value="ru">Russian</option>
            <option value="kk">Kazakh</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">AI Reply Style</label>
          <select value={replyStyle} onChange={(e) => setReplyStyle(e.target.value)} className="input-field">
            <option value="formal">Formal</option>
            <option value="neutral">Neutral</option>
            <option value="friendly">Friendly</option>
          </select>
        </div>
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? <Spinner className="text-white w-4 h-4" /> : <CheckCircle size={14} />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </Card>
  )
}

// ─── Integrations Tab ─────────────────────────────────────────────────────────

function IntegrationsTab() {
  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-600 mb-4">
        Connect services for automatic event and data processing
      </div>
      {INTEGRATIONS.map((intg) => (
        <div
          key={intg.name}
          className="flex items-center gap-4 bg-white border border-gray-100 rounded-lg px-4 py-3.5"
        >
          <div className="w-10 h-10 rounded-lg bg-pink-50 flex items-center justify-center flex-shrink-0 text-magenta-500">
            {intg.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900">{intg.name}</div>
            <div className="text-xs text-gray-500">{intg.desc}</div>
          </div>
          {intg.status === 'connected' ? (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs text-emerald-600">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Connected
              </span>
              <button className="text-xs text-gray-400 hover:text-red-500 transition-colors">
                Disconnect
              </button>
            </div>
          ) : (
            <button className="btn-primary text-xs py-1.5 px-3">
              Connect
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Notifications Tab ────────────────────────────────────────────────────────

function NotificationsTab() {
  const channels = [
    { label: 'Email Notifications', desc: 'Critical events and digest' },
    { label: 'Browser Push', desc: 'New tasks and insights' },
    { label: 'Slack Notifications', desc: 'Requires Slack integration' },
  ]
  return (
    <Card title="Notification Channels">
      <div className="space-y-4 max-w-md">
        {channels.map((ch) => (
          <div key={ch.label} className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">{ch.label}</div>
              <div className="text-xs text-gray-500">{ch.desc}</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-magenta-500" />
            </label>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ─── Security Tab ─────────────────────────────────────────────────────────────

function SecurityTab() {
  return (
    <div className="space-y-4 max-w-md">
      <Card title="Change Password">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Current Password</label>
            <input type="password" className="input-field" placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">New Password</label>
            <input type="password" className="input-field" placeholder="Minimum 8 characters" />
          </div>
          <button className="btn-primary">Change Password</button>
        </div>
      </Card>
      <Card title="Two-Factor Authentication">
        <p className="text-sm text-gray-600 mb-3">
          Add an extra layer of security via Google Authenticator or SMS
        </p>
        <button className="btn-secondary">Enable 2FA</button>
      </Card>
      <Card title="Active Sessions">
        <div className="space-y-2.5">
          {[
            { device: 'Chrome \u2014 Almaty, KZ', time: 'Now', current: true },
            { device: 'Mobile Safari \u2014 iPhone 15', time: '2 hours ago', current: false },
          ].map((s, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <div>
                <div className="text-gray-900">{s.device}</div>
                <div className="text-xs text-gray-400">{s.time}</div>
              </div>
              {s.current ? (
                <span className="text-xs text-emerald-600 font-medium">Current</span>
              ) : (
                <button className="text-xs text-red-500 hover:underline">Terminate</button>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ─── Billing Tab ──────────────────────────────────────────────────────────────

function BillingTab() {
  return (
    <div className="space-y-4">
      <Card title="Current Plan">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-medium text-gray-900 mb-1">Professional</div>
            <div className="text-sm text-gray-500">$99 / month \u00B7 5 users \u00B7 SLA 99.9%</div>
          </div>
          <button className="btn-primary">Upgrade to Enterprise</button>
        </div>
      </Card>
      <Card title="Payment History">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-xs text-gray-500 font-medium pb-2">Date</th>
              <th className="text-left text-xs text-gray-500 font-medium pb-2">Description</th>
              <th className="text-right text-xs text-gray-500 font-medium pb-2">Amount</th>
              <th className="text-right text-xs text-gray-500 font-medium pb-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {[
              { date: 'June 1, 2026', desc: 'Professional \u2014 June', amount: '$99', paid: true },
              { date: 'May 1, 2026',  desc: 'Professional \u2014 May',  amount: '$99', paid: true },
              { date: 'Apr 1, 2026',  desc: 'Professional \u2014 April', amount: '$99', paid: true },
            ].map((r, i) => (
              <tr key={i}>
                <td className="py-2 text-gray-600">{r.date}</td>
                <td className="py-2 text-gray-700">{r.desc}</td>
                <td className="py-2 text-right font-medium">{r.amount}</td>
                <td className="py-2 text-right">
                  <span className="status-approved">Paid</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
