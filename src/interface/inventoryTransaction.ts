import { ObjectId } from 'mongodb';
import { EInventoryTransactionType, ESortOrder } from './enum';

export interface IInventoryTransaction {
  _id?: ObjectId;
  productId: ObjectId;
  supplierId?: ObjectId;
  type: EInventoryTransactionType;
  quantity: number;
  orderId?: ObjectId;
  relatedOrderId?: ObjectId;
  warehousePrice: number;
  refundPrice?: number;
  note?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IInventoryTransactionFilter {
  keyword?: string;
  keywordProduct?: string;
  ids?: string[];
  page?: number;
  limit?: number;
  sort?: string;
  order?: ESortOrder;
}
