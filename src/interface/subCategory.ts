import { ObjectId } from 'mongodb';
import { ESortOrder } from './enum';

export interface ISubCategory {
  _id?: ObjectId;
  categoryId: ObjectId;
  name: string;
  description?: string;
  slug?: string;
  isDelete?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export interface ISubCategoryFilter {
  keyword?: string;
  isDelete?: string[];
  page?: number;
  limit?: number;
  sort?: string;
  categoryId?: string;
  order?: ESortOrder;
}
