import { StatusCodes } from 'http-status-codes';

import { INewsFilter } from 'interface';
import { AppError, News } from 'model';
import { ObjectId } from 'mongodb';
import BaseApp from './base';

const where = 'App.news';

export class NewsApp extends BaseApp {
  async getPaginate(filters: INewsFilter) {
    try {
      const result = await this.getStore().news().getPaginate(filters);

      return result;
    } catch (error: any) {
      throw new AppError({
        id: `${where}.getPaginate`,
        message: 'Lấy danh sách news thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async getList(filters: INewsFilter) {
    try {
      return await this.getStore().news().getList(filters);
    } catch (error: any) {
      throw new AppError({
        id: `${where}.getList`,
        message: 'Lấy danh sách news thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async getById(id: string) {
    try {
      const data = await this.getStore().news().findById(id);

      if (!data) {
        throw new AppError({
          id: `${where}.getById`,
          message: 'News không có hoặc chưa tồn tại',
          statusCode: StatusCodes.NOT_FOUND,
        });
      }

      return data;
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.getById`,
        message: 'Lấy dữ liệu news không thành công',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async create(data: News) {
    try {
      const result = await this.getStore().news().createOne(data);

      return result;
    } catch (error: any) {
      throw new AppError({
        id: `${where}.create`,
        message: 'Tạo news thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async update(id: string, data: News) {
    try {
      const oldNews = await this.getById(id);

      const result = await this.getStore().news().updateOne(id, data);

      if (oldNews.image !== result.image) {
        this.getServices().cloudinary.deleteByPaths([oldNews.image]);
      }

      return result;
    } catch (error: any) {
      throw new AppError({
        id: `${where}.update`,
        message: 'Cập nhật news thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async delete(id: string) {
    try {
      const oldNews = await this.getById(id);

      await this.getStore()
        .news()
        .baseDelete({ _id: new ObjectId(id) });

      this.getServices().cloudinary.deleteByPaths([oldNews.image]);
    } catch (error: any) {
      throw new AppError({
        id: `${where}.delete`,
        message: 'Cập nhật news thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }
}
