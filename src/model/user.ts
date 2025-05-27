import to from 'await-to-js';
import { ObjectId } from 'mongodb';
import * as yup from 'yup';

import { IUser, ERole } from 'interface';
import { invalidInformation, validateWithYup } from 'utils';

const where = 'model.user';

export class User implements IUser {
  _id?: ObjectId;
  avatar?: string;
  name?: string;
  email: string;
  phoneNumber: string;
  password: string;
  address?: {
    city?: string;
    district?: string;
    ward?: string;
    street?: string;
  };
  role?: ERole;
  isDelete: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;

  constructor(data: IUser) {
    this._id = data._id;
    this.avatar = data.avatar || '';
    this.name = data.name;
    this.email = data.email;
    this.password = data.password;
    this.phoneNumber = data.phoneNumber || '';
    this.address = data.address;
    this.role = data.role || ERole?.USER;
    this.isDelete = data.isDelete || false;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.deletedAt = data.deletedAt;
  }

  static async sequelize(data: any) {
    const schema = yup.object().shape({
      avatar: yup.string(),
      name: yup.string(),
      email: yup.string().required('Email is required'),
      password: yup.string().required('Password is required'),
      phoneNumber: yup.string().default(''),
      address: yup.object().shape({
        street: yup.string(),
        ward: yup.string(),
        district: yup.string(),
        city: yup.string(),
      }),
    });

    const [errors, result] = await to(validateWithYup(schema, data));

    if (errors || !result) {
      throw invalidInformation(`${where}.validate`, 'Thông tin không hợp lệ', errors);
    }

    return new User(result);
  }

  static async validateUpdate(data: any) {
    const schema = yup.object().shape({
      name: yup.string().required('Name is required'),
      email: yup.string().email('Email is invalid').required('Email is required'),
      avatar: yup.string().required('Avatar is required'),
      role: yup.string().oneOf(Object.values(ERole), 'Role invalid'),
      phoneNumber: yup.string(),
      address: yup.object().shape({
        street: yup.string(),
        ward: yup.string(),
        district: yup.string(),
        city: yup.string(),
      }),
    });

    const [errors, result] = await to(validateWithYup(schema, data));

    if (errors || !result) {
      throw invalidInformation(`${where}.validate`, 'Thông tin không hợp lệ', errors);
    }

    return result;
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

  preDelete() {
    delete this._id;
    delete this.createdAt;
    this.deletedAt = new Date();
  }
}
