import {
  ESortOrder,
  IPriceProposal,
  IProductPrice,
  IProductPriceFilter,
  IProductPriceProposal,
} from 'interface';
import { isNumber } from 'lodash';
import { ProductPrice } from 'model';
import { ClientSession, Db, ObjectId } from 'mongodb';
import { createUnsignedRegex } from 'utils';

import { BaseStore } from './base';

export class MongoProductPrice extends BaseStore<IProductPrice> {
  constructor(db: Db) {
    super(db, 'product_prices');
  }

  private getProject(custom: object = {}) {
    return {
      _id: 1,
      customPrice: 1,
      productId: 1,
      userId: 1,
      createdAt: 1,
      updatedAt: 1,
      ...custom,
    };
  }

  private getQuery(filters: IProductPriceFilter) {
    const condition: Record<string, any> = {
      parentId: null,
    };
    const conditionProduct: Record<string, any> = {};

    const sort: Record<string, -1 | 1> = {};

    const paginate = {
      limit: 0,
      skip: 0,
      page: 0,
      hasPaginate: false,
    };

    if (filters.keyword) {
      const keyword = filters.keyword.trim();
      const regex = createUnsignedRegex(keyword);
      conditionProduct.$or = [
        { 'product.name': { $regex: regex } },
        { 'product.code': { $regex: regex } },
      ];
    }

    if (filters?.userId && ObjectId.isValid(filters?.userId)) {
      condition.userId = new ObjectId(filters?.userId);
    }

    if (Array.isArray(filters.ids) && filters.ids.length) {
      condition._id = {
        $in: filters.ids.map((id) => (ObjectId.isValid(id) ? new ObjectId(id) : id)),
      };
    }

    if (filters.sort && filters.order) {
      sort[filters.sort] = filters.order === ESortOrder.Asc ? 1 : -1;
    } else {
      sort.createdAt = -1;
    }

    if (isNumber(filters.page) && isNumber(filters.limit)) {
      paginate.skip = (filters.page - 1) * filters.limit;
      paginate.limit = filters.limit;
      paginate.page = filters.page;
      paginate.hasPaginate = true;
    }

    return { condition, sort, paginate, conditionProduct };
  }

  async getUserProductIds(userId: string) {
    const result = await this.collection
      .aggregate([
        {
          $match: {
            userId: new ObjectId(userId),
          },
        },
        {
          $group: {
            _id: '$userId',
            productIds: { $push: '$productId' },
          },
        },
        {
          $project: {
            userId: '$_id',
            productIds: 1,
            _id: 0,
          },
        },
      ])
      .next();

    return result ? result.productIds.map((item: any) => item?.toString()) : [];
  }

  async getPaginateAdmin(filters: IProductPriceFilter) {
    const { condition, sort, paginate, conditionProduct } = this.getQuery(filters);

    const productIds = await this.getUserProductIds(condition?.userId);

    const result = await this.collection
      .aggregate<{ data: any[]; pageInfo: Array<{ count: number }> }>([
        { $match: condition },
        {
          $lookup: {
            from: 'product',
            localField: 'productId',
            foreignField: '_id',
            as: 'product',
          },
        },
        { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
        { $sort: sort },
        { $match: conditionProduct },
        {
          $facet: {
            data: [{ $skip: paginate.limit * (paginate.page - 1) }, { $limit: paginate.limit }],
            pageInfo: [{ $count: 'count' }],
          },
        },
      ])
      .next();

    const data = result?.data ?? [];

    const totalData = result?.pageInfo[0]?.count ?? 0;

    return {
      data,
      totalData,
      pagination: {
        limit: paginate.limit,
        page: paginate.page,
        totalPages: Math.ceil(totalData / paginate.limit),
        totalItems: totalData,
      },
      productIds,
    };
  }

  async getList(filters: IProductPriceFilter) {
    const { condition } = this.getQuery(filters);
    return this.collection
      .find<IProductPrice>(condition, { projection: this.getProject() })
      .toArray();
  }

  async getOne(filters: IProductPriceFilter) {
    const { condition } = this.getQuery(filters);
    return this.collection.findOne<IProductPrice>(condition, { projection: this.getProject() });
  }

  async createOne(data: ProductPrice, session?: ClientSession) {
    data.preSave();

    const result = await this.collection.insertOne({ ...data }, { session });
    data._id = result.insertedId;
    return data;
  }

  async updateOne(id: string, data: ProductPrice, session?: ClientSession) {
    data.preUpdate();

    await this.baseUpdate({ _id: new ObjectId(id) }, { $set: data }, { session });
    data._id = new ObjectId(id);
    return data;
  }

  async bulkProductPrice(userId: string, productIds: string[]) {
    const userObjectId = new ObjectId(userId);

    const bulkOps = productIds.map((productId) => ({
      updateOne: {
        filter: {
          userId: userObjectId,
          productId: new ObjectId(productId),
        },
        update: {
          $set: {
            customPrice: 0,
            updatedAt: new Date(),
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        upsert: true,
      },
    }));

    return await this.collection.bulkWrite(bulkOps, { ordered: false });
  }

  async bulkProductPriceWithPrice(userId: string, products: IPriceProposal[]) {
    const userObjectId = new ObjectId(userId);

    const bulkOps = products.map((pro) => ({
      updateOne: {
        filter: {
          userId: userObjectId,
          productId: new ObjectId(pro.productId),
        },
        update: {
          $set: {
            customPrice: pro.price,
            updatedAt: new Date(),
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        upsert: true,
      },
    }));

    return await this.collection.bulkWrite(bulkOps, { ordered: false });
  }

  async syncPriceProposals(proposals: IProductPriceProposal[]) {
    const ops = proposals?.map((p: IProductPriceProposal) => ({
      updateOne: {
        filter: { userId: p.userId, productId: p.productId },
        update: {
          $set: {
            customPrice: p.customPrice,
            updatedAt: new Date(),
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        upsert: true,
      },
    }));

    if (ops.length > 0) {
      await this.collection.bulkWrite(ops);
    }
  }
}
