import { escapeRegExp, isNumber } from 'lodash';
import { ClientSession, Db, ObjectId } from 'mongodb';

import { ERole, ESortOrder, IUser, IUserFilter } from 'interface';
import { User } from 'model';
import { BaseStore } from './base';

export class MongoUser extends BaseStore<IUser> {
  constructor(db: Db) {
    super(db, 'users');
  }

  private getProject(custom: object = {}) {
    return {
      _id: 1,
      name: 1,
      phoneNumber: 1,
      avatar: 1,
      social: 1,
      role: 1,
      createdAt: 1,
      updatedAt: 1,
      isDelete: 1,
      email: 1,
      ...custom,
    };
  }

  private getQuery(filters: IUserFilter) {
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
      condition.$or = [{ name: { $regex: regex }, email: { $regex: regex } }];
    }

    if (
      Array.isArray(filters.role) &&
      filters.role.length &&
      filters?.role?.every((item) => Object.values(ERole).includes(item))
    ) {
      condition.role = {
        $in: filters.role,
      };
    }

    if (Array.isArray(filters.isDelete) && filters.isDelete.length) {
      condition.isDelete = {
        $in: filters.isDelete,
      };
    }

    if (filters.sort && filters.order) {
      sort[filters.sort] = filters.order === ESortOrder.Asc ? 1 : -1;
    } else {
      sort.createdAt = 1;
    }

    if (isNumber(filters.page) && isNumber(filters.limit)) {
      paginate.skip = (filters.page - 1) * filters.limit;
      paginate.limit = filters.limit;
      paginate.page = filters.page;
      paginate.hasPaginate = true;
    }

    return { condition, sort, paginate };
  }

  async getPaginate(filters: IUserFilter) {
    const { condition, sort, paginate } = this.getQuery(filters);

    const result = await this.collection
      .aggregate<{ data: IUser[]; pageInfo: Array<{ count: number }> }>([
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

  async getList(filters: IUserFilter) {
    const { condition } = this.getQuery(filters);
    return this.collection
      .find<IUser>(condition, {
        projection: {
          _id: 1,
          name: 1,
          email: 1,
        },
      })
      .toArray();
  }

  async getOne(filters: IUserFilter) {
    const { condition } = this.getQuery(filters);
    return this.collection.findOne<IUser>(condition, {
      projection: this.getProject({
        otp: 1,
        otpExpiresAt: 1,
        isVerified: 1,
      }),
    });
  }

  async createOne(data: User, session?: ClientSession) {
    data.preSave();

    const result = await this.collection.insertOne({ ...data }, { session });
    data._id = result.insertedId;
    return data;
  }

  async updateOne(id: string, data: User, session?: ClientSession) {
    data.preUpdate();

    await this.baseUpdate({ _id: new ObjectId(id) }, { $set: data }, { session });
    data._id = new ObjectId(id);
    return data;
  }

  async deleteOne(id: string, data: User, session?: ClientSession) {
    data.preDelete();

    await this.baseUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...data, isDelete: !data?.isDelete } },
      { session },
    );
    data._id = new ObjectId(id);
    return data;
  }
}
