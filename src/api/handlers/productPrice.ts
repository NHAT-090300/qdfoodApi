import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { Context } from 'api';
import { ProductPriceApp } from 'app';
import { IProductPriceFilter } from 'interface';
import { AppError, ProductPrice } from 'model';
import { isValidId, tryParseJson, validatePagination } from 'utils';
import { ObjectId } from 'mongodb';

const where = 'Handlers.productPrice';

export async function createProductPrice(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await ProductPrice.sequelize(req.body);

    const result = await new ProductPriceApp(ctx).create(data);

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function bulkCreateProductPrice(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { userId, productIds } = req.body;

    if (
      !ObjectId.isValid(userId) ||
      !Array.isArray(productIds) ||
      !productIds.every((item) => ObjectId.isValid(item))
    ) {
      throw new AppError({
        id: 'productPrice.bulkCreateProductPrice',
        message: 'userId hoặc danh sách productId không hợp lệ',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }
    await new ProductPriceApp(ctx).bulkCreateProductPrice(userId, productIds);

    res.json('ok');
  } catch (error) {
    next(error);
  }
}

export async function bulkCreateProductPriceWithCode(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { userId, products } = req.body;

    if (!ObjectId.isValid(userId) || !Array.isArray(products)) {
      throw new AppError({
        id: 'productPrice.bulkCreateProductPrice',
        message: 'userId hoặc danh sách productId không hợp lệ',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }
    await new ProductPriceApp(ctx).bulkCreateProductPriceWithPrice(userId, products);

    res.json('ok');
  } catch (error) {
    next(error);
  }
}

export async function syncPriceProposals(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { userId } = req.params;

    if (!ObjectId.isValid(userId)) {
      throw new AppError({
        id: 'productPrice.syncPriceProposals',
        message: 'userId không hợp lệ',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }
    // notification

    await new ProductPriceApp(ctx).syncPriceProposalsOneUser(userId);

    res.json('ok');
  } catch (error) {
    next(error);
  }
}

export async function getPaginate(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user?._id as string;

    const { limit = 10, page = 1, order, sort, keyword } = req.query;
    const filterObject = tryParseJson(req.query.filters);

    const filters: IProductPriceFilter = {
      ...filterObject,
      limit: Number(limit),
      page: Number(page),
      order,
      sort,
      keyword,
      userId,
    };

    if (!isValidId(filters?.userId)) {
      throw new AppError({
        id: `${where}.getPaginate`,
        message: 'userId không hợp lệ',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    validatePagination(filters.page, filters.limit);

    const result = await new ProductPriceApp(ctx).getPaginateAdmin(filters);

    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getPaginateAdmin(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { limit = 10, page = 1, order, sort, keyword } = req.query;
    const filterObject = tryParseJson(req.query.filters);

    const filters: IProductPriceFilter = {
      ...filterObject,
      limit: Number(limit),
      page: Number(page),
      order,
      sort,
      keyword,
    };

    validatePagination(filters.page, filters.limit);

    const result = await new ProductPriceApp(ctx).getPaginateAdmin(filters);

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

    const filters: IProductPriceFilter = { ...filterObject, order, sort, keyword };

    const result = await new ProductPriceApp(ctx).getList(filters);

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

    const result = await new ProductPriceApp(ctx).getById(id);

    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateProductPrice(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id as string;

    if (!isValidId(id)) {
      throw new AppError({
        id: `${where}.updateProductPrice`,
        message: 'id không hợp lệ',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const data = await ProductPrice.sequelize(req.body);

    const result = await new ProductPriceApp(ctx).update(id, data);

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function deleteProductPrice(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id as string;

    if (!isValidId(id)) {
      throw new AppError({
        id: `${where}.deleteProductPrice`,
        message: 'id không hợp lệ',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const result = await new ProductPriceApp(ctx).delete(id);

    res.json(result);
  } catch (error) {
    next(error);
  }
}
