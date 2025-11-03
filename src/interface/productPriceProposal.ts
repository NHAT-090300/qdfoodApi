import { ObjectId } from 'mongodb';
import { ESortOrder } from './enum';

export interface IProductPriceProposal {
  _id?: ObjectId;
  userId: ObjectId;
  productId: ObjectId;
  customPrice: number;
  status: EStatusPriceProposal;
  createdAt?: Date;
  updatedAt?: Date;
}

export enum EStatusPriceProposal {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface IProductPriceProposalFilter {
  keyword?: string;
  ids?: string[];
  page?: number;
  limit?: number;
  sort?: string;
  order?: ESortOrder;
  userId?: string;
}

export interface IPriceProposal {
  productId: ObjectId;
  price: number;
  code?: string;
}
