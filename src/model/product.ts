import to from 'await-to-js';
import { ObjectId } from 'mongodb';
import * as yup from 'yup';
import slugify from 'slugify';
import { v1 as uuidv1 } from 'uuid';

import { EUnit, IProduct, ISupplierInfo } from 'interface';
import { invalidInformation, validateWithYup } from 'utils';

const where = 'model.product';

export class Product implements IProduct {
  _id?: ObjectId;
  images: string[];
  name: string;
  description?: string;
  categoryId: ObjectId;
  defaultPrice: number;
  unitName: EUnit;
  suppliers?: ISupplierInfo[];
  slug?: string;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: IProduct) {
    this._id = data._id;
    this.images = data.images;
    this.name = data.name;
    this.description = data.description;
    this.categoryId = data.categoryId;
    this.defaultPrice = data.defaultPrice || 0;
    this.unitName = data.unitName;
    this.suppliers = data.suppliers ?? [];
    this.slug = data.slug;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  static async sequelize(data: any) {
    const schema = yup.object().shape({
      images: yup.array().of(yup.string().required()).required(),
      name: yup.string().required(),
      description: yup.string(),
      categoryId: yup.string().objectId().required(),
      defaultPrice: yup.number().required().default(0),
      unitName: yup.string().oneOf(Object.values(EUnit)).required(),
      suppliers: yup.array().of(
        yup.object().shape({
          supplierId: yup.string().objectId().required(),
          price: yup.number().required()?.default(0),
          quantity: yup.number().required()?.default(0),
        }),
      ),
      slug: yup.string(),
    });

    const [errors, result] = await to(validateWithYup(schema, data));

    if (errors || !result) {
      throw invalidInformation(`${where}.validate`, 'Thông tin không hợp lệ', errors);
    }

    return new Product({
      ...result,
      categoryId: new ObjectId(result.categoryId),
      suppliers: result?.suppliers?.map(
        (supplier: { supplierId: string; price: number; quantity: number }) => ({
          ...supplier,
          supplierId: new ObjectId(supplier.supplierId),
        }),
      ),
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
