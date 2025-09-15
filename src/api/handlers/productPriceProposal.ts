import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { Context } from 'api';
import { ProductPriceApp, ProductPriceProposalApp, UserApp } from 'app';
import { IProductPriceProposalFilter } from 'interface';
import { AppError, ProductPriceProposal } from 'model';
import { isValidId, tryParseJson, validatePagination } from 'utils';
import { ObjectId } from 'mongodb';

const where = 'Handlers.productPriceProposal';

export async function createProductPriceProposal(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await ProductPriceProposal.sequelize(req.body);

    const result = await new ProductPriceProposalApp(ctx).create(data);

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function bulkCreateProductPriceProposal(
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
        id: 'productPriceProposal.bulkCreateProductPriceProposal',
        message: 'userId hoặc danh sách productId không hợp lệ',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }
    await new ProductPriceProposalApp(ctx).bulkCreateProductPriceProposal(userId, productIds);

    res.json('ok');
  } catch (error) {
    next(error);
  }
}

export async function upsertPriceProposals(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.params.userId as string;

    console.log('userId', userId);
    if (!isValidId(userId)) {
      throw new AppError({
        id: `${where}.upsertPriceProposals`,
        message: 'userId không hợp lệ',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const user = await new UserApp(ctx).getById(userId);

    if (!user) {
      throw new AppError({
        id: `${where}.upsertPriceProposals`,
        message: 'Người dùng không tồn tại',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const prices = await new ProductPriceApp(ctx).getByUserId(userId);

    console.log('prices', prices);

    if (!prices?.length) {
      throw new AppError({
        id: `${where}.upsertPriceProposals`,
        message: 'Không có giá sản phẩm nào để cập nhật',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }
    await new ProductPriceProposalApp(ctx).upsertPriceProposals(userId, prices);

    res.json('ok');
  } catch (error) {
    console.error(error);
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
    const userId = req.params.userId as string;

    const { limit = 10, page = 1, order, sort, keyword } = req.query;
    const filterObject = tryParseJson(req.query.filters);

    const filters: IProductPriceProposalFilter = {
      ...filterObject,
      limit: Number(limit),
      page: Number(page),
      order,
      sort,
      keyword,
      userId,
    };

    if (!isValidId(userId)) {
      throw new AppError({
        id: `${where}.getPaginate`,
        message: 'userId không hợp lệ',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    validatePagination(filters.page, filters.limit);

    const result = await new ProductPriceProposalApp(ctx).getPaginateAdmin(filters);

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

    const filters: IProductPriceProposalFilter = {
      ...filterObject,
      limit: Number(limit),
      page: Number(page),
      order,
      sort,
      keyword,
    };

    validatePagination(filters.page, filters.limit);

    const result = await new ProductPriceProposalApp(ctx).getPaginateAdmin(filters);

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

    const filters: IProductPriceProposalFilter = { ...filterObject, order, sort, keyword };

    const result = await new ProductPriceProposalApp(ctx).getList(filters);

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

    const result = await new ProductPriceProposalApp(ctx).getById(id);

    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateProductPriceProposal(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id as string;

    if (!isValidId(id)) {
      throw new AppError({
        id: `${where}.updateProductPriceProposal`,
        message: 'id không hợp lệ',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const data = await ProductPriceProposal.sequelize(req.body);

    const result = await new ProductPriceProposalApp(ctx).update(id, data);

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function deleteProductPriceProposal(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id as string;

    if (!isValidId(id)) {
      throw new AppError({
        id: `${where}.deleteProductPriceProposal`,
        message: 'id không hợp lệ',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const result = await new ProductPriceProposalApp(ctx).delete(id);

    res.json(result);
  } catch (error) {
    next(error);
  }
}
