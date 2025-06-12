import { StatusCodes } from 'http-status-codes';

import { ICategoryFilter } from 'interface';
import { AppError, Category } from 'model';
import { ObjectId } from 'mongodb';
import BaseApp from './base';

const where = 'App.category';

export class CategoryApp extends BaseApp {
  async getPaginate(filters: ICategoryFilter) {
    try {
      const result = await this.getStore().category().getPaginate(filters);

      return result;
    } catch (error: any) {
      throw new AppError({
        id: `${where}.getPaginate`,
        message: 'Lấy danh sách category thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async getList(filters: ICategoryFilter) {
    try {
      return await this.getStore().category().getList(filters);
    } catch (error: any) {
      throw new AppError({
        id: `${where}.getList`,
        message: 'Lấy danh sách category thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async getListSubCategory() {
    try {
      return await this.getStore().category().getListSubCategory();
    } catch (error: any) {
      throw new AppError({
        id: `${where}.getListSubCategory`,
        message: 'Lấy danh sách category thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async getById(id: string) {
    try {
      const data = await this.getStore().category().findById(id);

      if (!data) {
        throw new AppError({
          id: `${where}.getById`,
          message: 'Category không có hoặc chưa tồn tại',
          statusCode: StatusCodes.NOT_FOUND,
        });
      }

      return data;
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.getById`,
        message: 'Lấy dữ liệu category không thành công',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async create(data: Category) {
    try {
      const result = await this.getStore().category().createOne(data);

      return result;
    } catch (error: any) {
      throw new AppError({
        id: `${where}.create`,
        message: 'Tạo category thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async update(id: string, data: Category) {
    try {
      const oldCategory = await this.getById(id);

      const result = await this.getStore().category().updateOne(id, data);

      if (oldCategory.image !== result.image) {
        this.getServices().cloudinary.deleteByPaths([oldCategory.image]);
      }

      return result;
    } catch (error: any) {
      throw new AppError({
        id: `${where}.update`,
        message: 'Cập nhật category thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async delete(id: string) {
    try {
      const oldCategory = await this.getById(id);

      await this.getStore()
        .category()
        .baseDelete({ _id: new ObjectId(id) });

      this.getServices().cloudinary.deleteByPaths([oldCategory.image]);
    } catch (error: any) {
      throw new AppError({
        id: `${where}.delete`,
        message: 'Xóa category thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }
}
