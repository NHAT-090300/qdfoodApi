import { StatusCodes } from 'http-status-codes';
import { ETypeOtp, IOtp } from 'interface';
import { AppError, Otp } from 'model';
import BaseApp from './base';

const where = 'App.otp';

export class OtpApp extends BaseApp {
  async getById(id: string) {
    try {
      const data = await this.getStore()
        .otp()
        .findById(id, {
          projection: {
            otp: 1,
            otpExpiresAt: 1,
            isVerified: 1,
            email: 1,
            password: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        });

      if (!data) {
        throw new AppError({
          id: `${where}.getById`,
          message: 'Otp không có hoặc chưa tồn tại',
          statusCode: StatusCodes.NOT_FOUND,
        });
      }

      return data;
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.getById`,
        message: 'Lấy dữ liệu otp không thành công',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async getByEmail(email: string) {
    try {
      const data = await this.getStore().otp().findOne({
        email,
      });

      return data;
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.getByEmail`,
        message: 'Lấy dữ liệu otp không thành công',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async getOne(filter: { email?: string; isVerified?: boolean; type?: ETypeOtp }) {
    try {
      const data = await this.getStore()
        .otp()
        .findOne(filter, {}, { sort: { createdAt: -1 } });

      return data;
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.getByEmail`,
        message: 'Lấy dữ liệu otp không thành công',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async create(data: Otp) {
    try {
      const result = await this.getStore().otp().createOne(data);

      return {
        _id: result._id,
        email: result.email,
        otpExpiresAt: result.otpExpiresAt,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      };
    } catch (error: any) {
      throw new AppError({
        id: `${where}.create`,
        message: 'Tạo otp thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async update(id: string, data: IOtp) {
    try {
      const checkData = await this.getStore().otp().findById(id);

      if (!checkData) {
        throw new AppError({
          id: `${where}.update`,
          message: 'Không tìm thấy otp',
          statusCode: StatusCodes.NOT_FOUND,
        });
      }
      const newData = new Otp({ ...checkData, ...data });

      const result = await this.getStore().otp().updateOne(id, newData);

      return result;
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.update`,
        message: 'Cập nhật otp thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }
}
