export const ROLES = [
  'super_admin',
  'league_owner',
  'team_owner',
  'coach',
  'moderator',
  'camera_operator',
  'commentator',
  'viewer',
  'sponsor',
] as const;

export type UserRole = (typeof ROLES)[number];
export type AccountStatus = 'draft' | 'pending_verification' | 'pending_payment' | 'pending_approval' | 'changes_requested' | 'approved' | 'rejected' | 'suspended';

export const roleLabels: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  league_owner: 'League Owner',
  team_owner: 'Team Owner',
  coach: 'Coach',
  moderator: 'Moderator',
  camera_operator: 'Camera Operator',
  commentator: 'Commentator',
  viewer: 'Viewer / Fan',
  sponsor: 'Sponsor / Advertiser',
};

export const roleDashboards = {
  super_admin: '/admin',
  league_owner: '/dashboard/league',
  team_owner: '/dashboard/team',
  coach: '/dashboard/coach',
  moderator: '/dashboard/moderator',
  camera_operator: '/dashboard/camera',
  commentator: '/dashboard/commentator',
  viewer: '/dashboard/viewer',
  sponsor: '/dashboard/sponsor',
} as const;

export const inviteOnlyRoles: UserRole[] = ['moderator', 'camera_operator', 'commentator'];
export const publicSignupRoles: UserRole[] = ['league_owner', 'team_owner', 'coach', 'viewer', 'sponsor'];

export function dashboardForRole(role?: UserRole | null) {
  return role ? roleDashboards[role] : '/auth';
}
