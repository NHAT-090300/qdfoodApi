import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { Context } from 'api';
import { InventoryApp } from 'app';
import { IInventoryFilter } from 'interface';
import { AppError, Inventory } from 'model';
import { isValidId, tryParseJson, validatePagination } from 'utils';

const where = 'Handlers.inventory';

export async function createInventory(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await Inventory.sequelize(req.body);

    const result = await new InventoryApp(ctx).create(data);

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function createManyInventory(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await Inventory.sequelizeArray(req.body);

    const result = await new InventoryApp(ctx).createMany(data);

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

    const filters: IInventoryFilter = {
      ...filterObject,
      limit: Number(limit),
      page: Number(page),
      order,
      sort,
    };

    validatePagination(filters.page, filters.limit);

    const result = await new InventoryApp(ctx).getPaginate(filters);

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

    const filters: IInventoryFilter = { ...filterObject, order, sort };

    const result = await new InventoryApp(ctx).getList(filters);

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

    const result = await new InventoryApp(ctx).getById(id);

    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateInventory(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id as string;

    if (!isValidId(id)) {
      throw new AppError({
        id: `${where}.updateInventory`,
        message: 'id không hợp lệ',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const data = await Inventory.sequelize(req.body);

    const result = await new InventoryApp(ctx).update(id, data);

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function deleteInventory(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id as string;

    if (!isValidId(id)) {
      throw new AppError({
        id: `${where}.deleteInventory`,
        message: 'id không hợp lệ',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const result = await new InventoryApp(ctx).delete(id);

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function exportInventoryToExcel(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { order, sort } = req.query;
    const filterObject = tryParseJson(req.query.filters);

    const filters: IInventoryFilter = { ...filterObject, order, sort };

    const workbook = await new InventoryApp(ctx).exportInventoryToExcel(filters);

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
