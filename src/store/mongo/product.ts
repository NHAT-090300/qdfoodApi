import { escapeRegExp, isNumber } from 'lodash';
import { ClientSession, Db, ObjectId } from 'mongodb';
import slugify from 'slugify';
import { logger } from 'logger';

import { ESortOrder, IProduct, IProductFilter } from 'interface';
import { Product } from 'model';
import { BaseStore } from './base';

export class MongoProduct extends BaseStore<IProduct> {
  constructor(db: Db) {
    super(db, 'product');
  }

  seed = async () => {
    try {
      // Retrieve all documents from the collection
      const documents = await this.collection.find({}).toArray();

      const promises = documents.map((doc) => {
        // Generate a slug based on the `name` field and current time for uniqueness
        const slug = slugify(`${doc.name} ${Date.now()}`, {
          replacement: '-',
          lower: true,
          strict: false,
          locale: 'vi',
          trim: true,
        });

        // Update each document with the new slug field
        return this.collection.updateOne({ _id: doc._id }, { $set: { slug } });
      });

      // Wait for all updates to complete
      await Promise.all(promises);
      logger.info('All documents have been updated with slugs.');
    } catch (error) {
      logger.error('Error adding slug to documents:', error);
    }
  };

  private getProject(custom: object = {}) {
    return {
      _id: 1,
      name: 1,
      description: 1,
      images: 1,
      defaultPrice: 1,
      createdAt: 1,
      updatedAt: 1,
      addressInfo: 1,
      slug: 1,
      category: 1,
      ...custom,
    };
  }

  private getQuery(filters: IProductFilter) {
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

    if (isNumber(filters.minPrice) || isNumber(filters.maxPrice)) {
      condition.price = {};
      if (isNumber(filters.minPrice)) {
        condition.price.$gte = filters.minPrice;
      }
      if (isNumber(filters.maxPrice)) {
        condition.price.$lte = filters.maxPrice;
      }
    }

    if (Array.isArray(filters.ids) && filters.ids.length) {
      condition._id = {
        $in: filters.ids.map((id) => (ObjectId.isValid(id) ? new ObjectId(id) : id)),
      };
    }

    if (filters.sort && filters.order) {
      sort[filters.sort] = filters.order === ESortOrder.Asc ? 1 : -1;
    } else {
      sort.point = -1;
    }

    if (isNumber(filters.page) && isNumber(filters.limit)) {
      paginate.skip = (filters.page - 1) * filters.limit;
      paginate.limit = filters.limit;
      paginate.page = filters.page;
      paginate.hasPaginate = true;
    }

    return { condition, sort, paginate };
  }

  async getMore(filters: IProductFilter) {
    const { condition, sort, paginate } = this.getQuery(filters);

    // Construct the aggregation pipeline
    const pipeline: any[] = [{ $match: condition }];

    // Add random sampling if no sorting is specified
    if (!filters.sort) {
      pipeline.push({ $sample: { size: paginate.limit } });
    } else {
      pipeline.push({ $sort: sort });
    }

    // Join with categories
    pipeline.push(
      {
        $lookup: {
          from: 'category',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'category',
        },
      },
      {
        $unwind: {
          path: '$category',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          ...this.getProject(),
          category: { $ifNull: ['$category', {}] },
        },
      },
    );

    // If sorting, apply pagination through $facet
    if (filters.sort) {
      pipeline.push({
        $facet: {
          data: [{ $skip: paginate.skip }, { $limit: paginate.limit }],
          pageInfo: [{ $count: 'count' }],
        },
      });
    } else {
      // For random sampling, calculate total items manually
      pipeline.push({
        $facet: {
          data: [{ $limit: paginate.limit }],
          pageInfo: [{ $count: 'count' }],
        },
      });
    }

    const result = await this.collection.aggregate(pipeline).next();

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

  async getPaginate(filters: IProductFilter) {
    const { condition, sort, paginate } = this.getQuery(filters);

    const result = await this.collection
      .aggregate<{ data: IProduct[]; pageInfo: Array<{ count: number }> }>([
        {
          $match: condition,
        },
        {
          $sort: sort,
        },
        {
          $lookup: {
            from: 'category',
            localField: 'categoryId',
            foreignField: '_id',
            as: 'category',
          },
        },
        {
          $unwind: {
            path: '$category',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            ...this.getProject(),
            category: { $ifNull: ['$category', {}] },
          },
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

  async getList(filters: IProductFilter) {
    const { condition } = this.getQuery(filters);
    return this.collection.find<IProduct>(condition, { projection: this.getProject() }).toArray();
  }

  async getOne(filters: IProductFilter) {
    const { condition } = this.getQuery(filters);
    return this.collection.findOne<IProduct>(condition, { projection: this.getProject() });
  }

  async createOne(data: Product, session?: ClientSession) {
    data.preSave();

    const result = await this.collection.insertOne({ ...data }, { session });
    data._id = result.insertedId;
    return data;
  }

  async updateOne(id: string, data: Product, session?: ClientSession) {
    data.preUpdate();

    await this.baseUpdate({ _id: new ObjectId(id) }, { $set: data }, { session });
    data._id = new ObjectId(id);
    return data;
  }
}
