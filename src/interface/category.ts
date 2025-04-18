import { ObjectId } from 'mongodb';
import { ESortOrder } from './enum';

export interface ICategory {
  _id?: ObjectId;
  image: string;
  name: string;
  description?: string;
  slug?: string;
  isDelete?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export interface ICategoryFilter {
  keyword?: string;
  isDelete?: string[];
  page?: number;
  limit?: number;
  sort?: string;
  order?: ESortOrder;
}
