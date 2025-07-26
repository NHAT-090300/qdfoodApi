import to from 'await-to-js';
import { ObjectId } from 'mongodb';
import * as yup from 'yup';

import { EInventoryTransactionType, IInventoryTransaction } from 'interface';
import { invalidInformation, validateWithYup } from 'utils';

const where = 'model.inventoryTransaction';

export class InventoryTransaction implements IInventoryTransaction {
  _id?: ObjectId;
  productId: ObjectId;
  supplierId?: ObjectId;
  type: EInventoryTransactionType;
  quantity: number;
  orderId?: ObjectId;
  note?: string;
  warehousePrice: number;
  refundPrice?: number;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: IInventoryTransaction) {
    this._id = data._id;
    this.productId = data.productId;
    this.supplierId = data.supplierId;
    this.type = data.type;
    this.quantity = data.quantity || 0;
    this.warehousePrice = data.warehousePrice || 0;
    this.orderId = data.orderId;
    this.note = data.note;
    this.refundPrice = data?.refundPrice || 0;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  static async sequelize(data: any) {
    const schema = yup.object().shape({
      productId: yup.string().objectId().required(),
      supplierId: yup.string().objectId(),
      warehousePrice: yup.number().default(0),
      type: yup.string().oneOf(Object.values(EInventoryTransactionType)).required(),
      quantity: yup.number().required().default(0),
      orderId: yup.string().objectId(),
      note: yup.string(),
      refundPrice: yup.number().default(0),
    });

    const [errors, result] = await to(validateWithYup(schema, data));

    if (errors || !result) {
      throw invalidInformation(`${where}.validate`, 'Thông tin không hợp lệ', errors);
    }

    return new InventoryTransaction({
      ...result,
      productId: new ObjectId(result.productId),
      supplierId: result?.supplierId ? new ObjectId(result?.supplierId) : undefined,
      orderId: result?.orderId ? new ObjectId(result.orderId) : undefined,
    });
  }

  static async sequelizeArray(data: IInventoryTransaction[]) {
    const schema = yup.object({
      items: yup
        .array()
        .of(
          yup.object({
            productId: yup.string().objectId().required(),
            supplierId: yup.string().objectId().required(),
            quantity: yup.number().default(0),
            type: yup.string().oneOf(Object.values(EInventoryTransactionType)),
            warehousePrice: yup.number().default(0),
            note: yup.string().default(''),
          }),
        )
        .required(),
    });

    const [errors, result] = await to(validateWithYup(schema, { items: data }));

    if (errors || !result) {
      throw invalidInformation(`${where}.validate`, 'Thông tin không hợp lệ', errors);
    }

    return result.items.map(
      (item: any) =>
        new InventoryTransaction({
          ...item,
          productId: new ObjectId(item.productId),
          supplierId: new ObjectId(item.supplierId),
        }),
    );
  }

  preSave() {
    if (!this._id) delete this._id;
    if (!this.createdAt) this.createdAt = new Date();
    this.updatedAt = this.createdAt;
  }

  preUpdate() {
    delete this._id;
    delete this.createdAt;
    this.updatedAt = new Date();
  }
}
