import { ObjectId } from 'mongodb';
import { ESortOrder, EOrderStatus } from './enum';

export interface IOrder {
  _id?: ObjectId;
  userId: ObjectId;
  status: EOrderStatus;
  total: number;
  shippingAddress: {
    address: string;
    city: string;
    district: string;
    ward: string;
  };
  items: {
    productId: ObjectId;
    quantity: number;
    unitPrice: string;
    damagedQuantity: number;
    refundAmount: number;
  }[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IOrderFilter {
  keyword?: string;
  ids?: string[];
  page?: number;
  limit?: number;
  sort?: string;
  order?: ESortOrder;
}
