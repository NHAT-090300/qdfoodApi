import { ObjectId } from 'mongodb';
import { ESortOrder } from './enum';

export interface INews {
  _id?: ObjectId;
  name: string;
  description: string;
  image: string;
  link?: string;
  slug?: string;
  content?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface INewsFilter {
  keyword?: string;
  ids?: string[];
  page?: number;
  limit?: number;
  sort?: string;
  order?: ESortOrder;
}
