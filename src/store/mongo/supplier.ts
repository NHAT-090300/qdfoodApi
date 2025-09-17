import { ESortOrder, ISupplier, ISupplierFilter } from 'interface';
import { isNumber } from 'lodash';
import { Supplier } from 'model';
import { ClientSession, Db, ObjectId } from 'mongodb';
import { createUnsignedRegex } from 'utils';

import { BaseStore } from './base';

export class MongoSupplier extends BaseStore<ISupplier> {
  constructor(db: Db) {
    super(db, 'suppliers');
  }

  private getProject(custom: object = {}) {
    return {
      _id: 1,
      name: 1,
      addressInfo: 1,
      phone: 1,
      email: 1,
      createdAt: 1,
      updatedAt: 1,
      ...custom,
    };
  }

  private getQuery(filters: ISupplierFilter) {
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
      const regex = createUnsignedRegex(filters.keyword);
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

  async getPaginate(filters: ISupplierFilter) {
    const { condition, sort, paginate } = this.getQuery(filters);

    const result = await this.collection
      .aggregate<{ data: ISupplier[]; pageInfo: Array<{ count: number }> }>([
        {
          $match: condition,
        },
        {
          $sort: sort,
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

  async getList(filters: ISupplierFilter) {
    const { condition } = this.getQuery(filters);
    return this.collection.find<ISupplier>(condition, { projection: this.getProject() }).toArray();
  }

  async getOne(filters: ISupplierFilter) {
    const { condition } = this.getQuery(filters);
    return this.collection.findOne<ISupplier>(condition, { projection: this.getProject() });
  }

  async createOne(data: Supplier, session?: ClientSession) {
    data.preSave();

    const result = await this.collection.insertOne({ ...data }, { session });
    data._id = result.insertedId;
    return data;
  }

  async updateOne(id: string, data: Supplier, session?: ClientSession) {
    data.preUpdate();

    await this.baseUpdate({ _id: new ObjectId(id) }, { $set: data }, { session });
    data._id = new ObjectId(id);
    return data;
  }
}
