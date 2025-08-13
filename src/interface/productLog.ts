import { ObjectId } from 'mongodb';
import { ESortOrder } from './enum';

export interface IProductLog {
  _id?: ObjectId;
  outputItem: {
    productId: ObjectId;
    quantity: number;
  }[];
  ingredientItem: {
    productId: ObjectId;
    quantity: number;
  }[];
  userId: ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IProductLogItem {
  productId: string;
  quantity: number;
}

export interface IProductLogFilter {
  keyword?: string;
  ids?: string[];
  page?: number;
  limit?: number;
  sort?: string;
  order?: ESortOrder;
}
