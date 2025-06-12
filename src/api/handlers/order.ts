import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { Context } from 'api';
import { OrderApp, ProductApp } from 'app';
import { EOrderStatus, IOrderFilter, IOrderItem } from 'interface';
import { AppError, Order } from 'model';
import { isValidId, tryParseJson, validatePagination } from 'utils';

const where = 'Handlers.order';

export async function createOrderUser(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { shippingAddress, items } = req.body;

    const userId = req.user?._id;

    if (!userId) {
      throw new AppError({
        id: `${where}.createOrderUser`,
        message: 'Vui lòng đăng nhập',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    if (
      !shippingAddress?.address ||
      !shippingAddress?.city ||
      !shippingAddress?.district ||
      !shippingAddress?.ward
    ) {
      throw new AppError({
        id: `${where}.createOrderUser`,
        message: 'Địa chỉ giao hàng không hợp lệ',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    if (!items || items.length === 0) {
      throw new AppError({
        id: `${where}.createOrderUser`,
        message: 'Vui lòng cung cấp ít nhất một sản phẩm trong đơn hàng',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const productIds = items.map((item: IOrderItem) => item.productId);

    const products = await new ProductApp(ctx).getList({
      ids: productIds,
    });

    if (products?.length !== items?.length) {
      throw new AppError({
        id: `${where}.createOrderUser`,
        message: 'Một hoặc nhiều sản phẩm không tồn tại',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const orderItems = items.map((item: IOrderItem) => {
      const product = products?.find((p) => p?._id?.equals(item?.productId));
      const unitPrice = product?.unitName || 0;

      if (!product) {
        throw new AppError({
          id: `${where}.createOrderUser`,
          message: 'Một hoặc nhiều sản phẩm không tồn tại',
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }
      if (item.quantity <= 0) {
        throw new AppError({
          id: `${where}.createOrderUser`,
          message: 'Số lượng sản phẩm phải lớn hơn 0',
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }

      return {
        productId: item.productId,
        quantity: item.quantity,
        price: product.defaultPrice,
        unitPrice,
        damagedQuantity: 0,
        refundAmount: 0,
      };
    });

    const total = orderItems.reduce(
      (sum: number, item: IOrderItem) => sum + item.quantity * item.price,
      0,
    );

    const data = await Order.sequelize({
      userId,
      status: EOrderStatus?.PENDING,
      total,
      shippingAddress,
      items,
    });

    const result = await new OrderApp(ctx).create(data);

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function createOrder(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await Order.sequelize(req.body);

    const result = await new OrderApp(ctx).create(data);

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

    const filters: IOrderFilter = {
      ...filterObject,
      limit: Number(limit),
      page: Number(page),
      order,
      sort,
    };

    validatePagination(filters.page, filters.limit);

    const result = await new OrderApp(ctx).getPaginate(filters);

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

    const filters: IOrderFilter = { ...filterObject, order, sort };

    const result = await new OrderApp(ctx).getList(filters);

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

    const result = await new OrderApp(ctx).getById(id);

    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateOrder(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id as string;

    if (!isValidId(id)) {
      throw new AppError({
        id: `${where}.updateOrder`,
        message: 'id không hợp lệ',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const data = await Order.sequelize(req.body);

    const result = await new OrderApp(ctx).update(id, data);

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function deleteOrder(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id as string;

    if (!isValidId(id)) {
      throw new AppError({
        id: `${where}.deleteOrder`,
        message: 'id không hợp lệ',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const result = await new OrderApp(ctx).delete(id);

    res.json(result);
  } catch (error) {
    next(error);
  }
}
