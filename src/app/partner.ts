import { StatusCodes } from 'http-status-codes';

import { IPartnerFilter } from 'interface';
import { AppError, Partner } from 'model';
import { ObjectId } from 'mongodb';
import BaseApp from './base';

const where = 'App.partner';

export class PartnerApp extends BaseApp {
  async getPaginate(filters: IPartnerFilter) {
    try {
      const result = await this.getStore().partner().getPaginate(filters);

      return result;
    } catch (error: any) {
      throw new AppError({
        id: `${where}.getPaginate`,
        message: 'Lấy danh sách partner thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async getList(filters: IPartnerFilter) {
    try {
      return await this.getStore().partner().getList(filters);
    } catch (error: any) {
      throw new AppError({
        id: `${where}.getList`,
        message: 'Lấy danh sách partner thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async getById(partnerId: string) {
    try {
      const data = await this.getStore().partner().findById(partnerId);

      if (!data) {
        throw new AppError({
          id: `${where}.getById`,
          message: 'Partner không có hoặc chưa tồn tại',
          statusCode: StatusCodes.NOT_FOUND,
        });
      }

      return data;
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.getById`,
        message: 'Lấy dữ liệu partner không thành công',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async create(data: Partner) {
    try {
      const result = await this.getStore().partner().createOne(data);

      return result;
    } catch (error: any) {
      throw new AppError({
        id: `${where}.create`,
        message: 'Tạo partner thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async update(partnerId: string, data: Partner) {
    try {
      const oldPartner = await this.getById(partnerId);

      const result = await this.getStore().partner().updateOne(partnerId, data);

      if (oldPartner.image !== result.image) {
        this.getServices().cloudinary.deleteByPaths([oldPartner.image]);
      }

      return result;
    } catch (error: any) {
      throw new AppError({
        id: `${where}.update`,
        message: 'Cập nhật partner thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async delete(partnerId: string) {
    try {
      const oldPartner = await this.getById(partnerId);

      await this.getStore()
        .partner()
        .baseDelete({ _id: new ObjectId(partnerId) });

      this.getServices().cloudinary.deleteByPaths([oldPartner.image]);
    } catch (error: any) {
      throw new AppError({
        id: `${where}.delete`,
        message: 'Cập nhật partner thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }
}
