import { ObjectId } from 'mongodb';
import { ESortOrder, EOrderStatus } from './enum';
import { IUser } from './user';

export interface IOrder {
  _id?: ObjectId;
  userId: ObjectId;
  status: EOrderStatus;
  total: number;
  shippingAddress: IOrderShippingAddress;
  items: IOrderItem[];
  paymentMethod?: EPaymentMethod;
  note?: string;
  phoneNumber?: string;
  isPaid?: boolean;
  isDelivered?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export enum EPaymentMethod {
  COD = 'COD',
  BANK_TRANSFER = 'BANK_TRANSFER',
}
export interface IOrderItem {
  productId: ObjectId;
  quantity: number;
  unitPrice: string;
  price: number;
  damagedQuantity?: number;
  refundAmount?: number;
  name?: string;
}

export interface IOrderShippingAddress {
  address: string;
  city: string;
  district: string;
  ward: string;
}

export interface IOrderFilter {
  keyword?: string;
  userId?: string;
  status?: EOrderStatus[];
  ids?: string[];
  page?: number;
  limit?: number;
  sort?: string;
  order?: ESortOrder;
}

export interface IOrderWithUser extends IOrder {
  user?: IUser;
}
