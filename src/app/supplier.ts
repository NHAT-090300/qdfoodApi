import { StatusCodes } from 'http-status-codes';

import { ISupplierFilter } from 'interface';
import { AppError, Supplier } from 'model';
import { ObjectId } from 'mongodb';
import BaseApp from './base';

const where = 'App.supplier';

export class SupplierApp extends BaseApp {
  async getPaginate(filters: ISupplierFilter) {
    try {
      const result = await this.getStore().supplier().getPaginate(filters);

      return result;
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.getPaginate`,
        message: 'Lấy danh sách supplier thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async getList(filters: ISupplierFilter) {
    try {
      return await this.getStore().supplier().getList(filters);
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.getList`,
        message: 'Lấy danh sách supplier thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async getById(supplierId: string) {
    try {
      const data = await this.getStore().supplier().findById(supplierId);

      if (!data) {
        throw new AppError({
          id: `${where}.getById`,
          message: 'Supplier không có hoặc chưa tồn tại',
          statusCode: StatusCodes.NOT_FOUND,
        });
      }

      return data;
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.getById`,
        message: 'Lấy dữ liệu supplier không thành công',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async create(data: Supplier) {
    try {
      const result = await this.getStore().supplier().createOne(data);

      return result;
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.create`,
        message: 'Tạo supplier thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async update(supplierId: string, data: Supplier) {
    try {
      const result = await this.getStore().supplier().updateOne(supplierId, data);

      return result;
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.update`,
        message: 'Cập nhật supplier thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async delete(supplierId: string) {
    try {
      await this.getStore()
        .supplier()
        .baseDelete({ _id: new ObjectId(supplierId) });
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.delete`,
        message: 'Cập nhật supplier thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }
}
