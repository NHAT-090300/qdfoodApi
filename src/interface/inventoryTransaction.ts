import { ObjectId } from 'mongodb';
import { EInventoryTransactionType, ESortOrder } from './enum';

export interface IInventoryTransaction {
  _id?: ObjectId;
  productId: ObjectId;
  supplierId?: ObjectId;
  type: EInventoryTransactionType;
  quantity: number;
  orderId?: ObjectId;
  userId?: ObjectId;
  productLogId?: ObjectId;
  relatedOrderId?: ObjectId;
  price: number;
  refundAmount?: number;
  note?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IInventoryTransactionFilter {
  keyword?: string;
  ids?: string[];
  type?: string[];
  page?: number;
  limit?: number;
  sort?: string;
  order?: ESortOrder;
}
