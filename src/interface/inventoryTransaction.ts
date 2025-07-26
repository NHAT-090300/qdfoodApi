import { ObjectId } from 'mongodb';
import { ESortOrder, EInventoryTransactionType } from './enum';
import { IProduct } from './product';

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
  ids?: string[];
  page?: number;
  limit?: number;
  sort?: string;
  order?: ESortOrder;
}
