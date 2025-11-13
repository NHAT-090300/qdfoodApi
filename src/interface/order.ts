import { ObjectId } from 'mongodb';
import { ESortOrder, EOrderStatus } from './enum';
import { IUser } from './user';
import { IProduct } from './product';

export interface IOrder {
  _id?: ObjectId;
  userId: ObjectId;
  user?: IUser;
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
  paymentVerifierId?: ObjectId | undefined;
  unpaidAmount?: number;
}

export enum EPaymentMethod {
  COD = 'COD',
  BANK_TRANSFER = 'BANK_TRANSFER',
}
export interface IOrderItem {
  productId: ObjectId;
  quantity: number;
  unitName: string;
  price: number;
  damagedQuantity?: number;
  refundAmount?: number;
  name?: string;
}

export interface IOrderShippingAddress {
  address: string;
  city: string;
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
  date?: string[];
  year?: string;
}

export interface IOrderWithUser extends IOrder {
  user?: IUser;
  product: IProduct;
}

export interface IStockOrder {
  _id: string;
  totalOrder: number;
  orderCount: number;
  totalInventory: number;
  missingQuantity: number;
  remainingStock: number;
  product: IProduct;
}
