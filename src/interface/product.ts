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
  isShow?: boolean;
  slug?: string;
  createdAt?: Date;
  updatedAt?: Date;
  code: string;
  tax: number;
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
  FRUIT = 'fruit',
  UNIT = 'unit',
  MULTIPACK = 'multipack',
  SLICE = 'slice',
  BLISTER = 'blister',
  BUNCH = 'bunch',
  TRAY = 'tray',
  ROLL = 'roll',
  STACK = 'stack',
  VEGETABLE_BUNCH = 'vegetable_bunch',
  PILL = 'pill',
  CRATE = 'crate',
  CYLINDER = 'cylinder',
  SPINACH = 'spinach',
  SET = 'set',
  TREE = 'tree',
  BALL = 'ball',
}

export enum EProductType {
  PRODUCT = 'product',
  MATERIAL = 'material',
}

export const EUnitDisplay: Record<EUnit, string> = {
  [EUnit.KG]: 'kg',
  [EUnit.G]: 'g',
  [EUnit.L]: 'l',
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
  [EUnit.FRUIT]: 'trái',
  [EUnit.UNIT]: 'con',
  [EUnit.MULTIPACK]: 'lốc',
  [EUnit.SLICE]: 'lát',
  [EUnit.BLISTER]: 'vĩ',
  [EUnit.BUNCH]: 'nải',
  [EUnit.TRAY]: 'khay',
  [EUnit.ROLL]: 'cuộn',
  [EUnit.STACK]: 'xấp',
  [EUnit.VEGETABLE_BUNCH]: 'ky',
  [EUnit.PILL]: 'viên',
  [EUnit.CRATE]: 'thùng',
  [EUnit.CYLINDER]: 'bình',
  [EUnit.SPINACH]: 'bó',
  [EUnit.SET]: 'bộ',
  [EUnit.TREE]: 'cây',
  [EUnit.BALL]: 'quả',
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
  isShow?: boolean;
  cartItems?: {
    productId: string;
    quantity: number;
  }[];
}
