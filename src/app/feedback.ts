import { StatusCodes } from 'http-status-codes';

import { IFeedbackFilter } from 'interface';
import { AppError, Feedback } from 'model';
import { ObjectId } from 'mongodb';
import BaseApp from './base';

const where = 'App.feedback';

export class FeedbackApp extends BaseApp {
  async getPaginate(filters: IFeedbackFilter) {
    try {
      const result = await this.getStore().feedback().getPaginate(filters);

      return result;
    } catch (error: any) {
      throw new AppError({
        id: `${where}.getPaginate`,
        message: 'Lấy danh sách feedback thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async getList(filters: IFeedbackFilter) {
    try {
      return await this.getStore().feedback().getList(filters);
    } catch (error: any) {
      throw new AppError({
        id: `${where}.getList`,
        message: 'Lấy danh sách feedback thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async getById(feedbackId: string) {
    try {
      const data = await this.getStore().feedback().findById(feedbackId);

      if (!data) {
        throw new AppError({
          id: `${where}.getById`,
          message: 'Feedback không có hoặc chưa tồn tại',
          statusCode: StatusCodes.NOT_FOUND,
        });
      }

      return data;
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.getById`,
        message: 'Lấy dữ liệu feedback không thành công',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async create(data: Feedback) {
    try {
      const result = await this.getStore().feedback().createOne(data);

      return result;
    } catch (error: any) {
      throw new AppError({
        id: `${where}.create`,
        message: 'Tạo feedback thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async update(feedbackId: string, data: Feedback) {
    try {
      const oldFeedback = await this.getById(feedbackId);

      const result = await this.getStore().feedback().updateOne(feedbackId, data);

      if (oldFeedback.image !== result.image) {
        this.getServices().cloudinary.deleteByPaths([oldFeedback.image]);
      }

      return result;
    } catch (error: any) {
      throw new AppError({
        id: `${where}.update`,
        message: 'Cập nhật feedback thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async delete(feedbackId: string) {
    try {
      const oldFeedback = await this.getById(feedbackId);

      await this.getStore()
        .feedback()
        .baseDelete({ _id: new ObjectId(feedbackId) });

      this.getServices().cloudinary.deleteByPaths([oldFeedback.image]);
    } catch (error: any) {
      throw new AppError({
        id: `${where}.delete`,
        message: 'Cập nhật feedback thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }
}
