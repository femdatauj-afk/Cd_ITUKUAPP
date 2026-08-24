import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';

function contextFor(role?: string): ExecutionContext {
  return {
    getHandler: () => contextFor,
    getClass: () => Roles,
    switchToHttp: () => ({ getRequest: () => ({ user: role ? { role } : undefined }) }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  const reflector = new Reflector();
  const guard = new RolesGuard(reflector);

  beforeAll(() => {
    Reflect.defineMetadata(ROLES_KEY, ['moderator'], contextFor);
  });

  it.each(['moderator', 'admin', 'developer'])('allows %s for moderator scope', (role) => {
    expect(guard.canActivate(contextFor(role))).toBe(true);
  });

  it('denies members outside the moderator scope', () => {
    expect(() => guard.canActivate(contextFor('member'))).toThrow(ForbiddenException);
  });

  it('denies missing roles', () => {
    expect(() => guard.canActivate(contextFor())).toThrow(ForbiddenException);
  });
});