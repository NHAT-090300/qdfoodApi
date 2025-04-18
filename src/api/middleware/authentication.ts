import { Context } from 'api';
import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ERole } from 'interface';

import { AppError } from 'model';
import { verifyAccessToken } from '@utils/index';
import to from 'await-to-js';
import { UserApp } from 'app';

declare module 'express' {
  export interface Request {
    user?: any;
    role?: string;
  }
}

export const authentication = (type: ERole) => {
  const middleware = async (ctx: Context, req: Request, res: Response, next: NextFunction) => {
    try {
      const authorization = req.headers.authorization as string;

      if (!authorization) {
        return next(
          new AppError({
            id: 'middleware.authentication',
            message: 'Phiên đăng nhập hết hạn',
            statusCode: StatusCodes.UNAUTHORIZED,
          }),
        );
      }

      if (type !== ERole?.SUPPER && type !== ERole?.ADMIN && type !== ERole?.USER) {
        return next(
          new AppError({
            id: 'access_token.verify',
            message: 'Invalid role',
            statusCode: StatusCodes.BAD_REQUEST,
          }),
        );
      }

      const token = authorization.split(' ')[1];
      const [error, result] = await to(verifyAccessToken(token));

      if (error) {
        return next(
          new AppError({
            id: 'access_token.verify',
            message: 'Phiên đăng nhập hết hạn',
            statusCode: StatusCodes.UNAUTHORIZED,
          }),
        );
      }

      const user = await new UserApp(ctx).getById(result?.id);

      if (user?.isDelete) {
        return next(
          new AppError({
            id: 'middleware.authentication',
            message: 'Invalid user',
            statusCode: StatusCodes.UNAUTHORIZED,
          }),
        );
      }

      if ((type === ERole?.ADMIN || type === ERole?.SUPPER) && user?.role === ERole.USER) {
        return next(
          new AppError({
            id: 'access_token.verify',
            message: 'Insufficient User Permissions',
            statusCode: StatusCodes.FORBIDDEN,
          }),
        );
      }

      req.user = user;
      req.role = user?.role;

      next();
    } catch (error) {
      return res.status(StatusCodes.UNAUTHORIZED).json(
        new AppError({
          id: 'middleware.authentication',
          message: 'Invalid user',
          statusCode: StatusCodes.UNAUTHORIZED,
        }),
      );
    }
  };

  return middleware;
};
