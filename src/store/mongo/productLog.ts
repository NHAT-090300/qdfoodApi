import { ESortOrder, IProductLog, IProductLogFilter } from 'interface';
import { escapeRegExp, isNumber } from 'lodash';
import { ProductLog } from 'model';
import { ClientSession, Db, ObjectId } from 'mongodb';

import { BaseStore } from './base';

export class MongoProductLog extends BaseStore<IProductLog> {
  constructor(db: Db) {
    super(db, 'product_logs');
  }

  private getProject(custom: object = {}) {
    return {
      _id: 1,
      outputItem: {
        product: 1,
        productId: 1,
        quantity: 1,
      },
      ingredientItem: {
        product: 1,
        productId: 1,
        quantity: 1,
      },
      userId: 1,
      user: {
        _id: 1,
        name: 1,
        email: 1,
        avatar: 1,
      },
      createdAt: 1,
      updatedAt: 1,
      ...custom,
    };
  }

  private getQuery(filters: IProductLogFilter) {
    const condition: Record<string, any> = {};
    const conditionProduct: Record<string, any> = {};
    const sort: Record<string, -1 | 1> = {};

    const paginate = {
      limit: 0,
      skip: 0,
      page: 0,
      hasPaginate: false,
    };

    if (filters.keyword) {
      const regex = new RegExp(escapeRegExp(filters.keyword), 'i');
      conditionProduct.$or = [
        { 'product.name': { $regex: regex } },
        { 'product.code': { $regex: regex } },
      ];
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

  async getPaginate(filters: IProductLogFilter) {
    const { condition, sort, paginate, conditionProduct } = this.getQuery(filters);

    const result = await this.collection
      .aggregate<{ data: IProductLog[]; pageInfo: Array<{ count: number }> }>([
        {
          $match: condition,
        },
        {
          $sort: sort,
        },
        { $match: conditionProduct },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        // Lấy thông tin product cho outputItem
        { $unwind: { path: '$outputItem', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'product',
            localField: 'outputItem.productId',
            foreignField: '_id',
            as: 'outputItem.product',
          },
        },
        { $unwind: { path: '$outputItem.product', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: '$_id',
            doc: { $first: '$$ROOT' },
            outputItem: { $push: '$outputItem' },
          },
        },
        {
          $replaceRoot: {
            newRoot: {
              $mergeObjects: ['$doc', { outputItem: '$outputItem' }],
            },
          },
        },

        // Lấy thông tin product cho ingredientItem
        { $unwind: { path: '$ingredientItem', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'product',
            localField: 'ingredientItem.productId',
            foreignField: '_id',
            as: 'ingredientItem.product',
          },
        },
        { $unwind: { path: '$ingredientItem.product', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: '$_id',
            doc: { $first: '$$ROOT' },
            ingredientItem: { $push: '$ingredientItem' },
          },
        },
        {
          $replaceRoot: {
            newRoot: {
              $mergeObjects: ['$doc', { ingredientItem: '$ingredientItem' }],
            },
          },
        },
        { $project: this.getProject() },
        {
          $facet: {
            data: [{ $skip: paginate.limit * (paginate.page - 1) }, { $limit: paginate.limit }],
            pageInfo: [{ $count: 'count' }],
          },
        },
      ])
      .next();

    console.log(result);

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
    };
  }

  async getList(filters: IProductLogFilter) {
    const { condition, sort, conditionProduct } = this.getQuery(filters);

    const result = await this.collection
      .aggregate([
        {
          $match: condition,
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        // Lấy thông tin product cho outputItem
        { $unwind: { path: '$outputItem', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'products',
            localField: 'outputItem.productId',
            foreignField: '_id',
            as: 'outputItem.product',
          },
        },
        { $unwind: { path: '$outputItem.product', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: '$_id',
            doc: { $first: '$$ROOT' },
            outputItem: { $push: '$outputItem' },
          },
        },
        {
          $replaceRoot: {
            newRoot: {
              $mergeObjects: ['$doc', { outputItem: '$outputItem' }],
            },
          },
        },

        // Lấy thông tin product cho ingredientItem
        { $unwind: { path: '$ingredientItem', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'products',
            localField: 'ingredientItem.productId',
            foreignField: '_id',
            as: 'ingredientItem.product',
          },
        },
        { $unwind: { path: '$ingredientItem.product', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: '$_id',
            doc: { $first: '$$ROOT' },
            ingredientItem: { $push: '$ingredientItem' },
          },
        },
        {
          $replaceRoot: {
            newRoot: {
              $mergeObjects: ['$doc', { ingredientItem: '$ingredientItem' }],
            },
          },
        },
        {
          $sort: sort,
        },
        { $match: conditionProduct },
      ])
      .toArray();

    return result;
  }

  async getOne(filters: IProductLogFilter) {
    const { condition } = this.getQuery(filters);
    return this.collection.findOne<IProductLog>(condition, { projection: this.getProject() });
  }

  async createOne(data: ProductLog, session?: ClientSession) {
    data.preSave();

    const result = await this.collection.insertOne({ ...data }, { session });
    data._id = result.insertedId;
    return data;
  }
}
