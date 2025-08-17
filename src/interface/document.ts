import { ObjectId } from 'mongodb';
import { ESortOrder } from './enum';

export interface IDocument {
  _id?: ObjectId;
  name: string;
  description?: string;
  url: string;
  type: ETypeDocument;
  slug?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export enum ETypeDocument {
  CONTACT = 'CONTACT',
  CERTIFICATE = 'CERTIFICATE',
}

export interface IDocumentFilter {
  keyword?: string;
  ids?: string[];
  page?: number;
  limit?: number;
  sort?: string;
  order?: ESortOrder;
}
