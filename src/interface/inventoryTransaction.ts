import { ObjectId } from 'mongodb';
import { ESortOrder, EInventoryTransactionType } from './enum';

export interface IInventoryTransaction {
  _id?: ObjectId;
  productId: ObjectId;
  supplierId: ObjectId;
  type: EInventoryTransactionType;
  quantity: number;
  orderId?: ObjectId;
  warehousePrice: number;
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
