import { ObjectId } from 'mongodb';
import { ESortOrder } from './enum';

export interface IBanner {
  _id?: ObjectId;
  title: string;
  url: string;
  image: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IBannerFilter {
  keyword?: string;
  ids?: string[];
  page?: number;
  limit?: number;
  sort?: string;
  order?: ESortOrder;
}
