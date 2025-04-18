import { ObjectId } from 'mongodb';
import { ESortOrder } from './enum';

export interface IInventory {
  _id?: ObjectId;
  productId: ObjectId;
  supplierId: ObjectId;
  quantity: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IInventoryFilter {
  keyword?: string;
  ids?: string[];
  page?: number;
  limit?: number;
  sort?: string;
  order?: ESortOrder;
}
