import ExcelJS from 'exceljs';
import { StatusCodes } from 'http-status-codes';
import { EInventoryTransactionType, IInventoryTransactionFilter } from 'interface';
import { AppError, InventoryTransaction } from 'model';
import moment from 'moment';
import { Decimal128, ObjectId } from 'mongodb';
import { getTransactionTypeTag } from 'utils';

import BaseApp from './base';

const where = 'App.inventoryTransaction';

export class InventoryTransactionApp extends BaseApp {
  async getPaginate(filters: IInventoryTransactionFilter) {
    try {
      const result = await this.getStore().inventoryTransaction().getPaginate(filters);

      return result;
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.getPaginate`,
        message: 'Lấy danh sách inventoryTransaction thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async getList(filters: IInventoryTransactionFilter) {
    try {
      return await this.getStore().inventoryTransaction().getList(filters);
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.getList`,
        message: 'Lấy danh sách inventoryTransaction thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async getById(inventoryTransactionId: string) {
    try {
      const data = await this.getStore().inventoryTransaction().findById(inventoryTransactionId);

      if (!data) {
        throw new AppError({
          id: `${where}.getById`,
          message: 'InventoryTransaction không có hoặc chưa tồn tại',
          statusCode: StatusCodes.NOT_FOUND,
        });
      }

      return data;
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.getById`,
        message: 'Lấy dữ liệu inventoryTransaction không thành công',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async create(data: InventoryTransaction) {
    try {
      if (data?.type === EInventoryTransactionType.REFUND) {
        await this.getStore()
          .inventory()
          .baseUpdate(
            {
              productId: new ObjectId(data?.productId),
            },
            {
              $inc: {
                quantity: Decimal128.fromString(data.quantity.toString()),
              },
            },
          );
      }

      const result = await this.getStore().inventoryTransaction().createOne(data);

      return result;
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.create`,
        message: 'Tạo inventoryTransaction thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async createMany(data: InventoryTransaction[]) {
    try {
      const result = await this.getStore().inventoryTransaction().createMany(data);

      return result;
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.createMany`,
        message: 'Tạo inventoryTransaction thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async update(inventoryTransactionId: string, data: InventoryTransaction) {
    try {
      const result = await this.getStore()
        .inventoryTransaction()
        .updateOne(inventoryTransactionId, data);

      return result;
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.update`,
        message: 'Cập nhật inventoryTransaction thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async delete(inventoryTransactionId: string) {
    try {
      await this.getStore()
        .inventoryTransaction()
        .baseDelete({ _id: new ObjectId(inventoryTransactionId) });
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.delete`,
        message: 'Cập nhật inventoryTransaction thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async exportInventoryTransactionsToExcel(filters: IInventoryTransactionFilter) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Giao dịch kho');

      // Header row
      worksheet.addRow([
        'Mã sản phẩm',
        'Tên sản phẩm',
        'Số lượng',
        'Giao dịch kho',
        'Giá sản phẩm',
        'Số tiền hoàn trả',
        'Thông tin',
        'Ngày tạo',
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

      const transactions = await this.getStore().inventoryTransaction().getList(filters);
      // Add data rows
      transactions.forEach((item: any) => {
        const product = item.product ?? {};
        const row = [
          product.code ?? '-',
          product.name ?? 'Không có tên',
          item.quantity ?? 0,
          getTransactionTypeTag(item.type)?.text ?? '-',
          item.price ?? 0,
          item.refundAmount ?? 0,
          item.note ?? '',
          moment(item?.createdAt).format('HH:mm:ss DD/MM/YYYY') ?? '',
        ];

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
        column.width = 25;
      });

      return workbook;
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `Inventory.exportInventoryTransactionsToExcel`,
        message: 'Xuất báo cáo giao dịch kho thất bại',
        statusCode: 500,
        detail: error,
      });
    }
  }
}
