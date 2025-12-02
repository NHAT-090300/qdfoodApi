import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { Context } from 'api';
import { OrderApp, ProductApp, UserApp } from 'app';
import { EOrderStatus, EPaymentMethod, IOrderFilter, IOrderItem } from 'interface';
import { AppError, Order } from 'model';
import { isValidId, tryParseJson, validatePagination, validatePhone } from 'utils';
import { isBoolean, isNumber } from 'lodash';

const where = 'Handlers.order';

export async function getSummary(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user?._id;

    if (!userId) {
      throw new AppError({
        id: `${where}.getSummary`,
        message: 'Vui lòng đăng nhập',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const result = await new OrderApp(ctx).getCountByStatuses({
      userId,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getRevenueStatsPaginate(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { clientId } = req.params;
    const { limit = 10, page = 1, order, sort } = req.query;
    const filterObject = tryParseJson(req.query.filters);

    if (!isValidId(clientId)) {
      throw new AppError({
        id: `${where}.getRevenueStatsPaginate`,
        message: 'clientId không hợp lệ',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }
    const filters: IOrderFilter = {
      ...filterObject,
      limit: Number(limit),
      page: Number(page),
      order,
      sort,
    };

    validatePagination(filters.page, filters.limit);

    const result = await new OrderApp(ctx).getRevenueStatsPaginate({
      ...filters,
      userId: clientId,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function createOrderUser(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { shippingAddress, items, note, phoneNumber, paymentMethod, name } = req.body;

    const userId = req.user?._id;

    if (!userId) {
      throw new AppError({
        id: `${where}.createOrderUser`,
        message: 'Vui lòng đăng nhập',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    if (!paymentMethod || !Object.values(EPaymentMethod).includes(paymentMethod)) {
      throw new AppError({
        id: `${where}.createOrderUser`,
        message: 'Vui lòng cung cấp phương thức thanh toán',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    if (!phoneNumber || !validatePhone(phoneNumber)) {
      throw new AppError({
        id: `${where}.createOrderUser`,
        message: 'Vui lòng cung cấp số điện thoại',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    if (!shippingAddress) {
      throw new AppError({
        id: `${where}.createOrderUser`,
        message: 'Vui lòng cung cấp địa chỉ giao hàng',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    if (!shippingAddress?.address || !shippingAddress?.city || !shippingAddress?.ward) {
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

    const products = await new ProductApp(ctx).getListByUser({
      ids: productIds,
      userId,
      isShow: true,
    });

    if (products?.length !== items?.length) {
      const notFoundProducts = items.filter(
        (item: IOrderItem) => !products?.some((p) => p?._id?.equals(item?.productId)),
      );
      throw new AppError({
        id: `${where}.createOrderUser`,
        message: `Sản phẩm ${notFoundProducts?.map((p: IOrderItem) => p?.name || p?.productId)?.join(', ')} không còn đăng bán. Vui lòng chọn lại sản phẩm khác.`,
        detail: {
          notFoundProducts,
        },
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const orderItems = items.map((item: IOrderItem) => {
      const product = products?.find((p) => p?._id?.equals(item?.productId));
      const unitName = product?.unitName || 0;

      if (!product) {
        throw new AppError({
          id: `${where}.createOrderUser`,
          message: `Sản phẩm ${item.name || item.productId} không tồn tại`,
          detail: { notFoundProducts: [item.productId] },
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }
      if (!isNumber(item.quantity) || item.quantity <= 0) {
        throw new AppError({
          id: `${where}.createOrderUser`,
          message: 'Số lượng sản phẩm phải lớn hơn 0',
          detail: { notFoundProducts: [item.productId] },
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }

      return {
        productId: item.productId,
        quantity: item.quantity,
        price: product.finalPrice,
        tax: product.tax,
        unitName,
        damagedQuantity: 0,
        refundAmount: 0,
      };
    });

    const total = orderItems.reduce(
      (sum: number, item: IOrderItem) => sum + item.quantity * item.price,
      0,
    );

    const vat = orderItems.reduce(
      (sum: number, item: IOrderItem) => sum + (item.quantity * item.price * item.tax) / 100,
      0,
    );

    const oldUser = await new UserApp(ctx).getById(userId);

    if (!oldUser) {
      throw new AppError({
        id: `${where}.createOrderUser`,
        message: 'Người dùng không tồn tại',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    if (
      !oldUser.phoneNumber ||
      !oldUser.address?.city ||
      !oldUser.address?.ward ||
      !oldUser.address?.street ||
      !oldUser.name
    ) {
      await new UserApp(ctx).update(userId, {
        ...oldUser,
        phoneNumber: oldUser.phoneNumber || phoneNumber,
        name: oldUser.name || name,
        address: {
          city: oldUser.address?.city || shippingAddress?.city,
          ward: oldUser.address?.ward || shippingAddress?.ward,
          street: oldUser.address?.street || shippingAddress?.address,
        },
      });
    }

    const data = await Order.sequelize({
      userId,
      status: EOrderStatus?.PENDING,
      total,
      vat,
      note,
      phoneNumber,
      paymentMethod,
      shippingAddress,
      items,
      isTax: oldUser?.isTax,
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

export async function getPaginationForUser(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { limit = 10, page = 1, order, sort } = req.query;
    const filterObject = tryParseJson(req.query.filters);
    const userId = req.user?._id;
    if (!userId) {
      throw new AppError({
        id: `${where}.getPagination`,
        message: 'Vui lòng cung cấp người dùng',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const filters: IOrderFilter = {
      ...filterObject,
      userId,
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

    const result = await new OrderApp(ctx).getOrderWithInventoryInfo(id);

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
export async function updateOrderAddItems(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const orderId = req.params.id as string;
    const { items: newItems } = req.body;

    if (!orderId || !isValidId(orderId)) {
      throw new AppError({
        id: `${where}.updateOrderAddItems`,
        message: 'Đơn hàng không hợp lệ',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    if (!Array.isArray(newItems) || newItems.length === 0) {
      throw new AppError({
        id: `${where}.updateOrderAddItems`,
        message: 'Vui lòng cung cấp sản phẩm để thêm',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const orderApp = new OrderApp(ctx);
    const order = await orderApp.getById(orderId);

    if (!order) {
      throw new AppError({
        id: `${where}.updateOrderAddItems`,
        message: 'Đơn hàng không tồn tại',
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    if (
      [EOrderStatus?.CONFIRM, EOrderStatus?.PENDING, EOrderStatus?.SHIPPING].includes(order?.status)
    ) {
      throw new AppError({
        id: `${where}.updateOrderAddItems`,
        message: 'Trạng thái đơn hàng không được phép thêm sản phẩm',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const productIds = newItems.map((i: any) => i.productId);
    const products = await new ProductApp(ctx).getListByUser({
      ids: productIds,
      userId: String(order?.userId),
      isShow: true,
    });

    // --- Merge items vào order.items ---
    const updatedItems = [...order.items]; // clone current items

    newItems.forEach((item: any) => {
      const product = products.find((p) => p._id.equals(item.productId));
      if (!product) {
        throw new AppError({
          id: `${where}.updateOrderAddItems`,
          message: `Sản phẩm ${item.productId} không tồn tại`,
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }
      if (!isNumber(item.quantity) || item.quantity <= 0) {
        throw new AppError({
          id: `${where}.updateOrderAddItems`,
          message: 'Số lượng sản phẩm phải lớn hơn 0',
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }

      // Kiểm tra xem product đã tồn tại trong order chưa
      const existingItem = updatedItems.find((i) => i.productId.equals(item.productId));
      if (existingItem) {
        // Merge quantity
        existingItem.quantity += item.quantity;
      } else {
        // Thêm mới
        updatedItems.push({
          productId: item.productId,
          quantity: item.quantity,
          price: product.finalPrice,
          tax: product.tax,
          unitName: product.unitName || '',
          damagedQuantity: 0,
          refundAmount: 0,
        });
      }
    });

    // --- Tính tổng tiền và VAT mới ---
    const total = updatedItems.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const vat = updatedItems.reduce(
      (sum, item) => sum + (item.quantity * item.price * item.tax) / 100,
      0,
    );

    const newOrderData = new Order({
      ...order,
      items: updatedItems,
      total,
      vat,
    });

    const updatedOrder = await orderApp.update(orderId, newOrderData);

    res.json(updatedOrder);
  } catch (error) {
    next(error);
  }
}

export async function updateOrderTax(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id as string;
    const isTax = req.body.isTax;

    if (!isValidId(id)) {
      throw new AppError({
        id: `${where}.updateOrder`,
        message: 'id không hợp lệ',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    if (isBoolean(isTax) === false) {
      throw new AppError({
        id: `${where}.updateOrder`,
        message: 'isTax phải là boolean',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const result = await new OrderApp(ctx).updateIsTax(id, { isTax });

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

export async function updateStatusOrder(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id as string;
    const userId = req.user?._id;

    if (!isValidId(id)) {
      throw new AppError({
        id: `${where}.deleteOrder`,
        message: 'id không hợp lệ',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    await new OrderApp(ctx).updateStatus(id, {
      ...req.body,
      actionUserId: userId,
    });

    res.json('ok');
  } catch (error) {
    next(error);
  }
}

export async function payDebtForOrders(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const paymentVerifierId = req.user?._id as string;

    const { userId, paymentAmount } = req.body;

    if (!isValidId(userId) || !isValidId(paymentVerifierId)) {
      throw new AppError({
        id: `${where}.payDebtForOrders`,
        message: 'id không hợp lệ',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    if (paymentAmount <= 0 || Number.isNaN(paymentAmount)) {
      throw new AppError({
        id: `${where}.payDebtForOrders`,
        message: 'Số tiền phải lớn hơn 0',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    await new OrderApp(ctx).payDebtForOrders(userId, paymentAmount, paymentVerifierId);

    res.json('ok');
  } catch (error) {
    next(error);
  }
}

export async function exportOrders(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { order, sort } = req.query;
    const filterObject = tryParseJson(req.query.filters);

    const filters: IOrderFilter = {
      ...filterObject,
      order,
      sort,
    };

    const workbook = await new OrderApp(ctx).exportOrdersToExcel(filters);

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
    console.log(err);
    next(err);
  }
}

export async function exportOrdersPDF(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { order, sort } = req.query;
    const filterObject = tryParseJson(req.query.filters);

    const filters: IOrderFilter = {
      ...filterObject,
      order,
      sort,
    };

    const pdfBuffer = await new OrderApp(ctx).exportOrdersToPDF(filters);

    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="phieu-giao-hang-${Date.now()}.pdf"`,
    );

    res.status(200).send(pdfBuffer);
  } catch (err) {
    next(err);
  }
}

export async function updateOrderItemRefund(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id as string;

    const userId = req.user?._id as string;

    if (!isValidId(id)) {
      throw new AppError({
        id: `${where}.deleteOrder`,
        message: 'id không hợp lệ',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const data = req.body;

    await new OrderApp(ctx).updateOrderItemRefund(id, {
      ...data,
      userId,
      quantity: Number(data.quantity || 0),
      damagedQuantity: Number(data.damagedQuantity || 0),
      refundAmount: Number(data.refundAmount || 0),
      reason: data.reason,
    });

    res.json('ok');
  } catch (error) {
    next(error);
  }
}

export async function updateOrderItemQuantity(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = req.params.id as string;

    const userId = req.user?._id as string;

    if (!isValidId(id)) {
      throw new AppError({
        id: `${where}.deleteOrder`,
        message: 'id không hợp lệ',
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    await new OrderApp(ctx).updateOrderItemQuantity(id, { ...req.body, userId });

    res.json('ok');
  } catch (error) {
    next(error);
  }
}

export async function getStockOrderPaginate(
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

    const result = await new OrderApp(ctx).getStockOrderPaginate(filters);

    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getUserDebt(
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

    const result = await new OrderApp(ctx).getUserDebt(filters);

    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function exportMissingProducts(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { order, sort } = req.query;
    const filterObject = tryParseJson(req.query.filters);

    const filters: IOrderFilter = {
      ...filterObject,
      order,
      sort,
    };

    const workbook = await new OrderApp(ctx).exportMissingProducts(filters);

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

export async function exportOrderDetailsToExcel(
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

    const workbook = await new OrderApp(ctx).exportOrderDetailsToExcel(id);

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

export async function exportUserDebtToExcel(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const workbook = await new OrderApp(ctx).exportUserDebtToExcel();

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

export async function exportOrderDetailPDF(
  ctx: Context,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { orderId } = req.params;

    const pdfBuffer = await new OrderApp(ctx).exportOrderDetailsToPDF(orderId);

    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=phieu-giao-hang-${orderId}.pdf`);
    res.status(200).send(pdfBuffer);
  } catch (err) {
    next(err);
  }
}
