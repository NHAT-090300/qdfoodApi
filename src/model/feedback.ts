import to from 'await-to-js';
import { ObjectId } from 'mongodb';
import * as yup from 'yup';

import { IFeedback } from 'interface';
import { invalidInformation, validateWithYup } from 'utils';

const where = 'model.feedback';

export class Feedback implements IFeedback {
  _id?: ObjectId;
  content: string;
  image: string;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: IFeedback) {
    this._id = data._id;
    this.content = data.content;
    this.image = data.image;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  static async sequelize(data: any) {
    const schema = yup.object().shape({
      content: yup.string().required(),
      image: yup.string().required(),
    });

    const [errors, result] = await to(validateWithYup(schema, data));

    if (errors || !result) {
      throw invalidInformation(`${where}.validate`, 'Thông tin không hợp lệ', errors);
    }

    return new Feedback(result);
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
