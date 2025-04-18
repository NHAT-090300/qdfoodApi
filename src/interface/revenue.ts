import { ObjectId } from 'mongodb';
import { ESortOrder } from './enum';

export interface IRevenue {
  _id?: ObjectId;
  totalRevenue: number;
  totalRefund: number;
  netRevenue: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IRevenueFilter {
  keyword?: string;
  ids?: string[];
  page?: number;
  limit?: number;
  sort?: string;
  order?: ESortOrder;
}
