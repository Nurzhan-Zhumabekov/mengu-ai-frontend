import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Shield, Users, Building2 } from 'lucide-react'
import { Topbar } from '@/components/layout/Sidebar'
import { Card, Spinner, Badge } from '@/components/ui'
import { organizationService } from '@/services'
import { usersService } from '@/services'
import { formatDate } from '@/utils/helpers'

const TABS = [
  { id: 'users',         label: 'Users',         icon: Users },
  { id: 'organization',  label: 'Organization',  icon: Building2 },
  { id: 'security',      label: 'Security',       icon: Shield },
]

export function AdminPage() {
  const [activeTab, setActiveTab] = useState('users')

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Admin Panel" />

      <div className="flex flex-1 overflow-hidden">
        {/* Tabs sidebar */}
        <div className="w-52 min-w-52 border-r border-gray-100 dark:border-navy-600 py-4 bg-white dark:bg-navy-800 overflow-y-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              type="button"
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors ${
                activeTab === id
                  ? 'text-magenta-600 dark:text-magenta-400 bg-pink-50 dark:bg-pink-500/10 font-medium border-r-2 border-r-magenta-500'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-navy-700'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {activeTab === 'users'         && <UsersTab />}
          {activeTab === 'organization'  && <OrganizationTab />}
          {activeTab === 'security'      && <SecurityTab />}
        </div>
      </div>
    </div>
  )
}

// ─── Users Tab ─────────────────────────────────────────────────────────────

function UsersTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: usersService.list,
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-8"><Spinner /></div>
    )
  }

  if (!data || data.data.length === 0) {
    return (
      <Card title="Users">
        <div className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">No users found.</div>
      </Card>
    )
  }

  return (
    <Card title={`Users (${data.total})`}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-navy-600 text-left text-xs text-gray-500 dark:text-gray-400">
              <th className="pb-2 pr-4 font-medium">Name</th>
              <th className="pb-2 pr-4 font-medium">Email</th>
              <th className="pb-2 pr-4 font-medium">Role</th>
              <th className="pb-2 pr-4 font-medium">Auth Provider</th>
              <th className="pb-2 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {data.data.map((u) => (
              <tr key={u.id} className="border-b border-gray-50 dark:border-navy-700">
                <td className="py-3 pr-4 text-gray-900 dark:text-gray-100">{u.name}</td>
                <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{u.email}</td>
                <td className="py-3 pr-4">
                  {u.role === 'admin' ? (
                    <Badge className="bg-pink-50 dark:bg-pink-500/10 text-magenta-600 dark:text-magenta-400">
                      Admin
                    </Badge>
                  ) : (
                    <span className="text-gray-600 dark:text-gray-400 capitalize">{u.role}</span>
                  )}
                </td>
                <td className="py-3 pr-4 text-gray-600 dark:text-gray-400 capitalize">{u.auth_provider}</td>
                <td className="py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">{formatDate(u.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

// ─── Organization Tab ───────────────────────────────────────────────────────

function OrganizationTab() {
  const { data: org, isLoading } = useQuery({
    queryKey: ['organization'],
    queryFn: organizationService.get,
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-8"><Spinner /></div>
    )
  }

  if (!org) {
    return (
      <Card title="Organization">
        <div className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">No organization data.</div>
      </Card>
    )
  }

  return (
    <div className="space-y-4 max-w-md">
      <Card title="Organization Details">
        <div className="space-y-3">
          <div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Name</div>
            <div className="text-sm text-gray-900 dark:text-gray-100">{org.name}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Slug</div>
            <div className="text-sm text-gray-900 dark:text-gray-100">{org.slug}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Plan</div>
            <div className="text-sm text-gray-900 dark:text-gray-100 capitalize">{org.plan}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Created</div>
            <div className="text-sm text-gray-900 dark:text-gray-100">{formatDate(org.created_at)}</div>
          </div>
        </div>
      </Card>
    </div>
  )
}

// ─── Security Tab ───────────────────────────────────────────────────────────

function SecurityTab() {
  return (
    <div className="space-y-4 max-w-md">
      <Card title="Webhook Secret">
        <div className="flex items-start gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Shield size={16} className="flex-shrink-0 mt-0.5" />
          <span>
            Webhook secret management isn't available yet. Your webhook URLs are secured
            by the organization's API key.
          </span>
        </div>
      </Card>
    </div>
  )
}
