import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { compare, hash } from 'bcrypt';

import { Context } from 'api';
import { UserApp } from 'app';
import { ERole, IUserFilter } from 'interface';
import { AppError, User } from 'model';
import { isValidId, tryParseJson, validatePagination } from 'utils';

const where = 'Handlers.user';

export async function createUser(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await User.sequelize(req.body);
    const userExist = await new UserApp(ctx).getByEmail(data?.email);
    if (userExist) {
      throw new AppError({
        id: `${where}.createUser`,
        message: 'Email address is already used',
        statusCode: StatusCodes?.UNPROCESSABLE_ENTITY,
      });
    }
    const hashPassword = await hash(data?.password, 12);
    const user = new User({
      ...data,
      password: hashPassword,
      role: req?.role === ERole.ADMIN ? data?.role : ERole.USER,
    });
    const result = await new UserApp(ctx).create(user);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getPagination(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { limit = 10, page = 1, order, sort, keyword } = req.query;
    const filterObject = tryParseJson(req.query.filters);

    const filters: IUserFilter = {
      ...filterObject,
      limit: Number(limit),
      page: Number(page),
      order,
      sort,
      keyword,
    };

    validatePagination(filters.page, filters.limit);

    const result = await new UserApp(ctx).getPaginate(filters);

    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getUserDebtPaginate(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { limit = 10, page = 1, order, sort, keyword } = req.query;
    const filterObject = tryParseJson(req.query.filters);

    const filters: IUserFilter = {
      ...filterObject,
      limit: Number(limit),
      page: Number(page),
      order,
      sort,
      keyword,
    };

    validatePagination(filters.page, filters.limit);

    const result = await new UserApp(ctx).getUserDebtPaginate(filters);

    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getAll(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { order, sort, keyword } = req.query;
    const filterObject = tryParseJson(req.query.filters);

    const filters: IUserFilter = { ...filterObject, order, sort, keyword };

    const result = await new UserApp(ctx).getList(filters);

    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getDetail(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id as string;

    if (!isValidId(id)) {
      throw new AppError({
        id: `${where}.getDetail`,
        message: 'id không hợp lệ',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const result = await new UserApp(ctx).getById(id);

    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function updatePasswordClient(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.user?._id as string;
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!isValidId(id)) {
      throw new AppError({
        id: `${where}.updateUser`,
        message: 'id không hợp lệ',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    if (!oldPassword || !newPassword || !confirmPassword) {
      throw new AppError({
        id: `${where}.updateUser`,
        message: 'Vui lòng nhập đầy đủ thông tin',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    if (newPassword.length < 6 || confirmPassword.length < 6)
      throw new AppError({
        id: `${where}.updatePasswordClient`,
        message: 'Password must be at least 6 characters',
        statusCode: StatusCodes?.BAD_REQUEST,
      });

    if (newPassword !== confirmPassword) {
      throw new AppError({
        id: `${where}.updatePasswordClient`,
        message: 'Mật khẩu mới và xác nhận mật khẩu không khớp',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    if (oldPassword === newPassword) {
      throw new AppError({
        id: `${where}.updatePasswordClient`,
        message: 'Mật khẩu mới không được trùng với mật khẩu cũ',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const oldUser = await new UserApp(ctx).getById(id);

    if (!oldUser) {
      throw new AppError({
        id: `${where}.updatePasswordClient`,
        message: 'User không có hoặc chưa tồn tại',
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    const isValidPass = await compare(newPassword, oldUser?.password);

    if (isValidPass) {
      throw new AppError({
        id: `${where}.updatePasswordClient`,
        message: 'Mật khẩu mới không được trùng với mật khẩu cũ',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const hashPassword = await hash(newPassword, 12);

    const result = await new UserApp(ctx).updatePassword(id, {
      password: hashPassword,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateUserClient(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.user?._id as string;

    if (!isValidId(id)) {
      throw new AppError({
        id: `${where}.updateUser`,
        message: 'id không hợp lệ',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const data = await User.validateUpdate(new User(req.body));

    const result = await new UserApp(ctx).updateClient(id, data);

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateUser(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id as string;
    const { password, confirmPassword } = req.body;
    const adminRole = req.role as ERole;

    if (!isValidId(id)) {
      throw new AppError({
        id: `${where}.updateUser`,
        message: 'id không hợp lệ',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    if (password && confirmPassword) {
      if (password.length < 6 || confirmPassword.length < 6)
        throw new AppError({
          id: `${where}.updatePasswordClient`,
          message: 'Password must be at least 6 characters',
          statusCode: StatusCodes?.BAD_REQUEST,
        });

      if (password !== confirmPassword) {
        throw new AppError({
          id: `${where}.updatePasswordClient`,
          message: 'Mật khẩu mới và xác nhận mật khẩu không khớp',
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }
    }

    const data = await User.validateUpdate(req.body);

    const result = await new UserApp(ctx).update(id, data, adminRole);

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function deleteUser(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id as string;

    if (!isValidId(id)) {
      throw new AppError({
        id: `${where}.updateUser`,
        message: 'id không hợp lệ',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const oldUser = await new UserApp(ctx).getById(id);

    if (oldUser?.role === ERole.SUPPER) {
      throw new AppError({
        id: `${where}.updateUser`,
        message: 'không thể xóa tài khoản supper admin',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const result = await new UserApp(ctx).delete(id);

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getTotalData(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await new UserApp(ctx).getTotalData();

    res.json(result);
  } catch (error) {
    next(error);
  }
}
