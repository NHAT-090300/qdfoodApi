import { ObjectId } from 'mongodb';
import { ESortOrder } from './enum';

export interface IProduct {
  _id?: ObjectId;
  images?: string[];
  name: string;
  description?: string;
  categoryId: ObjectId;
  subCategoryId?: ObjectId;
  defaultPrice: number;
  unitName: EUnit;
  type: EProductType;
  suppliers?: ISupplierInfo[];
  isRetailAvailable?: boolean;
  slug?: string;
  createdAt?: Date;
  updatedAt?: Date;
  code: string;
}

export enum EUnit {
  KG = 'kg',
  G = 'gam',
  L = 'l',
  ML = 'ml',
  BOX = 'box',
  PACK = 'pack',
  BAG = 'bag',
  BOTTLE = 'bottle',
  JAR = 'jar',
  TUBE = 'tube',
  PIECE = 'piece',
  PAIR = 'pair',
  CAN = 'can',
  BUNDLE = 'bundle',
}

export enum EProductType {
  PRODUCT = 'product',
  MATERIAL = 'material',
}

export const EUnitDisplay: Record<EUnit, string> = {
  [EUnit.KG]: 'kg',
  [EUnit.G]: 'gam',
  [EUnit.L]: 'lít',
  [EUnit.ML]: 'ml',
  [EUnit.BOX]: 'hộp',
  [EUnit.PACK]: 'gói',
  [EUnit.BAG]: 'túi',
  [EUnit.BOTTLE]: 'chai',
  [EUnit.JAR]: 'hũ',
  [EUnit.TUBE]: 'ống',
  [EUnit.PIECE]: 'cái',
  [EUnit.PAIR]: 'cặp',
  [EUnit.CAN]: 'lon',
  [EUnit.BUNDLE]: 'bó',
};

export interface ISupplierInfo {
  supplierId: ObjectId;
  price: number;
  quantity: number;
}

export interface IProductFilter {
  categoryId?: string;
  categories?: string[];
  subCategories?: string[];
  keyword?: string;
  ids?: string[];
  page?: number;
  limit?: number;
  sort?: string;
  order?: ESortOrder;
  minPrice?: number;
  maxPrice?: number;
  city?: string;
  direction?: string;
  category?: string;
  ninProduct?: string[];
  type?: EProductType[];
  userId?: string;
  cartItems?: {
    productId: string;
    quantity: number;
  }[];
}
