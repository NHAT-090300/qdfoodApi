import { StatusCodes } from 'http-status-codes';

import { IProductPriceFilter } from 'interface';
import { AppError, ProductPrice } from 'model';
import { ObjectId } from 'mongodb';
import BaseApp from './base';

const where = 'App.productPrice';

export class ProductPriceApp extends BaseApp {
  async getPaginateAdmin(filters: IProductPriceFilter) {
    try {
      const result = await this.getStore().productPrice().getPaginateAdmin(filters);

      return result;
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.getPaginate`,
        message: 'Lấy danh sách productPrice thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async bulkCreateProductPrice(userId: string, productIds: string[]) {
    try {
      return this.getStore().productPrice().bulkProductPrice(userId, productIds);
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.getPaginate`,
        message: 'Lấy danh sách productPrice thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async bulkCreateProductPriceWithPrice(
    userId: string,
    products: { code: string; price: number }[],
  ) {
    const validProducts: { code: string; price: number }[] = [];
    const errors: { code: string; message: string }[] = [];

    const seenCodes = new Set<string>();

    products.forEach((item, index) => {
      const { code, price } = item;

      if (!code || typeof code !== 'string' || code.trim() === '') {
        errors.push({ code: `row_${index + 2}`, message: 'Mã sản phẩm không hợp lệ' });
        return;
      }

      const trimmedCode = code.trim();
      if (seenCodes.has(trimmedCode)) {
        errors.push({ code: trimmedCode, message: 'Mã sản phẩm bị trùng trong danh sách' });
        return;
      }
      seenCodes.add(trimmedCode);

      if (typeof price !== 'number' || Number.isNaN(price) || price <= 0) {
        errors.push({ code: trimmedCode, message: 'Giá phải là số dương' });
        return;
      }

      validProducts.push({ code: trimmedCode, price });
    });

    if (validProducts.length === 0) {
      throw new AppError({
        id: `${where}.bulkCreate`,
        message: 'Không có sản phẩm hợp lệ để tạo đề xuất giá',
        statusCode: StatusCodes.BAD_REQUEST,
        detail: { errors },
      });
    }

    try {
      // === 2. Kiểm tra sản phẩm tồn tại trong DB ===
      const codes = validProducts.map((p) => p.code);
      const existingProducts = await this.getStore()
        .product()
        .find({ code: { $in: codes } });

      const existingCodeMap = new Map(existingProducts.map((p) => [p.code, p._id]));

      const missingCodes = codes.filter((code) => !existingCodeMap.has(code));
      if (missingCodes.length > 0) {
        missingCodes.forEach((code) => {
          errors.push({ code, message: 'Sản phẩm không tồn tại trong hệ thống' });
        });
      }

      const finalProducts = validProducts
        .filter((p) => existingCodeMap.has(p.code))
        .map((p) => ({
          code: p.code,
          price: p.price,
          productId: existingCodeMap.get(p.code)!,
        }));

      let createdCount = 0;
      const created: { code: string; price: number }[] = [];

      if (finalProducts.length > 0) {
        await this.getStore()
          .productPrice()
          .bulkProductPriceWithPrice(
            userId,
            finalProducts.map((p) => ({
              code: p.code,
              price: p.price,
              productId: p.productId,
            })),
          );

        createdCount = finalProducts.length;
        created.push(...finalProducts.map((p) => ({ code: p.code, price: p.price })));
      }

      return {
        success: createdCount,
        failed: errors.length,
        errors,
        created,
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.bulkCreate`,
        message: 'Tạo đề xuất giá hàng loạt thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error.message || error,
      });
    }
  }

  async syncPriceProposalsOneUser(userId: string) {
    try {
      const proposals = await this.getStore().productPriceProposal().getList({
        userId,
      });

      return this.getStore().productPrice().syncPriceProposals(proposals);
    } catch (error: any) {
      if (error instanceof AppError) throw error;

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
      if (error instanceof AppError) throw error;

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

  async getByUserId(userId: string) {
    try {
      const data = await this.getStore().productPrice().getList({
        userId,
      });

      if (!data) {
        throw new AppError({
          id: `${where}.getByUserId`,
          message: 'productPrice lấy dữ liệu không thành công',
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
      if (error instanceof AppError) throw error;

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
      if (error instanceof AppError) throw error;

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
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.delete`,
        message: 'Cập nhật productPrice thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }
}
