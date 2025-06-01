import { StatusCodes } from 'http-status-codes';

import { ISubCategoryFilter } from 'interface';
import { AppError, SubCategory } from 'model';
import { ObjectId } from 'mongodb';
import BaseApp from './base';

const where = 'App.subCategory';

export class SubCategoryApp extends BaseApp {
  async getPaginate(filters: ISubCategoryFilter) {
    try {
      const result = await this.getStore().subCategory().getPaginate(filters);

      return result;
    } catch (error: any) {
      throw new AppError({
        id: `${where}.getPaginate`,
        message: 'Lấy danh sách sub category thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async getList(filters: ISubCategoryFilter) {
    try {
      return await this.getStore().subCategory().getList(filters);
    } catch (error: any) {
      throw new AppError({
        id: `${where}.getList`,
        message: 'Lấy danh sách subCategory thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async getById(id: string) {
    try {
      const data = await this.getStore().subCategory().findById(id);

      if (!data) {
        throw new AppError({
          id: `${where}.getById`,
          message: 'Sub Category không có hoặc chưa tồn tại',
          statusCode: StatusCodes.NOT_FOUND,
        });
      }

      return data;
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.getById`,
        message: 'Lấy dữ liệu Sub Category không thành công',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async create(data: SubCategory) {
    try {
      const result = await this.getStore().subCategory().createOne(data);

      return result;
    } catch (error: any) {
      throw new AppError({
        id: `${where}.create`,
        message: 'Tạo Sub Category thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async update(id: string, data: SubCategory) {
    try {
      const result = await this.getStore().subCategory().updateOne(id, data);

      return result;
    } catch (error: any) {
      throw new AppError({
        id: `${where}.update`,
        message: 'Cập nhật Sub Category thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async delete(id: string) {
    try {
      await this.getStore()
        .subCategory()
        .baseDelete({ _id: new ObjectId(id) });
    } catch (error: any) {
      throw new AppError({
        id: `${where}.delete`,
        message: 'Xóa Sub Category thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }
}
