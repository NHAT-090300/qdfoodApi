import to from 'await-to-js';
import { ObjectId } from 'mongodb';
import * as yup from 'yup';

import { IClient } from 'interface';
import { invalidInformation, validateWithYup } from 'utils';

const where = 'model.banner';

export class Client implements IClient {
  _id?: ObjectId;
  title: string;
  url: string;
  image: string;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: IClient) {
    this._id = data._id;
    this.title = data.title;
    this.url = data.url;
    this.image = data.image;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  static async sequelize(data: any) {
    const schema = yup.object().shape({
      title: yup.string().required(),
      url: yup.string().url().required(),
      image: yup.string().required(),
    });

    const [errors, result] = await to(validateWithYup(schema, data));

    if (errors || !result) {
      throw invalidInformation(`${where}.validate`, 'Thông tin không hợp lệ', errors);
    }

    return new Client(result);
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
