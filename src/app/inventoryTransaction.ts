import { StatusCodes } from 'http-status-codes';

import { IInventoryTransactionFilter } from 'interface';
import { AppError, InventoryTransaction } from 'model';
import { ObjectId } from 'mongodb';
import BaseApp from './base';

const where = 'App.inventoryTransaction';

export class InventoryTransactionApp extends BaseApp {
  async getPaginate(filters: IInventoryTransactionFilter) {
    try {
      const result = await this.getStore().inventoryTransaction().getPaginate(filters);

      return result;
    } catch (error: any) {
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
      const result = await this.getStore().inventoryTransaction().createOne(data);

      return result;
    } catch (error: any) {
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
      throw new AppError({
        id: `${where}.delete`,
        message: 'Cập nhật inventoryTransaction thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }
}
