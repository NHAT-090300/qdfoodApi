import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { compare, hash } from 'bcrypt';

import { Context } from 'api';
import { UserApp } from 'app';
import { AppError, Otp, User } from 'model';
import { generateJWT, validateEmail, verifyAccessToken } from 'utils';
import { OtpApp } from 'app/otp';
import { ERole } from 'interface';

const where = 'Handlers.auth';

export async function loginAdmin(
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

export async function loginUser(
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

    const refreshToken = await generateJWT({
      id: user._id,
      role: user.role,
      tokenType: 'refreshToken',
      expiresIn: '1d',
    });

    res.json({
      user,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
}

export async function handleRefreshToken(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError({
        id: `${where}.refreshToken`,
        message: 'Refresh token not found',
        statusCode: StatusCodes.UNAUTHORIZED,
      });
    }

    const decoded = await verifyAccessToken(refreshToken);

    if (!decoded) {
      throw new AppError({
        id: `${where}.refreshToken`,
        message: 'Invalid refresh token',
        statusCode: StatusCodes.UNAUTHORIZED,
      });
    }

    const accessToken = await generateJWT({
      id: decoded.id,
      role: decoded.role,
      tokenType: 'accessToken',
    });

    res.json({ accessToken });
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

export async function register(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email, password } = req.body;
    const data = await User.sequelize({ email, password });
    const userExist = await new UserApp(ctx).getByEmail(data?.email);
    if (userExist) {
      throw new AppError({
        id: `${where}.createUser`,
        message: 'Email address is already used',
        statusCode: StatusCodes?.UNPROCESSABLE_ENTITY,
      });
    }
    const hashPassword = await hash(data?.password, 12);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await ctx.services.mailer.sendOtpEmail({
      toEmail: data?.email,
      otp,
    });
    // Save OTP to database
    const dataVerify = new Otp({
      email: data?.email?.trim(),
      password: hashPassword,
      otp,
      otpExpiresAt,
    });
    const result = await new OtpApp(ctx).create(dataVerify);

    if (!result) {
      throw new AppError({
        id: `${where}.createUser`,
        message: 'Create user failed',
        statusCode: StatusCodes?.UNPROCESSABLE_ENTITY,
      });
    }

    res.json({ email: result?.email });
  } catch (error) {
    next(error);
  }
}

export async function resendOtp(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email } = req.body;
    const userPending = await new OtpApp(ctx).getOne({
      email,
      isVerified: false,
    });
    console.log('userPending', userPending);
    if (!userPending)
      throw new AppError({
        id: `${where}.resendOtp`,
        message: 'User not found',
        statusCode: StatusCodes?.NOT_FOUND,
      });
    if (userPending?.isVerified)
      throw new AppError({
        id: `${where}.resendOtp`,
        message: 'Already verified',
        statusCode: StatusCodes?.BAD_REQUEST,
      });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await ctx.services.mailer.sendOtpEmail({
      toEmail: email,
      otp,
    });
    await new OtpApp(ctx).update(userPending._id as any, {
      otp,
      otpExpiresAt,
    });

    res.json({ message: 'Otp sent successfully' });
  } catch (error) {
    next(error);
  }
}

export async function verifyOtp(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email, otp } = req.body;

    const userPending = await new OtpApp(ctx).getOne({
      email,
      isVerified: false,
    });

    if (!userPending)
      throw new AppError({
        id: `${where}.verifyOtp`,
        message: 'User not found',
        statusCode: StatusCodes?.NOT_FOUND,
      });

    if (!otp)
      throw new AppError({
        id: `${where}.verifyOtp`,
        message: 'OTP invalid',
        statusCode: StatusCodes?.BAD_REQUEST,
      });

    if (userPending?.isVerified)
      throw new AppError({
        id: `${where}.verifyOtp`,
        message: 'Already verified',
        statusCode: StatusCodes?.BAD_REQUEST,
      });

    if (userPending.otp !== otp)
      throw new AppError({
        id: `${where}.verifyOtp`,
        message: 'Incorrect OTP',
        statusCode: StatusCodes?.BAD_REQUEST,
      });

    if (!userPending.otpExpiresAt || userPending.otpExpiresAt < new Date())
      throw new AppError({
        id: `${where}.verifyOtp`,
        message: 'OTP expired',
        statusCode: StatusCodes?.BAD_REQUEST,
      });

    if (!userPending?.email) {
      throw new AppError({
        id: `${where}.verifyOtp`,
        message: 'email not empty',
        statusCode: StatusCodes?.NOT_FOUND,
      });
    }

    if (!userPending?.password) {
      throw new AppError({
        id: `${where}.verifyOtp`,
        message: 'password not empty',
        statusCode: StatusCodes?.NOT_FOUND,
      });
    }

    await new OtpApp(ctx).update(userPending?._id as any, {
      isVerified: true,
      otp: '',
      otpExpiresAt: undefined,
      email: userPending?.email,
    });

    const user = new User({
      email: userPending?.email,
      password: userPending?.password,
      role: ERole.USER,
      isDelete: false,
    });

    const result = await new UserApp(ctx).create(user);

    if (!result) {
      throw new AppError({
        id: `${where}.createUser`,
        message: 'Create user failed',
        statusCode: StatusCodes?.UNPROCESSABLE_ENTITY,
      });
    }
    // CREATE TOKEN
    const accessToken = await generateJWT({
      id: user._id,
      role: user.role,
      tokenType: 'accessToken',
    });

    const refreshToken = await generateJWT({
      id: user._id,
      role: user.role,
      tokenType: 'refreshToken',
      expiresIn: '1d',
    });

    res.json({
      user: result,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
}

export async function forgotPassword(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email } = req.body;

    if (validateEmail(email))
      throw new AppError({
        id: `${where}.forgotPassword`,
        message: 'Email invalid',
        statusCode: StatusCodes?.BAD_REQUEST,
      });

    const userExist = await new UserApp(ctx).getByEmail(email);

    if (userExist) {
      throw new AppError({
        id: `${where}.createUser`,
        message: 'Email address is already used',
        statusCode: StatusCodes?.UNPROCESSABLE_ENTITY,
      });
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await ctx.services.mailer.sendOtpEmail({
      toEmail: email,
      otp,
    });
    // Save OTP to database
    const dataVerify = new Otp({
      email,
      otp,
      otpExpiresAt,
    });
    const result = await new OtpApp(ctx).create(dataVerify);

    if (!result) {
      throw new AppError({
        id: `${where}.createUser`,
        message: 'Create user failed',
        statusCode: StatusCodes?.UNPROCESSABLE_ENTITY,
      });
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email, password, otp } = req.body;

    if (otp.length !== 6)
      throw new AppError({
        id: `${where}.resetPassword`,
        message: 'OTP invalid',
        statusCode: StatusCodes?.BAD_REQUEST,
      });

    if (validateEmail(email))
      throw new AppError({
        id: `${where}.resetPassword`,
        message: 'Email invalid',
        statusCode: StatusCodes?.BAD_REQUEST,
      });

    if (password.length < 6)
      throw new AppError({
        id: `${where}.resetPassword`,
        message: 'Password must be at least 6 characters',
        statusCode: StatusCodes?.BAD_REQUEST,
      });

    const userExist = await new UserApp(ctx).getByEmail(email);

    if (!userExist) {
      throw new AppError({
        id: `${where}.resetPassword`,
        message: 'Email address is not used',
        statusCode: StatusCodes?.UNPROCESSABLE_ENTITY,
      });
    }

    const otpPending = await new OtpApp(ctx).getOne({
      email,
      isVerified: false,
    });

    if (!otpPending || otpPending?.otp !== otp)
      throw new AppError({
        id: `${where}.resetPassword`,
        message: 'Otp is correct',
        statusCode: StatusCodes?.BAD_REQUEST,
      });

    if (!otpPending.otpExpiresAt || otpPending.otpExpiresAt < new Date())
      throw new AppError({
        id: `${where}.resetPassword`,
        message: 'OTP expired',
        statusCode: StatusCodes?.BAD_REQUEST,
      });

    const hashPassword = await hash(password, 12);

    const result = await new UserApp(ctx).updatePassword(userExist?._id as any, {
      password: hashPassword,
    });

    await new OtpApp(ctx).update(otpPending?._id as any, {
      isVerified: true,
      otp: '',
      otpExpiresAt: undefined,
      email: otpPending?.email,
    });

    await ctx.services.mailer.resetPassword({
      toEmail: email,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
}
