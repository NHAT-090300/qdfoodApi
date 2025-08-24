import to from 'await-to-js';
import { ObjectId } from 'mongodb';
import * as yup from 'yup';

import { ISupplier } from 'interface';
import { invalidInformation, validateWithYup } from 'utils';

const where = 'model.supplier';

export class Supplier implements ISupplier {
  _id?: ObjectId;
  name: string;
  email?: string;
  phone?: string;
  addressInfo?: {
    address: string;
    ward: string;
    city: string;
  };
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: ISupplier) {
    this._id = data._id;
    this.name = data.name;
    this.email = data.email;
    this.phone = data.phone;
    this.addressInfo = data.addressInfo;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  static async sequelize(data: any) {
    const schema = yup.object().shape({
      name: yup.string().required(),
      email: yup.string(),
      phone: yup.string(),
      addressInfo: yup.object().shape({
        address: yup.string().required(),
        ward: yup.string().required(),
        city: yup.string().required(),
      }),
    });

    const [errors, result] = await to(validateWithYup(schema, data));

    if (errors || !result) {
      throw invalidInformation(`${where}.validate`, 'Thông tin không hợp lệ', errors);
    }

    return new Supplier(result);
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
