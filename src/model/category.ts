import to from 'await-to-js';
import { ObjectId } from 'mongodb';
import * as yup from 'yup';
import slugify from 'slugify';
// eslint-disable-next-line import/no-extraneous-dependencies
import { v1 as uuidv1 } from 'uuid';

import { ICategory } from 'interface';
import { invalidInformation, validateWithYup } from 'utils';

const where = 'model.category';

export class Category implements ICategory {
  _id?: ObjectId;
  name: string;
  description?: string;
  image: string;
  slug?: string;
  isDelete?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;

  constructor(data: ICategory) {
    this._id = data._id;
    this.name = data.name;
    this.description = data.description;
    this.image = data.image;
    this.slug = data.slug;
    this.isDelete = data.isDelete || false;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  static async sequelize(data: any) {
    const schema = yup.object().shape({
      name: yup.string().required(),
      description: yup.string(),
      image: yup.string().required(),
      isDelete: yup.boolean(),
    });

    const [errors, result] = await to(validateWithYup(schema, data));

    if (errors || !result) {
      throw invalidInformation(`${where}.validate`, 'Thông tin không hợp lệ', errors);
    }

    return new Category(result);
  }

  preSave() {
    const slug = slugify(`${this?.name} ${uuidv1()}`, {
      replacement: '-',
      remove: undefined,
      lower: true,
      strict: false,
      locale: 'vi',
      trim: true,
    });
    if (!this._id) delete this._id;
    if (!this.createdAt) this.createdAt = new Date();
    this.slug = slug;
    this.updatedAt = this.createdAt;
  }

  preUpdate() {
    delete this._id;
    delete this.createdAt;
    this.updatedAt = new Date();
  }
}
