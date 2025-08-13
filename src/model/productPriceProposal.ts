import to from 'await-to-js';
import { ObjectId } from 'mongodb';
import * as yup from 'yup';

import { EStatusPriceProposal, IProductPriceProposal } from 'interface';
import { invalidInformation, validateWithYup } from 'utils';

const where = 'model.productPrice';

export class ProductPriceProposal implements IProductPriceProposal {
  _id?: ObjectId;
  userId: ObjectId;
  productId: ObjectId;
  customPrice: number;
  status: EStatusPriceProposal;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: IProductPriceProposal) {
    this._id = data._id;
    this.userId = data.userId;
    this.productId = data.productId;
    this.customPrice = data.customPrice || 0;
    this.status = data.status;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  static async sequelize(data: any) {
    const schema = yup.object().shape({
      userId: yup.string().objectId().required(),
      productId: yup.string().objectId().required(),
      customPrice: yup.number().required().default(0),
      status: yup.string().oneOf(Object.values(EStatusPriceProposal)).required(),
    });

    const [errors, result] = await to(validateWithYup(schema, data));

    if (errors || !result) {
      throw invalidInformation(`${where}.validate`, 'Thông tin không hợp lệ', errors);
    }

    return new ProductPriceProposal({
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
