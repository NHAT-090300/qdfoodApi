import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { hash } from 'bcrypt';

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
    const { limit = 10, page = 1, order, sort } = req.query;
    const filterObject = tryParseJson(req.query.filters);

    const filters: IUserFilter = {
      ...filterObject,
      limit: Number(limit),
      page: Number(page),
      order,
      sort,
    };

    validatePagination(filters.page, filters.limit);

    const result = await new UserApp(ctx).getPaginate(filters);

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
    const { order, sort } = req.query;
    const filterObject = tryParseJson(req.query.filters);

    const filters: IUserFilter = { ...filterObject, order, sort };

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

export async function updateUser(
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

    const data = await User.validateUpdate(req.body);

    const result = await new UserApp(ctx).update(id, data);

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

    if (oldUser?.role === ERole.SUPPER || oldUser?.role === ERole.ADMIN) {
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
