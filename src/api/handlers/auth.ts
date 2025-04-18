import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { compare } from 'bcrypt';

import { Context } from 'api';
import { UserApp } from 'app';
import { AppError } from 'model';
import { generateJWT } from 'utils';
import { ERole } from 'interface';

const where = 'Handlers.user';

export async function login(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email, password } = req.body;
    const user = await new UserApp(ctx).getByEmail(email);

    let isValidPass;
    if (user) {
      isValidPass = await compare(password, user?.password);
    }

    if (user?.role === ERole.USER) {
      throw new AppError({
        id: `${where}.login`,
        message: 'Insufficient User Permissions',
        statusCode: StatusCodes.FORBIDDEN,
      });
    }

    // CHECK FOR USER VERIFIED AND EXISTING
    if (!user || !isValidPass) {
      throw new AppError({
        id: `${where}.login`,
        message: 'You have entered an invalid email address or password',
        statusCode: StatusCodes.NOT_FOUND,
      });
    }
    // CREATE TOKEN
    const accessToken = await generateJWT({
      id: user._id,
      role: user.role,
      tokenType: 'accessToken',
    });

    res.json({
      user,
      accessToken,
    });
  } catch (error) {
    next(error);
  }
}

export async function getUserInfo(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = req.user;

    res.json(user);
  } catch (error) {
    next(error);
  }
}
