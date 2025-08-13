import ExcelJS from 'exceljs';
import { StatusCodes } from 'http-status-codes';
import { IInventoryFilter, IProductLogItem } from 'interface';
import { AppError, Inventory } from 'model';
import moment from 'moment';
import { ObjectId } from 'mongodb';

import BaseApp from './base';

const where = 'App.inventory';

export class InventoryApp extends BaseApp {
  async getPaginate(filters: IInventoryFilter) {
    try {
      const result = await this.getStore().inventory().getPaginate(filters);

      return result;
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.getPaginate`,
        message: 'Lấy danh sách inventory thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async getList(filters: IInventoryFilter) {
    try {
      return await this.getStore().inventory().getList(filters);
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.getList`,
        message: 'Lấy danh sách inventory thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async getById(inventoryId: string) {
    try {
      const data = await this.getStore().inventory().findById(inventoryId);

      if (!data) {
        throw new AppError({
          id: `${where}.getById`,
          message: 'Inventory không có hoặc chưa tồn tại',
          statusCode: StatusCodes.NOT_FOUND,
        });
      }

      return data;
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.getById`,
        message: 'Lấy dữ liệu inventory không thành công',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async create(data: Inventory) {
    try {
      const isExist = await this.getStore()
        .inventory()
        .findOne({
          productId: new ObjectId(data?.productId),
          // supplierId: new ObjectId(data?.supplierId),
        });

      if (isExist) {
        throw new AppError({
          id: `${where}.create`,
          message: 'Sản phẩm đã tồn tại',
          statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        });
      }

      const result = await this.getStore().inventory().createOne(data);

      return result;
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.create`,
        message: 'Tạo inventory thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async update(inventoryId: string, data: Inventory) {
    try {
      const result = await this.getStore().inventory().updateOne(inventoryId, data);

      return result;
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.update`,
        message: 'Cập nhật inventory thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async delete(inventoryId: string) {
    try {
      await this.getStore()
        .inventory()
        .baseDelete({ _id: new ObjectId(inventoryId) });
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.delete`,
        message: 'Cập nhật inventory thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async createMany(inventorys: Inventory[]) {
    try {
      await this.getStore().inventory().createMany(inventorys);
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.createMany`,
        message: 'Tạo inventory thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async exportInventoryToExcel(filters: IInventoryFilter) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Tồn kho');

    // Header row
    worksheet.addRow(['Mã sản phẩm', 'Tên sản phẩm', 'Số lượng', 'Hoàn trả', 'Ngày cập nhật']);

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

    const inventory = await this.getStore().inventory().getList(filters);

    // Add inventory rows
    inventory?.forEach((item: any) => {
      const product = item.product || {};
      const code = product.code ?? '---';
      const name = product.name ?? 'Không có tên';
      const quantity = item.quantity ?? 0;
      const updatedDate = moment(item?.updatedAt).format('HH:mm:ss DD/MM/YYYY') ?? '';

      const row = [code, name, quantity, updatedDate];

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

  // Kiểm tra sl nguyên liệu đầu vào
  async checkInventoryFast(ingredientItems: IProductLogItem[]) {
    const checks = ingredientItems?.map(async (item) => {
      const stock = await this.getStore()
        .inventory()
        .findOne({
          productId: new ObjectId(item?.productId),
        });

      if (!stock) {
        throw new AppError({
          id: `${where}.create`,
          message: `Sản phẩm ${item.productId} không tồn tại trong kho`,
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }

      if (item.quantity > stock.quantity) {
        throw new AppError({
          id: `${where}.create`,
          message: `Nguyên liệu ${item.productId} vượt quá số lượng tồn kho (${stock.quantity})`,
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }
    });
    await Promise.all(checks);
  }
}
