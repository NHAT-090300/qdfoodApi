import to from 'await-to-js';
import { ObjectId } from 'mongodb';
import * as yup from 'yup';

import { IProductLog } from 'interface';
import { invalidInformation, validateWithYup } from 'utils';

const where = 'model.productLog';

export class ProductLog implements IProductLog {
  _id?: ObjectId;
  outputItem: {
    productId: ObjectId;
    quantity: number;
  }[];
  ingredientItem: {
    productId: ObjectId;
    quantity: number;
  }[];
  userId: ObjectId;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: IProductLog) {
    this._id = data._id;
    this.outputItem = data.outputItem;
    this.ingredientItem = data.ingredientItem;
    this.userId = data.userId;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  static async sequelize(data: any) {
    const schema = yup.object().shape({
      ingredientItem: yup
        .array()
        .of(
          yup.object().shape({
            productId: yup.string().objectId().required(),
            quantity: yup.number().min(0).required(),
          }),
        )
        .default([]),
      outputItem: yup
        .array()
        .of(
          yup.object().shape({
            productId: yup.string().objectId().required(),
            quantity: yup.number().min(0).required(),
          }),
        )
        .default([]),
      userId: yup.string().objectId().required(),
    });

    const [errors, result] = await to(validateWithYup(schema, data));

    if (errors || !result) {
      throw invalidInformation(`${where}.validate`, 'Thông tin không hợp lệ', errors);
    }

    return new ProductLog({
      ...result,
      userId: new ObjectId(result.userId),
      outputItem: result?.outputItem?.map((item: { productId: string; quantity: number }) => ({
        ...item,
        productId: new ObjectId(item?.productId),
      })),
      ingredientItem: result?.ingredientItem?.map(
        (item: { productId: string; quantity: number }) => ({
          ...item,
          productId: new ObjectId(item?.productId),
        }),
      ),
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
