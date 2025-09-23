import { ObjectId } from 'mongodb';
import { ESortOrder } from './enum';
import { EProductType } from './product';

export interface IInventory {
  _id?: ObjectId;
  productId: ObjectId;
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
  type: EProductType;
}
