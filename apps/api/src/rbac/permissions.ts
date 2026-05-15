export const Permissions = {
  PollRead: 'poll:read',
  PollWrite: 'poll:write',
  AdminUserRead: 'admin_user:read',
  AdminUserWrite: 'admin_user:write',
  ClassVote: 'class:vote',
  ClassStats: 'class:stats',
  AnnouncementWrite: 'announcement:write',
  WallpaperWrite: 'wallpaper:write',
  SettingsWrite: 'settings:write',
} as const;

export type PermissionKey = (typeof Permissions)[keyof typeof Permissions];

