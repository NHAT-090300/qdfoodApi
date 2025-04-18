import { StatusCodes } from 'http-status-codes';

import { IRevenueFilter } from 'interface';
import { AppError, Revenue } from 'model';
import { ObjectId } from 'mongodb';
import BaseApp from './base';

const where = 'App.revenue';

export class RevenueApp extends BaseApp {
  async getPaginate(filters: IRevenueFilter) {
    try {
      const result = await this.getStore().revenue().getPaginate(filters);

      return result;
    } catch (error: any) {
      throw new AppError({
        id: `${where}.getPaginate`,
        message: 'Lấy danh sách revenue thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async getList(filters: IRevenueFilter) {
    try {
      return await this.getStore().revenue().getList(filters);
    } catch (error: any) {
      throw new AppError({
        id: `${where}.getList`,
        message: 'Lấy danh sách revenue thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async getById(revenueId: string) {
    try {
      const data = await this.getStore().revenue().findById(revenueId);

      if (!data) {
        throw new AppError({
          id: `${where}.getById`,
          message: 'Revenue không có hoặc chưa tồn tại',
          statusCode: StatusCodes.NOT_FOUND,
        });
      }

      return data;
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.getById`,
        message: 'Lấy dữ liệu revenue không thành công',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async create(data: Revenue) {
    try {
      const result = await this.getStore().revenue().createOne(data);

      return result;
    } catch (error: any) {
      throw new AppError({
        id: `${where}.create`,
        message: 'Tạo revenue thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async update(revenueId: string, data: Revenue) {
    try {
      const result = await this.getStore().revenue().updateOne(revenueId, data);

      return result;
    } catch (error: any) {
      throw new AppError({
        id: `${where}.update`,
        message: 'Cập nhật revenue thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async delete(revenueId: string) {
    try {
      await this.getStore()
        .revenue()
        .baseDelete({ _id: new ObjectId(revenueId) });
    } catch (error: any) {
      throw new AppError({
        id: `${where}.delete`,
        message: 'Cập nhật revenue thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }
}
