import { StatusCodes } from 'http-status-codes';

import { IBannerFilter } from 'interface';
import { AppError, Banner } from 'model';
import { ObjectId } from 'mongodb';
import BaseApp from './base';

const where = 'App.banner';

export class BannerApp extends BaseApp {
  async getPaginate(filters: IBannerFilter) {
    try {
      const result = await this.getStore().banner().getPaginate(filters);

      return result;
    } catch (error: any) {
      throw new AppError({
        id: `${where}.getPaginate`,
        message: 'Lấy danh sách banner thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async getList(filters: IBannerFilter) {
    try {
      return await this.getStore().banner().getList(filters);
    } catch (error: any) {
      throw new AppError({
        id: `${where}.getList`,
        message: 'Lấy danh sách banner thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async getById(bannerId: string) {
    try {
      const data = await this.getStore().banner().findById(bannerId);

      if (!data) {
        throw new AppError({
          id: `${where}.getById`,
          message: 'Banner không có hoặc chưa tồn tại',
          statusCode: StatusCodes.NOT_FOUND,
        });
      }

      return data;
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.getById`,
        message: 'Lấy dữ liệu banner không thành công',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async create(data: Banner) {
    try {
      const result = await this.getStore().banner().createOne(data);

      return result;
    } catch (error: any) {
      throw new AppError({
        id: `${where}.create`,
        message: 'Tạo banner thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async update(bannerId: string, data: Banner) {
    try {
      const oldBanner = await this.getById(bannerId);

      const result = await this.getStore().banner().updateOne(bannerId, data);

      if (oldBanner.image !== result.image) {
        this.getServices().cloudinary.deleteByPaths([oldBanner.image]);
      }

      return result;
    } catch (error: any) {
      throw new AppError({
        id: `${where}.update`,
        message: 'Cập nhật banner thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async delete(bannerId: string) {
    try {
      const oldBanner = await this.getById(bannerId);

      await this.getStore()
        .banner()
        .baseDelete({ _id: new ObjectId(bannerId) });

      this.getServices().cloudinary.deleteByPaths([oldBanner.image]);
    } catch (error: any) {
      throw new AppError({
        id: `${where}.delete`,
        message: 'Cập nhật banner thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }
}
