import to from 'await-to-js';
import { ObjectId } from 'mongodb';
import * as yup from 'yup';

import { IProductPrice } from 'interface';
import { invalidInformation, validateWithYup } from 'utils';

const where = 'model.productPrice';

export class ProductPrice implements IProductPrice {
  _id?: ObjectId;
  userId: ObjectId;
  productId: ObjectId;
  customPrice: number;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: IProductPrice) {
    this._id = data._id;
    this.userId = data.userId;
    this.productId = data.productId;
    this.customPrice = data.customPrice || 0;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  static async sequelize(data: any) {
    const schema = yup.object().shape({
      userId: yup.string().objectId().required(),
      productId: yup.string().objectId().required(),
      customPrice: yup.number().required().default(0),
    });

    const [errors, result] = await to(validateWithYup(schema, data));

    if (errors || !result) {
      throw invalidInformation(`${where}.validate`, 'Thông tin không hợp lệ', errors);
    }

    return new ProductPrice({
      ...result,
      userId: new ObjectId(result.userId),
      productId: new ObjectId(result.productId),
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
