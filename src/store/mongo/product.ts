import { ESortOrder, IProduct, IProductFilter } from 'interface';
import { isNumber } from 'lodash';
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
    const condition: Record<string, any> = {};
    const sort: Record<string, -1 | 1> = {};
    const orConditions: any[] = [];

    const paginate = {
      limit: 0,
      skip: 0,
      page: 1,
      hasPaginate: false,
    };

    // === 1. Keyword search (name, code, _id) ===
    if (filters.keyword) {
      const keyword = filters.keyword.trim();
      const keywordConditions: any[] = [];

      if (ObjectId.isValid(keyword)) {
        keywordConditions.push({ _id: new ObjectId(keyword) });
      }

      const regex = createUnsignedRegex(keyword);
      keywordConditions.push({ name: { $regex: regex } });
      keywordConditions.push({ code: { $regex: regex } });

      if (keywordConditions.length === 1) {
        Object.assign(condition, keywordConditions[0]);
      } else {
        orConditions.push({ $or: keywordConditions });
      }
    }

    // === 2. Type filter ===
    if (filters.type?.length && Array.isArray(filters.type)) {
      condition.type = { $in: filters.type };
    }

    // === 3. isShow ===
    if (typeof filters.isShow === 'boolean') {
      condition.isShow = filters.isShow;
    }

    // === 4. Exclude products (ninProduct) ===
    if (filters.ninProduct?.length && Array.isArray(filters.ninProduct)) {
      const ninIds = filters.ninProduct
        .filter((id): id is string => typeof id === 'string' && ObjectId.isValid(id))
        .map((id) => new ObjectId(id));
      if (ninIds.length) {
        condition._id = { ...(condition._id || {}), $nin: ninIds };
      }
    }

    // === 5. Include specific IDs ===
    if (filters.ids?.length && Array.isArray(filters.ids)) {
      const inIds = filters.ids
        .filter((id): id is string => typeof id === 'string' && ObjectId.isValid(id))
        .map((id) => new ObjectId(id));
      if (inIds.length) {
        condition._id = { ...(condition._id || {}), $in: inIds };
      }
    }

    // === 6. Price range (defaultPrice) ===
    if (isNumber(filters.minPrice) || isNumber(filters.maxPrice)) {
      condition.defaultPrice = {};
      if (isNumber(filters.minPrice)) condition.defaultPrice.$gte = filters.minPrice;
      if (isNumber(filters.maxPrice)) condition.defaultPrice.$lte = filters.maxPrice;
    }

    // === 7. Category / SubCategory ===
    if (filters.categories?.length) {
      const catIds = filters.categories
        .filter((id): id is string => ObjectId.isValid(id))
        .map((id) => new ObjectId(id));
      if (catIds.length) {
        orConditions.push({ categoryId: { $in: catIds } });
      }
    }

    if (filters.subCategories?.length) {
      const subCatIds = filters.subCategories
        .filter((id): id is string => ObjectId.isValid(id))
        .map((id) => new ObjectId(id));
      if (subCatIds.length) {
        orConditions.push({ subCategoryId: { $in: subCatIds } });
      }
    }

    // === 8. Combine $or conditions ===
    if (orConditions.length === 1) {
      Object.assign(condition, orConditions[0]);
    } else if (orConditions.length > 1) {
      condition.$or = orConditions;
    }

    // === 9. Default sort ===
    if (filters.sort && filters.order) {
      sort[filters.sort] = filters.order === ESortOrder.Asc ? 1 : -1;
    } else {
      sort.createdAt = -1; // Mặc định mới nhất
    }

    // === 10. Pagination ===
    const page = isNumber(filters.page) && filters.page >= 1 ? filters.page : 1;
    const limit = isNumber(filters.limit) && filters.limit > 0 ? filters.limit : 20;

    paginate.page = page;
    paginate.limit = limit;
    paginate.skip = (page - 1) * limit;
    paginate.hasPaginate = true;

    return { condition, sort, paginate };
  }

  private buildProductPipeline(
    condition: any,
    sort: any,
    paginate: any,
    userId?: string,
    includeCategory = true,
    includePrice = true,
  ) {
    const pipeline: any[] = [{ $match: condition }];

    if (Object.keys(sort).length) {
      pipeline.push({ $sort: sort });
    }

    // Custom price
    if (includePrice) {
      if (userId) {
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
                        { $eq: ['$userId', new ObjectId(userId)] },
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
                $ifNull: [{ $arrayElemAt: ['$customPriceData.customPrice', 0] }, '$defaultPrice'],
              },
            },
          },
        );
      } else {
        pipeline.push({
          $addFields: { finalPrice: '$defaultPrice' },
        });
      }
    }

    // Join category
    if (includeCategory) {
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
      );
    }

    // Project
    pipeline.push({
      $project: {
        ...this.getProject(),
        category: includeCategory ? { $ifNull: ['$category', {}] } : undefined,
        finalPrice: includePrice ? 1 : undefined,
      },
    });

    return pipeline;
  }

  async getListMoreByUser(filters: IProductFilter) {
    const { condition, sort, paginate } = this.getQuery(filters);

    const pipeline = this.buildProductPipeline(condition, sort, paginate, filters.userId);

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
        totalPages: paginate.limit > 0 ? Math.ceil(totalData / paginate.limit) : 1,
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
