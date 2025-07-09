import { escapeRegExp, isNumber } from 'lodash';
import { ClientSession, Db, ObjectId } from 'mongodb';

import { EOrderStatus, ESortOrder, IOrder, IOrderFilter } from 'interface';
import { Order } from 'model';
import { BaseStore } from './base';

export class MongoOrder extends BaseStore<IOrder> {
  constructor(db: Db) {
    super(db, 'orders');
  }

  private getProject(custom: object = {}) {
    return {
      _id: 1,
      userId: 1,
      phoneNumber: 1,
      name: 1,
      status: 1,
      total: 1,
      shippingAddress: 1,
      items: 1,
      note: 1,
      paymentMethod: 1,
      createdAt: 1,
      updatedAt: 1,
      ...custom,
    };
  }

  private getQuery(filters: IOrderFilter) {
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
      const regex = new RegExp(escapeRegExp(filters.keyword), 'i'); // Create a case-insensitive regex
      condition.$expr = {
        $regexMatch: {
          input: { $toString: '$_id' }, // Convert _id to string
          regex,
        },
      };
    }

    if (filters.status) {
      condition.status = filters.status;
    }

    if (filters.userId) {
      condition.userId = filters.userId;
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

  async getPaginate(filters: IOrderFilter, project: object = {}) {
    const { condition, sort, paginate } = this.getQuery(filters);

    const result = await this.collection
      .aggregate<{ data: IOrder[]; pageInfo: Array<{ count: number }> }>([
        {
          $match: condition,
        },
        {
          $sort: sort,
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user',
          },
        },
        {
          $unwind: {
            path: '$user',
            preserveNullAndEmptyArrays: true,
          },
        },
        { $project: this.getProject(project) },
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

  async getCountByStatuses(filters: IOrderFilter) {
    const { condition } = this.getQuery(filters);

    const allStatuses = Object.values(EOrderStatus);

    const rawResult = await this.collection
      .aggregate([
        { $match: condition },
        {
          $group: {
            _id: '$status',
            totalAmount: { $sum: '$total' },
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();

    // Map kết quả để luôn có đủ status
    const resultMap = Object.fromEntries(
      rawResult.map((item) => [item._id, { totalAmount: item.totalAmount, count: item.count }]),
    );

    const finalResult = allStatuses.map((status) => ({
      status,
      totalAmount: resultMap[status]?.totalAmount || 0,
      count: resultMap[status]?.count || 0,
    }));

    return finalResult;
  }

  async getList(filters: IOrderFilter) {
    const { condition } = this.getQuery(filters);
    return this.collection.find<IOrder>(condition, { projection: this.getProject() }).toArray();
  }

  async getOne(filters: IOrderFilter) {
    const { condition } = this.getQuery(filters);
    return this.collection.findOne<IOrder>(condition, { projection: this.getProject() });
  }

  async createOne(data: Order, session?: ClientSession) {
    data.preSave();

    const result = await this.collection.insertOne({ ...data }, { session });
    data._id = result.insertedId;
    return data;
  }

  async updateOne(id: string, data: Order, session?: ClientSession) {
    data.preUpdate();

    await this.baseUpdate({ _id: new ObjectId(id) }, { $set: data }, { session });
    data._id = new ObjectId(id);
    return data;
  }
}
