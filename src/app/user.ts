import { StatusCodes } from 'http-status-codes';
import { IUserFilter, TUserUpdate, ERole } from 'interface';
import { AppError, User } from 'model';
import BaseApp from './base';

const where = 'App.user';

export class UserApp extends BaseApp {
  async getPaginate(filters: IUserFilter) {
    try {
      const result = await this.getStore().user().getPaginate(filters);

      return result;
    } catch (error: any) {
      throw new AppError({
        id: `${where}.getPaginate`,
        message: 'Lấy danh sách user thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async getList(filters: IUserFilter) {
    try {
      return await this.getStore().user().getList(filters);
    } catch (error: any) {
      throw new AppError({
        id: `${where}.getList`,
        message: 'Lấy danh sách user thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async getById(id: string) {
    try {
      const data = await this.getStore()
        .user()
        .findById(id, {
          projection: {
            avatar: 1,
            name: 1,
            email: 1,
            phoneNumber: 1,
            role: 1,
            isDelete: 1,
            social: 1,
          },
        });

      if (!data) {
        throw new AppError({
          id: `${where}.getById`,
          message: 'User không có hoặc chưa tồn tại',
          statusCode: StatusCodes.NOT_FOUND,
        });
      }

      return data;
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.getById`,
        message: 'Lấy dữ liệu user không thành công',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async getByEmail(email: string) {
    try {
      const data = await this.getStore().user().findOne({
        email,
      });

      return data;
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.getByEmail`,
        message: 'Lấy dữ liệu user không thành công',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async create(data: User) {
    try {
      const result = await this.getStore().user().createOne(data);

      return result;
    } catch (error: any) {
      throw new AppError({
        id: `${where}.create`,
        message: 'Tạo user thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async update(id: string, data: TUserUpdate) {
    try {
      const oldUser = await this.getById(id);

      const newData = new User({
        ...data,
        password: oldUser?.password,
      });

      const result = await this.getStore().user().updateOne(id, newData);

      if (oldUser?.avatar !== result?.avatar) {
        this.getServices().cloudinary.deleteByPaths([oldUser?.avatar as string]);
      }

      return result;
    } catch (error: any) {
      throw new AppError({
        id: `${where}.update`,
        message: 'Cập nhật user thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async updatePassword(
    id: string,
    data: {
      password: string;
    },
  ) {
    try {
      const oldUser = await this.getById(id);

      const newData = new User({
        ...oldUser,
        ...data,
      });

      const result = await this.getStore().user().updateOne(id, newData);

      if (oldUser?.avatar !== result?.avatar) {
        this.getServices().cloudinary.deleteByPaths([oldUser?.avatar as string]);
      }

      return result;
    } catch (error: any) {
      throw new AppError({
        id: `${where}.update`,
        message: 'Cập nhật user thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async delete(id: string) {
    try {
      const oldUser = await this.getById(id);

      if (oldUser?.role === ERole.SUPPER) {
        throw new AppError({
          id: `${where}.update`,
          message: 'Cập nhật user thất bại',
          statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        });
      }
      const result = await this.getStore().user().deleteOne(id, new User(oldUser));

      return result;
    } catch (error: any) {
      throw new AppError({
        id: `${where}.update`,
        message: 'Cập nhật user thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }
}
