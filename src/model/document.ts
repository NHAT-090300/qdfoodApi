import to from 'await-to-js';
import { IDocument } from 'interface';
import { ObjectId } from 'mongodb';
import slugify from 'slugify';
import { invalidInformation, validateWithYup } from 'utils';
import { v1 as uuidv1 } from 'uuid';
import * as yup from 'yup';

const where = 'model.document';

export class Document implements IDocument {
  _id?: ObjectId;
  name: string;
  description?: string;
  url: string;
  slug?: string;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: IDocument) {
    this._id = data._id;
    this.name = data.name;
    this.description = data.description;
    this.url = data.url;
    this.slug = data.slug;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  static async sequelize(data: any) {
    const schema = yup.object().shape({
      name: yup.string().required(),
      description: yup.string(),
      url: yup.string().url().required(),
      slug: yup.string(),
    });

    const [errors, result] = await to(validateWithYup(schema, data));

    if (errors || !result) {
      throw invalidInformation(`${where}.validate`, 'Thông tin không hợp lệ', errors);
    }

    return new Document(result);
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
