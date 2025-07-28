// eslint-disable-next-line import/no-extraneous-dependencies
import ExcelJS from 'exceljs';
import { StatusCodes } from 'http-status-codes';
import { findOrderWithStatus, formatCurrency, getOrderAddress } from 'utils';

import { EInventoryTransactionType, EOrderStatus, IOrderFilter, IOrderItem } from 'interface';
import { AppError, InventoryTransaction, Order } from 'model';
import { ObjectId } from 'mongodb';
import BaseApp from './base';

const where = 'App.order';

export class OrderApp extends BaseApp {
  async getCountByStatuses(filters: IOrderFilter) {
    try {
      return await this.getStore().order().getCountByStatuses(filters);
    } catch (error: any) {
      throw new AppError({
        id: `${where}.getCountByStatuses`,
        message: 'Lấy danh sách order thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async getPaginate(filters: IOrderFilter, project: object = {}) {
    try {
      const result = await this.getStore().order().getPaginate(filters, project);

      return result;
    } catch (error: any) {
      throw new AppError({
        id: `${where}.getPaginate`,
        message: 'Lấy danh sách order thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async getStockOrderPaginate(filters: IOrderFilter) {
    try {
      const result = await this.getStore().order().getStockOrderPaginate(filters);

      return result;
    } catch (error: any) {
      throw new AppError({
        id: `${where}.getStockOrderPaginate`,
        message: 'Lấy danh sách order thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async getStockOrderList(filters: IOrderFilter) {
    try {
      return await this.getStore().order().getStockOrderList(filters);
    } catch (error: any) {
      throw new AppError({
        id: `${where}.getStockOrderList`,
        message: 'Lấy danh sách order thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async getList(filters: IOrderFilter) {
    try {
      return await this.getStore().order().getList(filters);
    } catch (error: any) {
      throw new AppError({
        id: `${where}.getList`,
        message: 'Lấy danh sách order thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async getById(orderId: string) {
    try {
      const data = await this.getStore().order().getOne(orderId);

      if (!data) {
        throw new AppError({
          id: `${where}.getById`,
          message: 'Order không có hoặc chưa tồn tại',
          statusCode: StatusCodes.NOT_FOUND,
        });
      }

      return data;
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.getById`,
        message: 'Lấy dữ liệu order không thành công',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async getOrderWithInventoryInfo(orderId: string) {
    const result = [];

    const order = await this.getStore().order().getOne(orderId);
    if (!order) {
      throw new AppError({
        id: `${where}.getById`,
        message: 'Order không có hoặc chưa tồn tại',
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    for (let i = 0; i < order?.items?.length; i++) {
      const item = order?.items[i];
      const inventory = await this.getStore()
        .inventory()
        .findOne({ productId: new ObjectId(item.productId) });
      const inventoryQuantity = inventory?.quantity ?? 0;
      const missingQuantity = Math.max(0, item.quantity - inventoryQuantity);

      result.push({
        ...item,
        inventoryQuantity,
        missingQuantity,
      });
    }

    return {
      ...order,
      items: result,
    };
  }

  async create(data: Order) {
    try {
      const result = await this.getStore().order().createOne(data);

      return result;
    } catch (error: any) {
      throw new AppError({
        id: `${where}.create`,
        message: 'Tạo order thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async update(orderId: string, data: Order) {
    try {
      const result = await this.getStore().order().updateOne(orderId, data);

      return result;
    } catch (error: any) {
      throw new AppError({
        id: `${where}.update`,
        message: 'Cập nhật order thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async delete(orderId: string) {
    try {
      await this.getStore()
        .order()
        .baseDelete({ _id: new ObjectId(orderId) });
    } catch (error: any) {
      throw new AppError({
        id: `${where}.delete`,
        message: 'Cập nhật order thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async updateStatus(
    orderId: string,
    data: {
      status: EOrderStatus;
      reason?: string;
    },
  ) {
    try {
      const order = await this.getStore().order().findById(orderId);

      if (!order) {
        throw new AppError({
          id: `${where}.string`,
          message: 'Dữ liệu không tồn tại trong hệ thống',
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }

      if (data?.status === EOrderStatus.SHIPPING) {
        await this.getStore().inventory().updateInventoryFromOrder(order);

        for (const item of order.items) {
          const transaction = new InventoryTransaction({
            productId: item.productId,
            type: EInventoryTransactionType.EXPORT,
            quantity: item.quantity,
            orderId: order._id,
            warehousePrice: item.price,
            refundPrice: item.refundAmount,
            note: `Xuất kho tạo khi đơn hàng ${order._id?.toString()}`,
          });

          await this.getStore().inventoryTransaction().createOne(transaction);
        }
      }
      await this.getStore()
        .order()
        .baseUpdate({ _id: new ObjectId(orderId) }, { $set: data });
    } catch (error: any) {
      throw new AppError({
        id: `${where}.updateStatus`,
        message: 'Cập nhật order thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async exportOrders(filters: IOrderFilter) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('orders');

      // Header
      worksheet.addRow([
        'Mã Đơn Hàng',
        'Tên Khách Hàng',
        'Email',
        'Số điện thoại',
        'Địa chỉ',
        'Mã Sản Phẩm',
        'Tên Sản Phẩm',
        'Số Lượng',
        'Giá bán',
        'Thành tiền',
        'Tổng Tiền',
        'Trạng Thái',
      ]);

      // Format header
      worksheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true, size: 12 };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });

      const orders = await this.getStore().order().getList(filters);

      orders.forEach((order) => {
        const address = getOrderAddress(order.shippingAddress);
        const statusLabel = findOrderWithStatus(order.status)?.label || order.status;
        const customerName = order.user?.name || '';
        const customerEmail = order.user?.email || '';
        const customerPhone = order.user?.phoneNumber || '';
        const totalOrderAmount = formatCurrency(order.total || 0);

        if (Array.isArray(order.items)) {
          order.items.forEach((item) => {
            const row = [
              order._id?.toString(),
              customerName,
              customerEmail,
              customerPhone,
              address,
              item.code || '---',
              item.name || '',
              item.quantity,
              formatCurrency(Number(item.price)),
              formatCurrency(Number(item.price * item.quantity)),
              totalOrderAmount,
              statusLabel,
            ];

            const rowRef = worksheet.addRow(row);

            rowRef.eachCell((cell) => {
              cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
              };
            });
          });
        } else {
          console.warn('order.items không phải là array:', order.items);
        }
      });

      worksheet.columns.forEach((column) => {
        column.width = 25;
      });

      return workbook;
    } catch (error: any) {
      throw new AppError({
        id: `${where}.exportOrders`,
        message: 'Xuất báo cáo đơn hàng thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async updateOrderItemRefund(orderId: string, data: IOrderItem) {
    try {
      const order = await this.getStore().order().findById(orderId);

      if (!order) {
        throw new AppError({
          id: `${where}.string`,
          message: 'Dữ liệu không tồn tại trong hệ thống',
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }

      await this.getStore().order().updateOrderItemRefund(orderId, data);
    } catch (error: any) {
      throw new AppError({
        id: `${where}.updateStatus`,
        message: 'Cập nhật order thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async exportMissingProducts(filters: IOrderFilter) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Thiếu sản phẩm');

      // Header
      worksheet.addRow([
        'Tên Sản Phẩm',
        'Số lượng tồn kho',
        'Số lượng sản phẩm đã xác nhận',
        'Số lượng sản phẩm trong đơn hàng',
        'Số lượng đang thiếu',
      ]);

      worksheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true, size: 12 };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });

      const orders = await this.getStore().order().getStockOrderList(filters);

      orders?.forEach((item) => {
        const row = [
          item.product?.name ?? 'Không có tên',
          item.totalInventory ?? 0,
          item.totalOrder ?? 0,
          item.orderCount ?? 0,
          item.missingQuantity > 0 ? item.missingQuantity : 0,
        ];

        const rowRef = worksheet.addRow(row);

        rowRef.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });
      });

      worksheet.columns.forEach((column) => {
        column.width = 25;
      });

      return workbook;
    } catch (error: any) {
      throw new AppError({
        id: `${where}.exportMissingProducts`,
        message: 'Xuất báo cáo thiếu sản phẩm thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async exportOrderDetailsToExcel(orderId: string) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Chi tiết đơn hàng');

    // Header row
    worksheet.addRow(['Tên hàng', 'Mã sản phẩm', 'Số lượng', 'Đơn giá', 'Thành tiền']);

    // Format header
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, size: 12 };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    const order = await this.getStore().order().getOne(orderId);

    // Add rows from order items
    order?.items?.forEach((item: any) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      const total = quantity * unitPrice;

      const row = [item.name ?? 'Không có tên', item.code ?? '---', quantity, unitPrice, total];

      const rowRef = worksheet.addRow(row);

      rowRef.eachCell((cell) => {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });

    worksheet.columns.forEach((column) => {
      column.width = 20;
    });

    return workbook;
  }
}
