import { escapeRegExp, isNumber } from 'lodash';
import { ClientSession, Db, ObjectId } from 'mongodb';

import { ESortOrder, IInventory, IInventoryFilter } from 'interface';
import { Inventory } from 'model';
import { BaseStore } from './base';

export class MongoInventory extends BaseStore<IInventory> {
  constructor(db: Db) {
    super(db, 'inventory');
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

  private getQuery(filters: IInventoryFilter) {
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

  async getPaginate(filters: IInventoryFilter) {
    const { condition, sort, paginate } = this.getQuery(filters);

    const result = await this.collection
      .aggregate<{ data: IInventory[]; pageInfo: Array<{ count: number }> }>([
        {
          $match: condition,
        },
        {
          $lookup: {
            from: 'product',
            localField: 'productId',
            foreignField: '_id',
            as: 'product',
          },
        },
        {
          $lookup: {
            from: 'suppliers',
            localField: 'supplierId',
            foreignField: '_id',
            as: 'supplier',
          },
        },
        {
          $addFields: {
            product: {
              $arrayElemAt: ['$product', 0],
            },
            supplier: {
              $arrayElemAt: ['$supplier', 0],
            },
          },
        },
        {
          $sort: sort,
        },
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
    };
  }

  async getList(filters: IInventoryFilter) {
    const { condition } = this.getQuery(filters);
    return this.collection.find<IInventory>(condition, { projection: this.getProject() }).toArray();
  }

  async getOne(filters: IInventoryFilter) {
    const { condition } = this.getQuery(filters);
    return this.collection.findOne<IInventory>(condition, { projection: this.getProject() });
  }

  async createOne(data: Inventory, session?: ClientSession) {
    data.preSave();

    const result = await this.collection.insertOne({ ...data }, { session });
    data._id = result.insertedId;
    return data;
  }

  async updateOne(id: string, data: Inventory, session?: ClientSession) {
    data.preUpdate();

    await this.baseUpdate({ _id: new ObjectId(id) }, { $set: data }, { session });
    data._id = new ObjectId(id);
    return data;
  }

  async createMany(data: IInventory[]) {
    // const now = new Date();

    const bulkOps = data.map((item) => ({
      updateOne: {
        filter: { productId: item.productId, supplierId: item.supplierId },
        update: {
          $inc: { quantity: item.quantity },
          $set: { warehousePrice: item.warehousePrice, updatedAt: new Date() },
        },
        upsert: true,
      },
    }));

    await this.collection.bulkWrite(bulkOps);
  }
}
