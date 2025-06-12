import to from 'await-to-js';
import { ObjectId } from 'mongodb';
import * as yup from 'yup';

import { IOrder, EOrderStatus } from 'interface';

import { invalidInformation, validateWithYup } from 'utils';

const where = 'model.order';

export class Order implements IOrder {
  _id?: ObjectId;
  userId: ObjectId;
  status: EOrderStatus;
  total: number;
  shippingAddress: {
    address: string;
    city: string;
    district: string;
    ward: string;
  };
  items: {
    productId: ObjectId;
    quantity: number;
    unitPrice: string;
    price: number;
    damagedQuantity?: number;
    refundAmount?: number;
  }[];
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: IOrder) {
    this._id = data._id;
    this.userId = data.userId;
    this.status = data.status;
    this.total = data.total || 0;
    this.shippingAddress = data.shippingAddress;
    this.items = data.items;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  static async sequelize(data: any) {
    const schema = yup.object().shape({
      userId: yup.string().objectId().required(),
      status: yup.string().oneOf(Object.values(EOrderStatus)).required(),
      total: yup.number().required().default(0),
      shippingAddress: yup
        .object()
        .shape({
          address: yup.string().required(),
          city: yup.string().required(),
          district: yup.string().required(),
          ward: yup.string().required(),
        })
        .required(),
      items: yup
        .array()
        .of(
          yup.object().shape({
            productId: yup.string().objectId().required(),
            quantity: yup.number().required().default(0),
            unitPrice: yup.string().required(),
            price: yup.number().required().default(0),
            damagedQuantity: yup.number().default(0),
            refundAmount: yup.number().default(0),
          }),
        )
        .required(),
    });
    const [errors, result] = await to(validateWithYup(schema, data));

    if (errors || !result) {
      throw invalidInformation(`${where}.validate`, 'Thông tin không hợp lệ', errors);
    }

    return new Order({
      ...result,
      userId: new ObjectId(result.userId),
      items: result?.items?.map(
        (item: {
          productId: string;
          quantity: number;
          unitPrice: string;
          price: number;
          damagedQuantity: number;
          refundAmount: number;
        }) => ({
          ...item,
          productId: new ObjectId(item.productId),
        }),
      ),
    });
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
