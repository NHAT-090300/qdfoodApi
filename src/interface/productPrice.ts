import { ObjectId } from 'mongodb';
import { ESortOrder } from './enum';

export interface IProductPrice {
  _id?: ObjectId;
  userId: ObjectId;
  productId: ObjectId;
  customPrice: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IProductPriceFilter {
  keyword?: string;
  ids?: string[];
  page?: number;
  limit?: number;
  sort?: string;
  order?: ESortOrder;
}
