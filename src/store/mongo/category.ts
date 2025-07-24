import { escapeRegExp, isNumber } from 'lodash';
import { ClientSession, Db, ObjectId } from 'mongodb';

import { ESortOrder, ICategory, ICategoryFilter } from 'interface';
import { Category } from 'model';
import { BaseStore } from './base';

export class MongoCategory extends BaseStore<ICategory> {
  constructor(db: Db) {
    super(db, 'category');
  }

  private getProject(custom: object = {}) {
    return {
      _id: 1,
      name: 1,
      image: 1,
      description: 1,
      isDelete: 1,
      createdAt: 1,
      updatedAt: 1,
      slug: 1,
      ...custom,
    };
  }

  private getQuery(filters: ICategoryFilter) {
    const condition: Record<string, any> = {};
    const sort: Record<string, -1 | 1> = {};

    const paginate = {
      limit: 0,
      skip: 0,
      page: 0,
      hasPaginate: false,
    };

    if (filters.keyword) {
      const regex = new RegExp(escapeRegExp(filters.keyword), 'i');
      condition.$or = [{ name: { $regex: regex }, description: { $regex: regex } }];
    }

    if (Array.isArray(filters.isDelete) && filters.isDelete.length) {
      condition.isDelete = {
        $in: filters.isDelete,
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

  async getPaginate(filters: ICategoryFilter) {
    const { condition, sort, paginate } = this.getQuery(filters);

    const result = await this.collection
      .aggregate<{ data: ICategory[]; pageInfo: Array<{ count: number }> }>([
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

  async getListSubCategory() {
    const result = await this.collection
      .aggregate<{ data: ICategory[]; pageInfo: Array<{ count: number }> }>([
        {
          $match: { isDelete: { $ne: true } },
        },
        {
          $sort: { createdAt: -1 },
        },
        {
          $lookup: {
            from: 'sub_category',
            localField: '_id',
            foreignField: 'categoryId',
            as: 'subCategories',
          },
        },
        {
          $project: this.getProject({
            subCategories: 1,
          }),
        },
      ])
      .toArray();

    const data = result ?? [];

    return {
      data,
      totalData: data.length,
    };
  }

  async getList(filters: ICategoryFilter) {
    const { condition } = this.getQuery(filters);

    const pipeline = [
      { $match: condition },
      {
        $lookup: {
          from: 'product',
          localField: '_id',
          foreignField: 'categoryId',
          as: 'products',
        },
      },
      {
        $project: {
          ...this.getProject(),
          productCount: { $size: '$products' },
        },
      },
    ];

    return this.collection.aggregate<ICategory & { productCount: number }>(pipeline).toArray();
  }

  async getOne(filters: ICategoryFilter) {
    const { condition } = this.getQuery(filters);
    return this.collection.findOne<ICategory>(condition, { projection: this.getProject() });
  }

  async createOne(data: Category, session?: ClientSession) {
    data.preSave();

    const result = await this.collection.insertOne({ ...data }, { session });
    data._id = result.insertedId;
    return data;
  }

  async updateOne(id: string, data: Category, session?: ClientSession) {
    data.preUpdate();

    await this.baseUpdate({ _id: new ObjectId(id) }, { $set: data }, { session });
    data._id = new ObjectId(id);
    return data;
  }
}
