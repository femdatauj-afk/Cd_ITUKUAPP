export type UserRole = 'member' | 'moderator' | 'admin' | 'developer';

const roleRank: Record<UserRole, number> = {
  member: 0,
  moderator: 1,
  admin: 2,
  developer: 3,
};

export function hasRequiredRole(userRole: string | undefined, requiredRoles: string[]) {
  if (!userRole || requiredRoles.length === 0) return false;

  const actualRank = roleRank[userRole as UserRole];
  if (actualRank === undefined) return false;

  return requiredRoles.some((requiredRole) => {
    const requiredRank = roleRank[requiredRole as UserRole];
    return requiredRank !== undefined && actualRank >= requiredRank;
  });
}