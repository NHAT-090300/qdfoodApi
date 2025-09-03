import { Context } from 'api';
import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { EPermission, ERole } from 'interface';
import { AppError } from 'model';

interface AuthorizationOptions {
  role?: ERole;
  permissions?: EPermission[];
  mode?: 'ALL' | 'ANY';
}

export const authorization = (options: AuthorizationOptions) => {
  return (ctx: Context, req: Request, res: Response, next: NextFunction) => {
    try {
      const { role, permissions, mode = 'ALL' } = options;

      if (!req.user || !req.role) {
        return next(
          new AppError({
            id: 'auth.no_user',
            message: 'User not authenticated',
            statusCode: StatusCodes.UNAUTHORIZED,
          }),
        );
      }

      // --- Check role ---
      if (role) {
        const roleHierarchy = [ERole.USER, ERole.ADMIN, ERole.SUPPER];
        const userRoleIndex = roleHierarchy.indexOf(req.role as ERole);
        const requiredRoleIndex = roleHierarchy.indexOf(role);

        if (userRoleIndex < requiredRoleIndex) {
          return next(
            new AppError({
              id: 'auth.role_denied',
              message: 'Không có quyền truy cập (role)',
              statusCode: StatusCodes.FORBIDDEN,
            }),
          );
        }
      }

      // --- Check permissions ---
      const userPermissions: EPermission[] = req.user.permission || [];

      if (permissions && permissions?.length > 0 && !userPermissions?.includes(EPermission.ALL)) {
        const hasAll = permissions?.every((p) => userPermissions?.includes(p));
        const hasAny = permissions?.some((p) => userPermissions?.includes(p));

        const ok = mode === 'ALL' ? hasAll : hasAny;

        if (!ok) {
          return next(
            new AppError({
              id: 'auth.permission_denied',
              message: 'Không có quyền thực hiện hành động này (permission)',
              statusCode: StatusCodes.FORBIDDEN,
            }),
          );
        }
      }

      next();
    } catch (error) {
      return res.status(StatusCodes.FORBIDDEN).json(
        new AppError({
          id: 'auth.denied',
          message: 'Không có quyền truy cập',
          statusCode: StatusCodes.FORBIDDEN,
        }),
      );
    }
  };
};
