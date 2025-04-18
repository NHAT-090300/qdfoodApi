import { ObjectId } from 'mongodb';
import { ESortOrder } from './enum';

export interface IFeedback {
  _id?: ObjectId;
  content: string;
  image: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IFeedbackFilter {
  keyword?: string;
  ids?: string[];
  page?: number;
  limit?: number;
  sort?: string;
  order?: ESortOrder;
}
