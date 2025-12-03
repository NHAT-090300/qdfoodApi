import { StatusCodes } from 'http-status-codes';
import { ESortOrder, IInventory, IInventoryFilter, IOrder } from 'interface';
import { isArray, isBoolean, isNumber } from 'lodash';
import { AppError, Inventory } from 'model';
import { ClientSession, Db, Decimal128, ObjectId } from 'mongodb';
import { createUnsignedRegex } from 'utils';

import { BaseStore } from './base';

const where = 'Store.Inventory';
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
      quantity: 1,
      createdAt: 1,
      updatedAt: 1,
      unitName: 1,
      ...custom,
    };
  }

  private getQuery(filters: IInventoryFilter) {
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
      const keyword = filters.keyword.trim();
      const regex = createUnsignedRegex(keyword);
      conditionProduct.$or = [
        { 'product.name': { $regex: regex } },
        { 'product.code': { $regex: regex } },
      ];
    }

    if (filters?.type?.length && isArray(filters.type)) {
      conditionProduct['product.type'] = { $in: filters.type };
    }

    if (Array.isArray(filters.ids) && filters.ids.length) {
      condition._id = {
        $in: filters.ids.map((id) => (ObjectId.isValid(id) ? new ObjectId(id) : id)),
      };
    }

    if (filters.hasQuantity && isBoolean(filters.hasQuantity)) {
      condition.quantity = { $gt: 0 };
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

  async getPaginate(filters: IInventoryFilter) {
    const { condition, sort, paginate, conditionProduct } = this.getQuery(filters);

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
          $match: conditionProduct,
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
    const { condition, sort, conditionProduct } = this.getQuery(filters);

    const result = await this.collection
      .aggregate([
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
          $match: conditionProduct,
        },
      ])
      .toArray();

    return result;
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
    const now = new Date();

    const mergedMap = new Map<
      string,
      {
        productId: ObjectId;
        quantity: number;
      }
    >();

    for (const item of data) {
      const key = item.productId.toHexString();
      if (mergedMap.has(key)) {
        const existing = mergedMap.get(key)!;
        existing.quantity += item.quantity;
      } else {
        mergedMap.set(key, {
          productId: item.productId,
          quantity: item.quantity,
        });
      }
    }

    const productIds = Array.from(mergedMap.values()).map(({ productId }) => productId);

    const existingInventories = await this.collection
      .find({ productId: { $in: productIds } })
      .project({ productId: 1, quantity: 1 })
      .toArray();

    const existingMap = new Map<string, { quantity: number }>();
    for (const inv of existingInventories) {
      const key = inv.productId.toHexString();
      existingMap.set(key, {
        quantity: inv.quantity || 0,
      });
    }

    const bulkOps = [];

    for (const [key, item] of mergedMap.entries()) {
      bulkOps.push({
        updateOne: {
          filter: { productId: item.productId },
          update: {
            $inc: { quantity: item.quantity },
            $set: {
              updatedAt: now,
            },
          },
          upsert: true,
        },
      });
    }

    if (bulkOps.length > 0) {
      await this.collection.bulkWrite(bulkOps);
    }
  }

  async updateInventoryFromOrder(order: IOrder) {
    if (!Array.isArray(order.items)) return;

    const bulkOps = [];

    for (const item of order.items) {
      if (item.quantity > 0) {
        const productId = new ObjectId(item.productId);

        const inventory = await this.collection.findOne({ productId });

        if (!inventory) {
          throw new AppError({
            id: `${where}.updateInventoryFromOrder`,
            message: `Không tìm thấy hàng tồn kho cho productId: ${item.productId}`,
            statusCode: StatusCodes.BAD_REQUEST,
          });
        }

        if (inventory.quantity < item.quantity) {
          throw new AppError({
            id: `${where}.updateInventoryFromOrder`,
            message: `Không đủ hàng tồn kho cho productId: ${item.productId}`,
            statusCode: StatusCodes.BAD_REQUEST,
          });
        }

        // Gom các thao tác update lại
        bulkOps.push({
          updateOne: {
            filter: { productId },
            update: { $inc: { quantity: -item.quantity } },
          },
        });
      }
    }

    // Thực hiện tất cả update trong 1 lần
    if (bulkOps.length > 0) {
      await this.collection.bulkWrite(bulkOps);
    }
  }
}
