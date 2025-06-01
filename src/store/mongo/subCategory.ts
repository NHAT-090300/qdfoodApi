import { escapeRegExp, isNumber } from 'lodash';
import { ClientSession, Db, ObjectId } from 'mongodb';

import { ESortOrder, ISubCategory, ISubCategoryFilter } from 'interface';
import { SubCategory } from 'model';
import { BaseStore } from './base';

export class MongoSubCategory extends BaseStore<ISubCategory> {
  constructor(db: Db) {
    super(db, 'subCategory');
  }

  private getProject(custom: object = {}) {
    return {
      _id: 1,
      name: 1,
      description: 1,
      isDelete: 1,
      createdAt: 1,
      updatedAt: 1,
      slug: 1,
      ...custom,
    };
  }

  private getQuery(filters: ISubCategoryFilter) {
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

    if (filters.categoryId) {
      condition.categoryId = new ObjectId(filters?.categoryId);
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

  async getPaginate(filters: ISubCategoryFilter) {
    const { condition, sort, paginate } = this.getQuery(filters);

    const result = await this.collection
      .aggregate<{ data: ISubCategory[]; pageInfo: Array<{ count: number }> }>([
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

  async getList(filters: ISubCategoryFilter) {
    const { condition } = this.getQuery(filters);
    this.collection.aggregate([
      {
        $lookup: {
          from: 'category',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'category',
        },
      },
      {
        $unwind: '$category',
      },
    ]);

    return this.collection
      .find<ISubCategory>(condition, { projection: this.getProject() })
      .toArray();
  }

  async getOne(filters: ISubCategoryFilter) {
    const { condition } = this.getQuery(filters);
    return this.collection.findOne<ISubCategory>(condition, { projection: this.getProject() });
  }

  async createOne(data: SubCategory, session?: ClientSession) {
    data.preSave();

    const result = await this.collection.insertOne({ ...data }, { session });
    data._id = result.insertedId;
    return data;
  }

  async updateOne(id: string, data: SubCategory, session?: ClientSession) {
    data.preUpdate();

    await this.baseUpdate({ _id: new ObjectId(id) }, { $set: data }, { session });
    data._id = new ObjectId(id);
    return data;
  }
}
