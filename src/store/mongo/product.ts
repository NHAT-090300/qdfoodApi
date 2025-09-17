import { ESortOrder, IProduct, IProductFilter } from 'interface';
import { isArray, isNumber } from 'lodash';
import { logger } from 'logger';
import { Product } from 'model';
import { ClientSession, Db, ObjectId } from 'mongodb';
import slugify from 'slugify';
import { createUnsignedRegex } from 'utils';

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
      unitName: 1,
      createdAt: 1,
      updatedAt: 1,
      addressInfo: 1,
      slug: 1,
      category: 1,
      code: 1,
      type: 1,
      isRetailAvailable: 1,
      isShow: 1,
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
      const keyword = filters.keyword.trim();

      if (ObjectId.isValid(keyword)) {
        condition.$or = [{ _id: new ObjectId(keyword) }];
      } else {
        const regex = createUnsignedRegex(keyword);
        condition.$or = [{ name: { $regex: regex } }, { code: { $regex: regex } }];
      }
    }

    if (filters?.type?.length && isArray(filters.type)) {
      condition.type = {
        $in: filters.type,
      };
    }

    if (typeof filters.isShow === 'boolean') {
      condition.isShow = filters.isShow;
    }

    if (filters.ninProduct?.length && Array.isArray(filters?.ninProduct)) {
      condition._id = {
        $nin: filters.ninProduct.map((id) => (ObjectId.isValid(id) ? new ObjectId(id) : id)),
      };
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

    const orConditions = [];

    if (filters.categories?.length) {
      orConditions.push({
        categoryId: {
          $in: filters.categories.map((id) => (ObjectId.isValid(id) ? new ObjectId(id) : id)),
        },
      });
    }

    if (filters.subCategories?.length) {
      orConditions.push({
        subCategoryId: {
          $in: filters.subCategories.map((id) => (ObjectId.isValid(id) ? new ObjectId(id) : id)),
        },
      });
    }

    if (orConditions.length) {
      condition.$or = orConditions;
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

  async getListMoreByUser(filters: IProductFilter) {
    const { condition, sort, paginate } = this.getQuery(filters);

    const pipeline: any[] = [{ $match: condition }];

    pipeline.push({ $sort: sort || { 'category.name': 1 } });

    // Nếu có userId thì thêm lookup để lấy giá theo user
    if (filters?.userId) {
      pipeline.push(
        {
          $lookup: {
            from: 'product_prices',
            let: { productId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$productId', '$$productId'] },
                      { $eq: ['$userId', new ObjectId(filters.userId)] },
                    ],
                  },
                },
              },
              { $limit: 1 },
            ],
            as: 'customPriceData',
          },
        },
        {
          $addFields: {
            finalPrice: {
              $cond: [
                { $gt: [{ $size: '$customPriceData' }, 0] },
                { $arrayElemAt: ['$customPriceData.customPrice', 0] },
                '$defaultPrice',
              ],
            },
          },
        },
      );
    } else {
      // Nếu không có userId thì lấy finalPrice = defaultPrice
      pipeline.push({
        $addFields: {
          finalPrice: '$defaultPrice',
        },
      });
    }

    // Join category
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
          finalPrice: 1,
        },
      },
    );

    // Pagination
    pipeline.push({
      $facet: {
        data: [{ $skip: paginate.skip }, { $limit: paginate.limit }],
        pageInfo: [{ $count: 'count' }],
      },
    });

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

  async getListCartByUser(filters: IProductFilter) {
    const pipeline: any[] = [
      {
        $match: {
          _id: { $in: filters?.cartItems?.map((item) => new ObjectId(item?.productId)) || [] },
        },
      },
    ];

    // Nếu có userId thì thêm lookup để lấy giá theo user
    if (filters?.userId) {
      pipeline.push(
        {
          $lookup: {
            from: 'product_prices',
            let: { productId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$productId', '$$productId'] },
                      { $eq: ['$userId', new ObjectId(filters.userId)] },
                    ],
                  },
                },
              },
              { $limit: 1 },
            ],
            as: 'customPriceData',
          },
        },
        {
          $addFields: {
            finalPrice: {
              $cond: [
                { $gt: [{ $size: '$customPriceData' }, 0] },
                { $arrayElemAt: ['$customPriceData.customPrice', 0] },
                '$defaultPrice',
              ],
            },
          },
        },
      );
    } else {
      // Nếu không có userId thì lấy finalPrice = defaultPrice
      pipeline.push({
        $addFields: {
          finalPrice: '$defaultPrice',
        },
      });
    }

    // Join category
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
          finalPrice: 1,
        },
      },
    );

    const result = await this.collection.aggregate(pipeline).toArray();

    const cartItemsMap = new Map(
      filters?.cartItems?.map((item) => [String(item?.productId), item?.quantity || 1]),
    );

    const data = result.map((product) => ({
      ...product,
      quantity: cartItemsMap.get(String(product._id)) || 1,
    }));

    const totalData = result.length;

    return {
      data,
      totalData,
    };
  }

  async getRandomProduct(filters: IProductFilter) {
    const { condition, sort, paginate } = this.getQuery(filters);

    // Construct the aggregation pipeline
    const pipeline: any[] = [{ $match: condition }];

    // Add random sampling if no sorting is specified
    if (!filters.sort) {
      pipeline.push({ $sample: { size: paginate.limit } });
    } else {
      pipeline.push({ $sort: sort });
    }

    // Nếu có userId thì thêm lookup để lấy giá theo user
    if (filters?.userId) {
      pipeline.push(
        {
          $lookup: {
            from: 'product_prices',
            let: { productId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$productId', '$$productId'] },
                      { $eq: ['$userId', new ObjectId(filters.userId)] },
                    ],
                  },
                },
              },
              { $limit: 1 },
            ],
            as: 'customPriceData',
          },
        },
        {
          $addFields: {
            finalPrice: {
              $cond: [
                { $gt: [{ $size: '$customPriceData' }, 0] },
                { $arrayElemAt: ['$customPriceData.customPrice', 0] },
                '$defaultPrice',
              ],
            },
          },
        },
      );
    } else {
      // Nếu không có userId thì lấy finalPrice = defaultPrice
      pipeline.push({
        $addFields: {
          finalPrice: '$defaultPrice',
        },
      });
    }

    // Join category
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
          finalPrice: 1,
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

  async getPaginateProductPrice(filters: IProductFilter, userId: string) {
    const { condition, sort, paginate } = this.getQuery(filters);

    const userProductIds = await this.collection
      .aggregate([
        {
          $match: {
            userId: new ObjectId(userId),
          },
        },
        {
          $group: {
            _id: null,
            productIds: { $addToSet: '$productId' },
          },
        },
      ])
      .next();

    const productIds = userProductIds ? userProductIds.productIds : [];

    // Bước 2: Truy vấn sản phẩm với điều kiện lọc và phân trang
    const result = await this.collection
      .aggregate<{ data: IProduct[]; pageInfo: Array<{ count: number }> }>([
        {
          $match: {
            ...condition,
            productId: { $nin: productIds },
          },
        },
        {
          $sort: sort,
        },
        {
          $lookup: {
            from: 'category', // Nối với bảng category
            localField: 'categoryId',
            foreignField: '_id',
            as: 'category',
          },
        },
        {
          $unwind: {
            path: '$category', // Tách dữ liệu category ra (nếu có)
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            ...this.getProject(), // Các trường bạn cần lấy từ sản phẩm
            category: { $ifNull: ['$category', {}] }, // Xử lý trường category null
          },
        },
        {
          $facet: {
            data: [
              { $skip: paginate.limit * (paginate.page - 1) }, // Bỏ qua số lượng sản phẩm đã có
              { $limit: paginate.limit }, // Giới hạn số lượng sản phẩm trả về
            ],
            pageInfo: [{ $count: 'count' }], // Tính tổng số bản ghi
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
        totalPages: Math.ceil(totalData / paginate.limit), // Tính tổng số trang
        totalItems: totalData, // Tổng số sản phẩm
      },
    };
  }

  async getListWithInventory(filters: IProductFilter) {
    const { condition } = this.getQuery(filters);

    return this.collection
      .aggregate([
        { $match: condition },
        {
          $lookup: {
            from: 'inventory',
            localField: '_id',
            foreignField: 'productId',
            as: 'inventory',
          },
        },
        { $unwind: { path: '$inventory', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            ...this.getProject(),
            quantity: '$inventory.quantity',
            warehousePrice: '$inventory.warehousePrice',
          },
        },
      ])
      .toArray();
  }

  async getListByUser(filters: IProductFilter) {
    const { condition, sort } = this.getQuery(filters);

    const pipeline: any[] = [
      { $match: condition },
      { $sort: sort },
      {
        $lookup: {
          from: 'product_prices',
          let: { productId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$productId', '$$productId'] },
                    { $eq: ['$userId', new ObjectId(filters.userId)] },
                  ],
                },
              },
            },
            { $limit: 1 },
          ],
          as: 'customPriceData',
        },
      },
      {
        $addFields: {
          finalPrice: {
            $cond: [
              { $gt: [{ $size: '$customPriceData' }, 0] },
              { $arrayElemAt: ['$customPriceData.customPrice', 0] },
              '$defaultPrice',
            ],
          },
        },
      },
      {
        $project: {
          ...this.getProject(),
          finalPrice: 1,
        },
      },
    ];

    return this.collection.aggregate(pipeline).toArray();
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
