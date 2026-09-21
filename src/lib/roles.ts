export const ROLES = [
  'super_admin',
  'league_owner',
  'team_owner',
  'coach',
  'general_moderator',
  'moderator',
  'assistant_moderator',
  'camera_operator',
  'commentator',
  'analyst',
  'statistician',
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
  general_moderator: 'General Moderator',
  moderator: 'Moderator',
  assistant_moderator: 'Assistant Moderator',
  camera_operator: 'Camera Operator',
  commentator: 'Commentator',
  analyst: 'Analyst',
  statistician: 'Statistician',
  viewer: 'Viewer / Fan',
  sponsor: 'Sponsor / Advertiser',
};

export const roleDashboards = {
  super_admin: '/admin',
  league_owner: '/dashboard/league',
  team_owner: '/dashboard/team',
  coach: '/dashboard/coach',
  general_moderator: '/dashboard/moderator',
  moderator: '/dashboard/moderator',
  assistant_moderator: '/dashboard/moderator',
  camera_operator: '/dashboard/camera',
  commentator: '/dashboard/commentator',
  analyst: '/dashboard/moderator',
  statistician: '/dashboard/moderator',
  viewer: '/dashboard/viewer',
  sponsor: '/dashboard/sponsor',
} as const;

export const inviteOnlyRoles: UserRole[] = [
  'general_moderator',
  'moderator',
  'assistant_moderator',
  'camera_operator',
  'commentator',
  'analyst',
  'statistician',
  'coach',
];
export const publicSignupRoles: UserRole[] = ['league_owner', 'team_owner', 'viewer', 'sponsor'];

export function dashboardForRole(role?: UserRole | null) {
  return role ? roleDashboards[role] : '/auth';
}
