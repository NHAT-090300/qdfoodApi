import { ObjectId } from 'mongodb';
import { EInventoryTransactionType, ESortOrder } from './enum';

export interface IInventoryTransaction {
  _id?: ObjectId;
  productId: ObjectId;
  supplierId?: ObjectId;
  type: EInventoryTransactionType;
  quantity: number;
  orderId?: ObjectId;
  userId?: ObjectId;
  productLogId?: ObjectId;
  relatedOrderId?: ObjectId;
  price: number;
  refundAmount?: number;
  note?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IInventoryTransactionFilter {
  keyword?: string;
  ids?: string[];
  type?: string[];
  page?: number;
  limit?: number;
  sort?: string;
  order?: ESortOrder;
  startDate?: string;
  endDate?: string;
  year?: number;
  month?: number;
}

export interface IInventoryShortageItem {
  productId: ObjectId;
  totalImport: number; // số lượng xuất kho để sản xuất (PRODUC_IMPORT)
  totalExport: number; // số lượng nhập kho thành phẩm (PRODUC_EXPORT)
  shortageQuantity: number; // totalImport - totalExport
  totalImportMoney: number; // tổng tiền xuất kho để sản xuất
  totalExportMoney: number; // tổng tiền nhập kho thành phẩm
  shortageMoney: number; // totalImportMoney - totalExportMoney
}
