import { StatusCodes } from 'http-status-codes';

import { IDocumentFilter } from 'interface';
import { AppError, Document } from 'model';
import { ObjectId } from 'mongodb';
import BaseApp from './base';

const where = 'App.document';

export class DocumentApp extends BaseApp {
  async getPaginate(filters: IDocumentFilter) {
    try {
      const result = await this.getStore().document().getPaginate(filters);

      return result;
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.getPaginate`,
        message: 'Lấy danh sách document thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async getList(filters: IDocumentFilter) {
    try {
      return await this.getStore().document().getList(filters);
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.getList`,
        message: 'Lấy danh sách document thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async getById(id: string) {
    try {
      const data = await this.getStore().document().findById(id);

      if (!data) {
        throw new AppError({
          id: `${where}.getById`,
          message: 'Document không có hoặc chưa tồn tại',
          statusCode: StatusCodes.NOT_FOUND,
        });
      }

      return data;
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.getById`,
        message: 'Lấy dữ liệu document không thành công',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async getBySlug(slug: string) {
    try {
      const data = await this.getStore().document().findOne({
        slug,
      });

      if (!data) {
        throw new AppError({
          id: `${where}.getBySlug`,
          message: 'Document không có hoặc chưa tồn tại',
          statusCode: StatusCodes.NOT_FOUND,
        });
      }

      return data;
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.getBySlug`,
        message: 'Lấy dữ liệu document không thành công',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async create(data: Document) {
    try {
      const result = await this.getStore().document().createOne(data);

      return result;
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.create`,
        message: 'Tạo document thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async update(id: string, data: Document) {
    try {
      const oldDocument = await this.getById(id);

      const result = await this.getStore().document().updateOne(id, data);

      if (oldDocument.url !== result.url) {
        this.getServices().cloudinary.deleteByPaths([oldDocument.url]);
      }

      return result;
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.update`,
        message: 'Cập nhật document thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async delete(id: string) {
    try {
      const oldDocument = await this.getById(id);

      await this.getStore()
        .document()
        .baseDelete({ _id: new ObjectId(id) });

      this.getServices().cloudinary.deleteByPaths([oldDocument.url]);
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.delete`,
        message: 'Cập nhật document thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }
}
