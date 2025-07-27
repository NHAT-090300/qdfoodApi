import to from 'await-to-js';
import { INews } from 'interface';
import { ObjectId } from 'mongodb';
import slugify from 'slugify';
import { invalidInformation, validateWithYup } from 'utils';
import { v1 as uuidv1 } from 'uuid';
import * as yup from 'yup';

const where = 'model.banner';

export class News implements INews {
  _id?: ObjectId;
  name: string;
  description: string;
  link?: string;
  content?: string;
  image: string;
  slug?: string;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: INews) {
    this._id = data._id;
    this.name = data.name;
    this.description = data.description;
    this.link = data.link;
    this.content = data.content;
    this.image = data.image;
    this.slug = data.slug;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  static async sequelize(data: any) {
    const schema = yup.object().shape({
      name: yup.string().required(),
      description: yup.string().required(),
      content: yup.string(),
      link: yup.string().url(),
      image: yup.string().required(),
      slug: yup.string(),
    });

    const [errors, result] = await to(validateWithYup(schema, data));

    if (errors || !result) {
      throw invalidInformation(`${where}.validate`, 'Thông tin không hợp lệ', errors);
    }

    return new News(result);
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
