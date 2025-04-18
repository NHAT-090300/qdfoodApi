import { ObjectId } from 'mongodb';
import { ESortOrder } from './enum';

export interface ISupplier {
  _id?: ObjectId;
  name: string;
  email?: string;
  phone?: string;
  addressInfo?: {
    address: string;
    ward: string;
    district: string;
    city: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISupplierFilter {
  keyword?: string;
  ids?: string[];
  page?: number;
  limit?: number;
  sort?: string;
  order?: ESortOrder;
}
