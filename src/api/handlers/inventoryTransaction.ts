import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { Context } from 'api';
import { InventoryTransactionApp } from 'app';
import { IInventoryTransactionFilter } from 'interface';
import { AppError, InventoryTransaction } from 'model';
import { isValidId, tryParseJson, validatePagination } from 'utils';

const where = 'Handlers.inventoryTransaction';

export async function createInventoryTransaction(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await InventoryTransaction.sequelize(req.body);

    const result = await new InventoryTransactionApp(ctx).create(data);

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

    const filters: IInventoryTransactionFilter = {
      ...filterObject,
      limit: Number(limit),
      page: Number(page),
      order,
      sort,
      keyword,
    };

    validatePagination(filters.page, filters.limit);

    const result = await new InventoryTransactionApp(ctx).getPaginate(filters);

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

    const filters: IInventoryTransactionFilter = { ...filterObject, order, sort, keyword };

    const result = await new InventoryTransactionApp(ctx).getList(filters);

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

    const result = await new InventoryTransactionApp(ctx).getById(id);

    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateInventoryTransaction(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id as string;

    if (!isValidId(id)) {
      throw new AppError({
        id: `${where}.updateInventoryTransaction`,
        message: 'id không hợp lệ',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const data = await InventoryTransaction.sequelize(req.body);

    const result = await new InventoryTransactionApp(ctx).update(id, data);

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function deleteInventoryTransaction(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id as string;

    if (!isValidId(id)) {
      throw new AppError({
        id: `${where}.deleteInventoryTransaction`,
        message: 'id không hợp lệ',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const result = await new InventoryTransactionApp(ctx).delete(id);

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function exportInventoryTransactionsToExcel(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { order, sort, keyword } = req.query;
    const filterObject = tryParseJson(req.query.filters);

    const filters: IInventoryTransactionFilter = {
      ...filterObject,
      order,
      sort,
      keyword,
    };

    const workbook = await new InventoryTransactionApp(ctx).exportInventoryTransactionsToExcel(
      filters,
    );

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

export async function getInventoryMoneyStats(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { page = 1, limit = 10, order, sort, keyword } = req.query;
    const filterObject = tryParseJson(req.query.filters);

    const filters: IInventoryTransactionFilter = {
      ...filterObject,
      page: Number(page),
      limit: Number(limit),
      order,
      sort,
      keyword,
    };

    validatePagination(filters.page, filters.limit);

    const result = await new InventoryTransactionApp(ctx).getInventoryMoneyStatsAll(filters);

    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getInventoryShortageByMonth(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { page = 1, limit = 10 } = req.query;
    const filterObject = tryParseJson(req.query.filters);

    const filters: IInventoryTransactionFilter = {
      ...filterObject,
      page: Number(page),
      limit: Number(limit),
    };

    validatePagination(filters.page, filters.limit);

    const result = await new InventoryTransactionApp(ctx).getInventoryShortageByMonth(filters);

    res.json(result);
  } catch (err) {
    next(err);
  }
}
