import { ObjectId } from 'mongodb';
import { ESortOrder } from './enum';

export interface IClient {
  _id?: ObjectId;
  title: string;
  image: string;
  url: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IClientFilter {
  keyword?: string;
  ids?: string[];
  page?: number;
  limit?: number;
  sort?: string;
  order?: ESortOrder;
}
