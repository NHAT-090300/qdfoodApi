import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { Context } from 'api';
import { InventoryApp, ProductLogApp } from 'app';
import { IProductLogFilter } from 'interface';
import { AppError, ProductLog } from 'model';
import { isValidId, mergeProductLogItems, tryParseJson, validatePagination } from 'utils';

const where = 'Handlers.productLog';

export async function create(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user?._id;
    const userName = req.user?.name;
    const body = req.body;

    if (!isValidId(userId))
      throw new AppError({
        id: `${where}.create`,
        message: 'id không hợp lệ',
        statusCode: StatusCodes.BAD_REQUEST,
      });

    const mergeOutputItems = mergeProductLogItems(body?.outputItem);
    const mergeingredientItems = mergeProductLogItems(body?.ingredientItem);

    const data = await ProductLog.sequelize({
      outputItem: mergeOutputItems,
      ingredientItem: mergeingredientItems,
      userId,
    });

    // Kiểm tra sl nguyên liệu đầu vào
    await new InventoryApp(ctx).checkInventoryFast(mergeingredientItems);

    // Call the updated create method
    const result = await new ProductLogApp(ctx).create({ ...data, userName } as any);

    res.json(result);
  } catch (err) {
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
    const { limit = 10, page = 1, order, sort, keyword } = req.query;
    const filterObject = tryParseJson(req.query.filters);

    const filters: IProductLogFilter = {
      ...filterObject,
      limit: Number(limit),
      page: Number(page),
      order,
      sort,
      keyword,
    };

    validatePagination(filters.page, filters.limit);

    const result = await new ProductLogApp(ctx).getPaginate(filters);

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

    const result = await new ProductLogApp(ctx).getById(id);

    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function exportProductLogToExcel(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { order, sort, keyword } = req.query;
    const filterObject = tryParseJson(req.query.filters);

    const filters: IProductLogFilter = { ...filterObject, order, sort, keyword };

    const workbook = await new ProductLogApp(ctx).exportProductLogToExcel(filters);

    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', 'attachment; filename=orders.xlsx');

    workbook.xlsx.write(res).then(() => {
      res.status(200).end();
    });
  } catch (err) {
    next(err);
  }
}
