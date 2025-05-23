import { ObjectId } from 'mongodb';
import { ESortOrder } from './enum';

export interface IProduct {
  _id?: ObjectId;
  images: string[];
  name: string;
  description?: string;
  categoryId: ObjectId;
  defaultPrice: number;
  unitName: EUnit;
  suppliers?: ISupplierInfo[];
  slug?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export enum EUnit {
  KG = 'kg',
  G = 'gam',
  L = 'lít',
  ML = 'ml',
  BOX = 'hộp',
  PACK = 'gói',
  BAG = 'túi',
  BOTTLE = 'chai',
  JAR = 'hũ',
  TUBE = 'ống',
  PIECE = 'cái',
  PAIR = 'cặp',
  CAN = 'lon',
  BUNDLE = 'bó',
}

export interface ISupplierInfo {
  supplierId: ObjectId;
  price: number;
  quantity: number;
}

export interface IProductFilter {
  categoryId?: string;
  keyword?: string;
  ids?: string[];
  page?: number;
  limit?: number;
  sort?: string;
  order?: ESortOrder;
  minPrice?: number;
  maxPrice?: number;
  district?: string;
  city?: string;
  direction?: string;
  category?: string;
  ninProduct?: string[];
}
