import { StatusCodes } from 'http-status-codes';

import { IOrderFilter } from 'interface';
import { AppError, Order } from 'model';
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
      const data = await this.getStore().order().findById(orderId);

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
}
