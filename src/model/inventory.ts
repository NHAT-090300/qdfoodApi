import to from 'await-to-js';
import { ObjectId } from 'mongodb';
import * as yup from 'yup';

import { IInventory } from 'interface';
import { invalidInformation, validateWithYup } from 'utils';

const where = 'model.inventory';

export class Inventory implements IInventory {
  _id?: ObjectId;
  productId: ObjectId;
  supplierId: ObjectId;
  quantity: number;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: IInventory) {
    this._id = data._id;
    this.productId = data.productId;
    this.supplierId = data.supplierId;
    this.quantity = data.quantity || 0;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  static async sequelize(data: any) {
    const schema = yup.object().shape({
      productId: yup.string().objectId().required(),
      supplierId: yup.string().objectId().required(),
      quantity: yup.number().default(0),
    });

    const [errors, result] = await to(validateWithYup(schema, data));

    if (errors || !result) {
      throw invalidInformation(`${where}.validate`, 'Thông tin không hợp lệ', errors);
    }

    return new Inventory({
      ...result,
      productId: new ObjectId(result.productId),
      supplierId: new ObjectId(result.supplierId),
    });
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
