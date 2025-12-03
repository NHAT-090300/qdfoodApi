import { Context } from 'api';
import { InventoryApp, InventoryTransactionApp } from 'app';
import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { EInventoryTransactionType, IInventoryFilter } from 'interface';
import { round } from 'lodash';
import { AppError, Inventory, InventoryTransaction } from 'model';
import { ObjectId } from 'mongodb';
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
    const userId = req.user?._id;
    if (!req.body.inventories || !Array.isArray(req.body.inventories)) {
      throw new AppError({
        id: `${where}.createManyInventory`,
        message: 'inventories không hợp lệ',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const inventoryTransactions = await InventoryTransaction.sequelizeArray(
      req.body.inventories?.map(
        (item: any) =>
          new InventoryTransaction({
            ...item,
            userId,
            type: EInventoryTransactionType.IMPORT,
            note: 'Nhập sản phẩm vào kho',
          }),
      ),
    );

    const dataInventories = await Inventory.sequelizeArray(req.body.inventories);
    const dataInventoryTransactions =
      await InventoryTransaction.sequelizeArray(inventoryTransactions);

    const result = await new InventoryApp(ctx).createMany(dataInventories);

    await new InventoryTransactionApp(ctx).createMany(dataInventoryTransactions);

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

    const filters: IInventoryFilter = {
      ...filterObject,
      limit: Number(limit),
      page: Number(page),
      order,
      sort,
      keyword,
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
    const { order, sort, keyword } = req.query;
    const filterObject = tryParseJson(req.query.filters);

    const filters: IInventoryFilter = { ...filterObject, order, sort, keyword };

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

export async function updateInventoryQuantity(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user?._id;
    const id = req.params.id as string;
    const { damagedQuantity, reason } = req.body;

    if (!isValidId(id)) {
      throw new AppError({
        id: `${where}.updateInventoryQuantity`,
        message: 'id không hợp lệ',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const oldInventory = await new InventoryApp(ctx).getById(id);

    if (!oldInventory) {
      throw new AppError({
        id: `${where}.updateInventoryQuantity`,
        message: 'Không tim thấy sản phẩm trong kho',
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    if (
      oldInventory?.quantity > 0 &&
      oldInventory?.quantity < damagedQuantity &&
      typeof damagedQuantity !== 'number'
    ) {
      throw new AppError({
        id: `${where}.updateInventoryQuantity`,
        message: 'Số lượng sản phẩm không đủ',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const data = await Inventory.sequelize({
      ...oldInventory,
      quantity: round(Number(oldInventory?.quantity || 0) - Number(damagedQuantity || 0), 2),
    });

    const transaction = await InventoryTransaction.sequelize({
      productId: data?.productId,
      type: EInventoryTransactionType.DAMAGED,
      price: 0,
      userId,
      note: `lý do: ${reason || 'Admin cập nhật'}`,
      quantity: Number(damagedQuantity || 0),
    });

    const result = await new InventoryApp(ctx).update(id, data);

    await new InventoryTransactionApp(ctx).create(transaction);

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateInventoryDamagedBulk(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user?._id;
    const updates: { id: string; damagedQuantity: number; reason?: string }[] = req.body.updates;

    if (!Array.isArray(updates) || updates.length === 0) {
      throw new AppError({
        id: `${where}.updateInventoryDamagedBulk`,
        message: 'Danh sách cập nhật không hợp lệ',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const result = await new InventoryApp(ctx).updateDamagedBulk(updates, userId);

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
    const { order, sort, keyword } = req.query;
    const filterObject = tryParseJson(req.query.filters);

    const filters: IInventoryFilter = { ...filterObject, order, sort, keyword };

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
