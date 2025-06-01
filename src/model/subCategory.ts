import to from 'await-to-js';
import { ObjectId } from 'mongodb';
import * as yup from 'yup';
import slugify from 'slugify';
import { v1 as uuidv1 } from 'uuid';

import { ISubCategory } from 'interface';
import { invalidInformation, validateWithYup } from 'utils';

const where = 'model.category';

export class SubCategory implements ISubCategory {
  _id?: ObjectId;
  categoryId: ObjectId;
  name: string;
  description?: string;
  slug?: string;
  isDelete?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;

  constructor(data: ISubCategory) {
    this._id = data._id;
    this.categoryId = data.categoryId;
    this.name = data.name;
    this.description = data.description;
    this.slug = data.slug;
    this.isDelete = data.isDelete || false;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  static async sequelize(data: any) {
    const schema = yup.object().shape({
      name: yup.string().required(),
      categoryId: yup.string().required(),
      description: yup.string(),
      isDelete: yup.boolean(),
    });

    const [errors, result] = await to(validateWithYup(schema, data));

    if (errors || !result) {
      throw invalidInformation(`${where}.validate`, 'Thông tin không hợp lệ', errors);
    }

    return new SubCategory({
      ...result,
      categoryId: new ObjectId(result?.categoryId),
    });
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
