import { Context } from 'api';
import { ProductApp } from 'app';
import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { IProductFilter } from 'interface';
import { AppError, Product } from 'model';
import { isValidId, tryParseJson, validatePagination, verifyAccessToken } from 'utils';
import to from 'await-to-js';

const where = 'Handlers.product';

export async function createProduct(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await Product.sequelize(req.body);

    const result = await new ProductApp(ctx).create(data);

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getMore(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { limit = 10, page = 1, order, sort } = req.query;
    const filterObject = tryParseJson(req.query.filters);

    const authorization = req.headers.authorization as string;
    const [error, resUser] = await to(verifyAccessToken(authorization?.split(' ')[1]));

    const filters: IProductFilter = {
      ...filterObject,
      userId: resUser?.id || null,
      limit: Number(limit),
      page: Number(page),
      order,
      sort,
    };

    validatePagination(filters.page, filters.limit);

    const result = await new ProductApp(ctx).getRandomProduct(filters);

    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getProductListByUser(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { limit = 10, page = 1, order, sort } = req.query;
    const filterObject = tryParseJson(req.query.filters);

    const authorization = req.headers.authorization as string;
    const [error, resUser] = await to(verifyAccessToken(authorization?.split(' ')[1]));

    const filters: IProductFilter = {
      ...filterObject,
      userId: resUser?.id || null,
      limit: Number(limit),
      page: Number(page),
      order,
      sort,
    };

    validatePagination(filters.page, filters.limit);

    const result = await new ProductApp(ctx).getListMoreByUser(filters);

    res.json(result);
  } catch (err) {
    console.log(err);
    next(err);
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

    const filters: IProductFilter = {
      ...filterObject,
      limit: Number(limit),
      page: Number(page),
      order,
      sort,
    };

    validatePagination(filters.page, filters.limit);

    const result = await new ProductApp(ctx).getPaginate(filters);

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

    const filters: IProductFilter = { ...filterObject, order, sort };

    const result = await new ProductApp(ctx).getList(filters);

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

    const result = await new ProductApp(ctx).getById(id);

    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getDetailBySlug(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const slug = req.params.slug as string;

    if (typeof slug === 'string' && !slug) {
      throw new AppError({
        id: `${where}.getDetail`,
        message: 'slug không hợp lệ',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const result = await new ProductApp(ctx).getDetail({
      slug,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateProduct(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id as string;

    if (!isValidId(id)) {
      throw new AppError({
        id: `${where}.updateProduct`,
        message: 'id không hợp lệ',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const data = await Product.sequelize(new Product(req.body));

    const result = await new ProductApp(ctx).update(id, data);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function deleteProduct(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id as string;

    if (!isValidId(id)) {
      throw new AppError({
        id: `${where}.deleteProduct`,
        message: 'id không hợp lệ',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const result = await new ProductApp(ctx).delete(id);

    res.json(result);
  } catch (error) {
    next(error);
  }
}
