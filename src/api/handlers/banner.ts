import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { Context } from 'api';
import { BannerApp } from 'app';
import { IBannerFilter } from 'interface';
import { AppError, Banner } from 'model';
import { isValidId, tryParseJson, validatePagination } from 'utils';

const where = 'Handlers.banner';

export async function createBanner(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await Banner.sequelize(req.body);

    const result = await new BannerApp(ctx).create(data);

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

    const filters: IBannerFilter = {
      ...filterObject,
      limit: Number(limit),
      page: Number(page),
      order,
      sort,
    };

    validatePagination(filters.page, filters.limit);

    const result = await new BannerApp(ctx).getPaginate(filters);

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

    const filters: IBannerFilter = { ...filterObject, order, sort };

    const result = await new BannerApp(ctx).getList(filters);

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

    const result = await new BannerApp(ctx).getById(id);

    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateBanner(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id as string;

    if (!isValidId(id)) {
      throw new AppError({
        id: `${where}.updateBanner`,
        message: 'id không hợp lệ',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const data = await Banner.sequelize(req.body);

    const result = await new BannerApp(ctx).update(id, data);

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function deleteBanner(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id as string;

    if (!isValidId(id)) {
      throw new AppError({
        id: `${where}.deleteBanner`,
        message: 'id không hợp lệ',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const result = await new BannerApp(ctx).delete(id);

    res.json(result);
  } catch (error) {
    next(error);
  }
}
