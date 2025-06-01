import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { Context } from 'api';
import { SubCategoryApp } from 'app';
import { ISubCategoryFilter } from 'interface';
import { AppError, SubCategory } from 'model';
import { isValidId, tryParseJson, validatePagination } from 'utils';

const where = 'Handlers.subCategory';

export async function createSubCategory(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await SubCategory.sequelize(req.body);

    const result = await new SubCategoryApp(ctx).create(data);

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
    const { categoryId } = req.params;

    if (!isValidId(categoryId))
      throw new AppError({
        id: `${where}.getDetail`,
        message: 'categoryId không hợp lệ',
        statusCode: StatusCodes.BAD_REQUEST,
      });

    const filters: ISubCategoryFilter = {
      ...filterObject,
      categoryId,
      limit: Number(limit),
      page: Number(page),
      order,
      sort,
    };

    validatePagination(filters.page, filters.limit);

    const result = await new SubCategoryApp(ctx).getPaginate(filters);

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
    const { categoryId } = req.params;
    const filterObject = tryParseJson(req.query.filters);

    if (!isValidId(categoryId))
      throw new AppError({
        id: `${where}.getDetail`,
        message: 'categoryId không hợp lệ',
        statusCode: StatusCodes.BAD_REQUEST,
      });

    const filters: ISubCategoryFilter = { ...filterObject, categoryId, order, sort };

    const result = await new SubCategoryApp(ctx).getList(filters);

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

    const result = await new SubCategoryApp(ctx).getById(id);

    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateSubCategory(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id as string;

    if (!isValidId(id)) {
      throw new AppError({
        id: `${where}.updateSubCategory`,
        message: 'id không hợp lệ',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const data = await SubCategory.sequelize(req.body);

    const result = await new SubCategoryApp(ctx).update(id, data);

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function deleteSubCategory(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id as string;

    if (!isValidId(id)) {
      throw new AppError({
        id: `${where}.deleteSubCategory`,
        message: 'id không hợp lệ',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const result = await new SubCategoryApp(ctx).delete(id);

    res.json(result);
  } catch (error) {
    next(error);
  }
}
