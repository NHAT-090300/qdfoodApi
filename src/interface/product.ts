import { ObjectId } from 'mongodb';
import { ESortOrder } from './enum';

export interface IProduct {
  _id?: ObjectId;
  images: string[];
  name: string;
  description?: string;
  categoryId: ObjectId;
  defaultPrice: number;
  suppliers?: ISupplierInfo[];
  slug?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISupplierInfo {
  supplierId: ObjectId;
  price: number;
  quantity: number;
}

export interface IProductFilter {
  categoryId?: string;
  keyword?: string;
  ids?: string[];
  page?: number;
  limit?: number;
  sort?: string;
  order?: ESortOrder;
  minPrice?: number;
  maxPrice?: number;
}
