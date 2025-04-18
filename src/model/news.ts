import to from 'await-to-js';
import { ObjectId } from 'mongodb';
import * as yup from 'yup';

import { INews } from 'interface';
import { invalidInformation, validateWithYup } from 'utils';

const where = 'model.banner';

export class News implements INews {
  _id?: ObjectId;
  name: string;
  description: string;
  link: string;
  image: string;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: INews) {
    this._id = data._id;
    this.name = data.name;
    this.description = data.description;
    this.link = data.link;
    this.image = data.image;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  static async sequelize(data: any) {
    const schema = yup.object().shape({
      name: yup.string().required(),
      description: yup.string().required(),
      link: yup.string().url().required(),
      image: yup.string().required(),
    });

    const [errors, result] = await to(validateWithYup(schema, data));

    if (errors || !result) {
      throw invalidInformation(`${where}.validate`, 'Thông tin không hợp lệ', errors);
    }

    return new News(result);
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
