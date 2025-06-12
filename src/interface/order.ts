import { ObjectId } from 'mongodb';
import { ESortOrder, EOrderStatus } from './enum';

export interface IOrder {
  _id?: ObjectId;
  userId: ObjectId;
  status: EOrderStatus;
  total: number;
  shippingAddress: IOrderShippingAddress;
  items: IOrderItem[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IOrderItem {
  productId: ObjectId;
  quantity: number;
  unitPrice: string;
  price: number;
  damagedQuantity?: number;
  refundAmount?: number;
}

export interface IOrderShippingAddress {
  address: string;
  city: string;
  district: string;
  ward: string;
}

export interface IOrderFilter {
  keyword?: string;
  ids?: string[];
  page?: number;
  limit?: number;
  sort?: string;
  order?: ESortOrder;
}
