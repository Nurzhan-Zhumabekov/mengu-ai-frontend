import { useAuthStore } from '@/store'
import type { Role } from '@/types'

export function useRole() {
  const { user } = useAuthStore()
  const role = user?.role as Role | undefined

  return {
    isAdmin: role === 'admin',
    isManager: role === 'manager',
    isEmployee: role === 'employee',
    isViewer: role === 'viewer',
    role,
    
    // Helper to check if user has at least the required role level
    // Admin > Manager > Employee > Viewer
    hasMinRole: (minRole: Role) => {
      if (!role) return false;
      const levels: Record<Role, number> = {
        admin: 4,
        manager: 3,
        employee: 2,
        viewer: 1
      };
      return levels[role] >= levels[minRole];
    }
  }
}
