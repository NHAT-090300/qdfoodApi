import {
  EInventoryTransactionType,
  ESortOrder,
  IInventoryTransaction,
  IInventoryTransactionFilter,
} from 'interface';
import { isArray, isNumber } from 'lodash';
import { InventoryTransaction } from 'model';
import { ClientSession, Db, ObjectId } from 'mongodb';
import { createUnsignedRegex } from 'utils';

import { BaseStore } from './base';

export class MongoInventoryTransaction extends BaseStore<IInventoryTransaction> {
  constructor(db: Db) {
    super(db, 'inventory_transactions');
  }

  private getProject(custom: object = {}) {
    return {
      _id: 1,
      title: 1,
      url: 1,
      image: 1,
      supplier: 1,
      user: 1,
      createdAt: 1,
      updatedAt: 1,
      ...custom,
    };
  }

  private getQuery(filters: IInventoryTransactionFilter) {
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
      condition.type = {
        $in: filters.type,
      };
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

    return { condition, sort, paginate, conditionProduct };
  }

  async getPaginate(filters: IInventoryTransactionFilter) {
    const { condition, sort, paginate, conditionProduct } = this.getQuery(filters);

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
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user',
          },
        },
        {
          $addFields: {
            product: { $arrayElemAt: ['$product', 0] },
            supplier: { $arrayElemAt: ['$supplier', 0] },
            user: { $arrayElemAt: ['$user', 0] },
          },
        },
        {
          $sort: sort,
        },
        { $match: conditionProduct },
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

  async getList(filters: IInventoryTransactionFilter) {
    const { condition, sort, conditionProduct } = this.getQuery(filters);

    return await this.collection
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
          $addFields: {
            product: { $arrayElemAt: ['$product', 0] },
          },
        },
        {
          $sort: sort,
        },
        { $match: conditionProduct },
      ])
      .toArray();
  }

  async getOne(filters: IInventoryTransactionFilter) {
    const { condition } = this.getQuery(filters);
    return this.collection.findOne<IInventoryTransaction>(condition, {
      projection: this.getProject(),
    });
  }

  async createOne(data: InventoryTransaction, session?: ClientSession) {
    data.preSave();

    const result = await this.collection.insertOne({ ...data }, { session });
    data._id = result.insertedId;
    return data;
  }

  async updateOne(id: string, data: InventoryTransaction, session?: ClientSession) {
    data.preUpdate();

    await this.baseUpdate({ _id: new ObjectId(id) }, { $set: data }, { session });
    data._id = new ObjectId(id);
    return data;
  }

  async createMany(arrData: IInventoryTransaction[]) {
    const now = new Date();
    const preparedData = arrData.map((item) => {
      return {
        ...item,
        _id: item._id || new ObjectId(),
        createdAt: item.createdAt || now,
        updatedAt: now,
      };
    });
    await this.collection.insertMany(preparedData);
  }

  async getMoneyStatsByMonthAllYears(filters: IInventoryTransactionFilter) {
    const { paginate } = this.getQuery(filters);

    // 1. Lấy tất cả giao dịch theo tháng (gộp tất cả năm)
    const monthsData: any[] = await this.collection
      .aggregate([
        {
          $match: {
            ...(filters.startDate || filters.endDate
              ? {
                  createdAt: {
                    ...(filters.startDate && { $gte: new Date(filters.startDate) }),
                    ...(filters.endDate && { $lte: new Date(filters.endDate) }),
                  },
                }
              : {}),
          },
        },
        {
          $addFields: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' },
            money: { $multiply: ['$quantity', '$price'] },
          },
        },
        {
          $group: {
            _id: { year: '$year', month: '$month' },
            totalImport: {
              $sum: { $cond: [{ $eq: ['$type', EInventoryTransactionType.IMPORT] }, '$money', 0] },
            },
            totalExport: {
              $sum: { $cond: [{ $eq: ['$type', EInventoryTransactionType.EXPORT] }, '$money', 0] },
            },
          },
        },
        {
          $project: {
            year: '$_id.year',
            month: '$_id.month',
            totalImport: 1,
            totalExport: 1,
            _id: 0,
          },
        },
        { $sort: { year: 1, month: 1 } },
      ])
      .toArray();

    // 2. Pagination theo tháng
    const totalItems = monthsData.length;
    const start = paginate.skip;
    const end = paginate.skip + paginate.limit;
    const pagedMonths = monthsData.slice(start, end);

    // 3. Tổng năm hiện tại
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const yearData = monthsData.filter((m) => m.year === currentYear);
    const totalYearImport = yearData.reduce((sum, m) => sum + m.totalImport, 0);
    const totalYearExport = yearData.reduce((sum, m) => sum + m.totalExport, 0);

    // 4. Tổng tháng hiện tại
    const monthData = monthsData.find((m) => m.year === currentYear && m.month === currentMonth);
    const totalMonthImport = monthData?.totalImport ?? 0;
    const totalMonthExport = monthData?.totalExport ?? 0;

    return {
      data: pagedMonths,
      totalYearImport,
      totalYearExport,
      totalMonthImport,
      totalMonthExport,
      pagination: {
        page: paginate.page,
        limit: paginate.limit,
        totalItems,
        totalPages: Math.ceil(totalItems / paginate.limit),
      },
    };
  }

  async getInventoryShortageByMonth(filters: IInventoryTransactionFilter) {
    const { paginate } = this.getQuery(filters);

    // Xác định ngày đầu và cuối tháng
    const start =
      filters.year && filters.month
        ? new Date(Date.UTC(filters.year, filters.month - 1, 1, 0, 0, 0))
        : new Date(0);
    const end =
      filters.year && filters.month
        ? new Date(Date.UTC(filters.year, filters.month, 0, 23, 59, 59))
        : new Date();

    const pipeline = [
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          type: {
            $in: [
              EInventoryTransactionType.IMPORT,
              EInventoryTransactionType.EXPORT,
              EInventoryTransactionType.PRODUC_IMPORT,
              EInventoryTransactionType.PRODUC_EXPORT,
              EInventoryTransactionType.DAMAGED,
            ],
          },
        },
      },
      {
        $group: {
          _id: '$productId',
          totalImport: {
            $sum: {
              $cond: [
                {
                  $in: [
                    '$type',
                    [EInventoryTransactionType.IMPORT, EInventoryTransactionType.PRODUC_IMPORT],
                  ],
                },
                '$quantity',
                0,
              ],
            },
          },
          totalExport: {
            $sum: {
              $cond: [
                {
                  $in: [
                    '$type',
                    [
                      EInventoryTransactionType.EXPORT,
                      EInventoryTransactionType.PRODUC_EXPORT,
                      EInventoryTransactionType.DAMAGED,
                    ],
                  ],
                },
                '$quantity',
                0,
              ],
            },
          },
          totalImportMoney: {
            $sum: {
              $cond: [
                {
                  $in: [
                    '$type',
                    [EInventoryTransactionType.IMPORT, EInventoryTransactionType.IMPORT],
                  ],
                },
                { $multiply: ['$quantity', '$price'] },
                0,
              ],
            },
          },
          totalExportMoney: {
            $sum: {
              $cond: [
                {
                  $in: [
                    '$type',
                    [
                      EInventoryTransactionType.EXPORT,
                      EInventoryTransactionType.PRODUC_EXPORT,
                      EInventoryTransactionType.DAMAGED,
                    ],
                  ],
                },
                { $multiply: ['$quantity', '$price'] },
                0,
              ],
            },
          },
        },
      },
      {
        $addFields: {
          shortageQuantity: { $subtract: ['$totalImport', '$totalExport'] },
          shortageMoney: { $subtract: ['$totalImportMoney', '$totalExportMoney'] },
        },
      },
      {
        $lookup: {
          from: 'product',
          localField: '_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          productId: { $toString: '$_id' },
          productName: '$product.name',
          productCode: '$product.code',
          productUnit: '$product.unitName',
          productType: '$product.type',
          productImages: '$product.images',
          totalImport: 1,
          totalExport: 1,
          shortageQuantity: 1,
          totalImportMoney: 1,
          totalExportMoney: 1,
          shortageMoney: 1,
        },
      },
      {
        $facet: {
          data: [
            { $sort: { productName: 1 } },
            { $skip: paginate.skip },
            { $limit: paginate.limit },
          ],
          pageInfo: [{ $count: 'totalItems' }],
        },
      },
    ];

    const result = await this.collection.aggregate(pipeline).next();

    const totalItems = result?.pageInfo[0]?.totalItems ?? 0;

    return {
      data: result?.data ?? [],
      pagination: {
        page: paginate.page,
        limit: paginate.limit,
        totalItems,
        totalPages: Math.ceil(totalItems / paginate.limit),
      },
    };
  }
}
