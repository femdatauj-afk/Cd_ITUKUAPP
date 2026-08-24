import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = any>(
    error: unknown,
    user: TUser,
    _info: unknown,
    _context: ExecutionContext,
  ): TUser | null {
    if (error || !user) return null;
    return user;
  }
}
