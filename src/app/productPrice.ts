import { StatusCodes } from 'http-status-codes';

import { IProductPriceFilter } from 'interface';
import { AppError, ProductPrice } from 'model';
import { ObjectId } from 'mongodb';
import BaseApp from './base';

const where = 'App.productPrice';

export class ProductPriceApp extends BaseApp {
  async getPaginate(filters: IProductPriceFilter) {
    try {
      const result = await this.getStore().productPrice().getPaginate(filters);

      return result;
    } catch (error: any) {
      throw new AppError({
        id: `${where}.getPaginate`,
        message: 'Lấy danh sách productPrice thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async getList(filters: IProductPriceFilter) {
    try {
      return await this.getStore().productPrice().getList(filters);
    } catch (error: any) {
      throw new AppError({
        id: `${where}.getList`,
        message: 'Lấy danh sách productPrice thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async getById(productPriceId: string) {
    try {
      const data = await this.getStore().productPrice().findById(productPriceId);

      if (!data) {
        throw new AppError({
          id: `${where}.getById`,
          message: 'ProductPrice không có hoặc chưa tồn tại',
          statusCode: StatusCodes.NOT_FOUND,
        });
      }

      return data;
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.getById`,
        message: 'Lấy dữ liệu productPrice không thành công',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async create(data: ProductPrice) {
    try {
      const result = await this.getStore().productPrice().createOne(data);

      return result;
    } catch (error: any) {
      throw new AppError({
        id: `${where}.create`,
        message: 'Tạo productPrice thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async update(productPriceId: string, data: ProductPrice) {
    try {
      const result = await this.getStore().productPrice().updateOne(productPriceId, data);

      return result;
    } catch (error: any) {
      throw new AppError({
        id: `${where}.update`,
        message: 'Cập nhật productPrice thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async delete(productPriceId: string) {
    try {
      await this.getStore()
        .productPrice()
        .baseDelete({ _id: new ObjectId(productPriceId) });
    } catch (error: any) {
      throw new AppError({
        id: `${where}.delete`,
        message: 'Cập nhật productPrice thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }
}
