import { ObjectId } from 'mongodb';
import { ESortOrder } from './enum';

export interface IPartner {
  _id?: ObjectId;
  title: string;
  image: string;
  url: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPartnerFilter {
  keyword?: string;
  ids?: string[];
  page?: number;
  limit?: number;
  sort?: string;
  order?: ESortOrder;
}
