import { StatusCodes } from 'http-status-codes';

import { IProductPrice, IProductPriceProposalFilter } from 'interface';
import { AppError, ProductPriceProposal } from 'model';
import { ObjectId } from 'mongodb';
import BaseApp from './base';

const where = 'App.productPriceProposal';

export class ProductPriceProposalApp extends BaseApp {
  async getPaginateAdmin(filters: IProductPriceProposalFilter) {
    try {
      const result = await this.getStore().productPriceProposal().getPaginateAdmin(filters);

      return result;
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.getPaginate`,
        message: 'Lấy danh sách productPriceProposal thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async bulkCreateProductPriceProposal(userId: string, productIds: string[]) {
    try {
      return this.getStore().productPriceProposal().bulkProductPriceProposal(userId, productIds);
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.getPaginate`,
        message: 'Lấy danh sách productPriceProposal thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async upsertPriceProposals(userId: string, prices: IProductPrice[]) {
    try {
      return this.getStore().productPriceProposal().upsertPriceProposals(userId, prices);
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.getPaginate`,
        message: 'Lấy danh sách productPriceProposal thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async getList(filters: IProductPriceProposalFilter) {
    try {
      return await this.getStore().productPriceProposal().getList(filters);
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.getList`,
        message: 'Lấy danh sách productPriceProposal thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async getById(productPriceProposalId: string) {
    try {
      const data = await this.getStore().productPriceProposal().findById(productPriceProposalId);

      if (!data) {
        throw new AppError({
          id: `${where}.getById`,
          message: 'ProductPriceProposal không có hoặc chưa tồn tại',
          statusCode: StatusCodes.NOT_FOUND,
        });
      }

      return data;
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.getById`,
        message: 'Lấy dữ liệu productPriceProposal không thành công',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async create(data: ProductPriceProposal) {
    try {
      const result = await this.getStore().productPriceProposal().createOne(data);

      return result;
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.create`,
        message: 'Tạo productPriceProposal thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async update(productPriceProposalId: string, data: ProductPriceProposal) {
    try {
      const result = await this.getStore()
        .productPriceProposal()
        .updateOne(productPriceProposalId, data);

      return result;
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.update`,
        message: 'Cập nhật productPriceProposal thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async delete(productPriceProposalId: string) {
    try {
      await this.getStore()
        .productPriceProposal()
        .baseDelete({ _id: new ObjectId(productPriceProposalId) });
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.delete`,
        message: 'Cập nhật productPriceProposal thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }
}
