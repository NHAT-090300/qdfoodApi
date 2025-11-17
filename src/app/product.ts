import { StatusCodes } from 'http-status-codes';

import { IProductFilter } from 'interface';
import { AppError, Product } from 'model';
import { ObjectId } from 'mongodb';
import BaseApp from './base';

const where = 'App.product';

export class ProductApp extends BaseApp {
  async getPaginate(filters: IProductFilter) {
    try {
      const result = await this.getStore().product().getPaginate(filters);

      return result;
    } catch (error: any) {
      const isAppError = error instanceof AppError;
      if (isAppError) throw error;

      throw new AppError({
        id: `${where}.getPaginate`,
        message: 'Lấy danh sách product thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error.message || error,
      });
    }
  }

  async getListMoreByUser(filters: IProductFilter) {
    try {
      const result = await this.getStore().product().getListMoreByUser(filters);

      return result;
    } catch (error: any) {
      const isAppError = error instanceof AppError;
      if (isAppError) throw error;

      throw new AppError({
        id: `${where}.getListMoreByUser`,
        message: 'Lấy danh sách product thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error?.message || error,
      });
    }
  }

  async getListCartByUser(filters: IProductFilter) {
    try {
      const result = await this.getStore().product().getListCartByUser(filters);

      return result;
    } catch (error: any) {
      const isAppError = error instanceof AppError;
      if (isAppError) throw error;
      throw new AppError({
        id: `${where}.getListCartByUser`,
        message: 'Lấy danh sách product thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error?.message || error,
      });
    }
  }

  async getRandomProduct(filters: IProductFilter) {
    try {
      const result = await this.getStore().product().getRandomProduct(filters);

      return result;
    } catch (error: any) {
      const isAppError = error instanceof AppError;
      if (isAppError) throw error;

      throw new AppError({
        id: `${where}.getRandomProduct`,
        message: 'Lấy danh sách product thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error?.message || error,
      });
    }
  }

  async getListWithInventory(filters: IProductFilter) {
    try {
      return await this.getStore().product().getListWithInventory(filters);
    } catch (error: any) {
      const isAppError = error instanceof AppError;
      if (isAppError) throw error;

      throw new AppError({
        id: `${where}.getListWithInventory`,
        message: 'Lấy danh sách product thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error?.message || error,
      });
    }
  }

  async getListByUser(filters: IProductFilter) {
    try {
      return await this.getStore().product().getListByUser(filters);
    } catch (error: any) {
      const isAppError = error instanceof AppError;
      if (isAppError) throw error;

      throw new AppError({
        id: `${where}.getList`,
        message: 'Lấy danh sách product thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error?.message || error,
      });
    }
  }

  async getList(filters: IProductFilter) {
    try {
      return await this.getStore().product().getList(filters);
    } catch (error: any) {
      const isAppError = error instanceof AppError;
      if (isAppError) throw error;

      throw new AppError({
        id: `${where}.getList`,
        message: 'Lấy danh sách product thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error?.message || error,
      });
    }
  }

  async getById(productId: string) {
    try {
      const data = await this.getStore().product().findById(productId);

      if (!data) {
        throw new AppError({
          id: `${where}.getById`,
          message: 'Product không có hoặc chưa tồn tại',
          statusCode: StatusCodes.NOT_FOUND,
        });
      }

      return data;
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.getById`,
        message: 'Lấy dữ liệu product không thành công',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error?.message || error,
      });
    }
  }

  async getDetail({ slug }: { slug: string }) {
    try {
      const data = await this.getStore()
        .product()
        .findOnePopulate(
          {
            slug,
          },
          [
            {
              path: 'category',
              localField: 'category',
              foreignField: '_id',
              as: 'categoryDetail',
            },
            {
              path: 'users',
              localField: 'owner',
              foreignField: '_id',
              as: 'ownerDetail',
            },
          ],
        );

      if (!data) {
        throw new AppError({
          id: `${where}.getDetail`,
          message: 'Product không có hoặc chưa tồn tại',
          statusCode: StatusCodes.NOT_FOUND,
        });
      }

      return data;
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.getDetail`,
        message: 'Lấy dữ liệu product không thành công',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async create(data: Product) {
    try {
      const productExit = await this.getStore().product().findOne({ code: data?.code });

      if (productExit) {
        throw new AppError({
          id: `${where}.create`,
          message: 'Mã sản phẩm đã tồn tại',
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }

      const result = await this.getStore().product().createOne(data);

      return result;
    } catch (error: any) {
      const isAppError = error instanceof AppError;
      if (isAppError) throw error;

      throw new AppError({
        id: 'product.create.internal_error',
        message: 'Tạo sản phẩm thất bại. Vui lòng thử lại sau.',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error.message || error,
      });
    }
  }

  async update(productId: string, data: Product) {
    try {
      const productExit = await this.getStore().product().findOne({ code: data?.code });

      if (productExit && productId !== productExit?._id?.toString()) {
        throw new AppError({
          id: `${where}.create`,
          message: 'Mã sản phẩm đã tồn tại',
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }

      const result = await this.getStore().product().updateOne(productId, data);

      return result;
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.update`,
        message: 'Cập nhật product thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error?.message || error,
      });
    }
  }

  async delete(productId: string) {
    try {
      await this.getStore()
        .product()
        .baseDelete({ _id: new ObjectId(productId) });
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError({
        id: `${where}.delete`,
        message: 'Cập nhật product thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async findNonExistingCodes(codes: string[]) {
    try {
      const nonExistingCodes = await this.getStore().product().findNonExistingCodes(codes);
      return nonExistingCodes;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError({
        id: `${where}.findNonExistingCodes`,
        message: 'Kiểm tra mã sản phẩm thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }
  async getListByCodes(codes: string[]) {
    try {
      const result = await this.getStore().product().getAssetsByCodes(codes);
      return result;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError({
        id: `${where}.getListByCodes`,
        message: 'Lấy danh sách sản phẩm thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }
}
