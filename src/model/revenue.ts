import to from 'await-to-js';
import { ObjectId } from 'mongodb';
import * as yup from 'yup';

import { IRevenue } from 'interface';
import { invalidInformation, validateWithYup } from 'utils';

const where = 'model.revenue';

export class Revenue implements IRevenue {
  _id?: ObjectId;
  totalRevenue: number;
  totalRefund: number;
  netRevenue: number;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: IRevenue) {
    this._id = data._id;
    this.totalRevenue = data.totalRevenue || 0;
    this.totalRefund = data.totalRefund || 0;
    this.netRevenue = data.netRevenue || 0;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  static async sequelize(data: any) {
    const schema = yup.object().shape({
      totalRevenue: yup.number().required().default(0),
      totalRefund: yup.number().required().default(0),
      netRevenue: yup.number().required().default(0),
    });

    const [errors, result] = await to(validateWithYup(schema, data));

    if (errors || !result) {
      throw invalidInformation(`${where}.validate`, 'Thông tin không hợp lệ', errors);
    }

    return new Revenue(result);
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
