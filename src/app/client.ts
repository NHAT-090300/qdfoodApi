import { StatusCodes } from 'http-status-codes';

import { IClientFilter } from 'interface';
import { AppError, Client } from 'model';
import { ObjectId } from 'mongodb';
import BaseApp from './base';

const where = 'App.client';

export class ClientApp extends BaseApp {
  async getPaginate(filters: IClientFilter) {
    try {
      const result = await this.getStore().clients().getPaginate(filters);

      return result;
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.getPaginate`,
        message: 'Lấy danh sách client thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async getList(filters: IClientFilter) {
    try {
      return await this.getStore().clients().getList(filters);
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.getList`,
        message: 'Lấy danh sách client thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async getById(clientId: string) {
    try {
      const data = await this.getStore().clients().findById(clientId);

      if (!data) {
        throw new AppError({
          id: `${where}.getById`,
          message: 'Client không có hoặc chưa tồn tại',
          statusCode: StatusCodes.NOT_FOUND,
        });
      }

      return data;
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.getById`,
        message: 'Lấy dữ liệu client không thành công',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async create(data: Client) {
    try {
      const result = await this.getStore().clients().createOne(data);

      return result;
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.create`,
        message: 'Tạo client thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async update(clientId: string, data: Client) {
    try {
      const oldClient = await this.getById(clientId);

      const result = await this.getStore().clients().updateOne(clientId, data);

      if (oldClient.image !== result.image) {
        this.getServices().cloudinary.deleteByPaths([oldClient.image]);
      }

      return result;
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.update`,
        message: 'Cập nhật client thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async delete(clientId: string) {
    try {
      const oldClient = await this.getById(clientId);

      await this.getStore()
        .clients()
        .baseDelete({ _id: new ObjectId(clientId) });

      this.getServices().cloudinary.deleteByPaths([oldClient.image]);
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.delete`,
        message: 'Cập nhật client thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }
}
