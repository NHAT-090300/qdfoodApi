import { escapeRegExp, isNumber } from 'lodash';
import { ClientSession, Db, ObjectId } from 'mongodb';

import { ESortOrder, IProductPrice, IProductPriceFilter } from 'interface';
import { ProductPrice } from 'model';
import { BaseStore } from './base';

export class MongoProductPrice extends BaseStore<IProductPrice> {
  constructor(db: Db) {
    super(db, 'product_prices');
  }

  private getProject(custom: object = {}) {
    return {
      _id: 1,
      title: 1,
      url: 1,
      image: 1,
      createdAt: 1,
      updatedAt: 1,
      ...custom,
    };
  }

  private getQuery(filters: IProductPriceFilter) {
    const condition: Record<string, any> = {
      parentId: null,
    };
    const sort: Record<string, -1 | 1> = {};

    const paginate = {
      limit: 0,
      skip: 0,
      page: 0,
      hasPaginate: false,
    };

    if (filters.keyword) {
      const regex = new RegExp(escapeRegExp(filters.keyword), 'i');
      condition.$or = [{ name: { $regex: regex } }];
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

    return { condition, sort, paginate };
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
    const { condition, sort, paginate } = this.getQuery(filters);

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
        {
          $addFields: {
            product: { $arrayElemAt: ['$product', 0] },
          },
        },
        {
          $replaceRoot: {
            newRoot: {
              $mergeObjects: ['$product', '$$ROOT'],
            },
          },
        },
        { $sort: sort },
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

    const docs = productIds?.map((pro) => ({
      userId: userObjectId,
      productId: new ObjectId(pro),
      customPrice: 0,
    }));

    return await this.collection.insertMany(docs);
  }
}
