import to from 'await-to-js';
import { ObjectId } from 'mongodb';
import * as yup from 'yup';

import { ETypeOtp, IOtp } from 'interface';
import { invalidInformation, validateWithYup } from 'utils';

const where = 'model.otp';

export class Otp implements IOtp {
  _id?: ObjectId;
  otp?: string;
  email?: string;
  password?: string;
  type?: ETypeOtp;
  isVerified?: boolean;
  otpExpiresAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: IOtp) {
    this._id = data._id;
    this.otp = data.otp;
    this.email = data.email || '';
    this.password = data.password || '';
    this.type = data.type || ETypeOtp.EMAIL;
    this.isVerified = data.isVerified || false;
    this.otpExpiresAt = data.otpExpiresAt;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  static async sequelize(data: any) {
    const schema = yup.object().shape({
      email: yup.string().required('Email is required'),
      password: yup.string(),
      type: yup.string().oneOf(Object.values(ETypeOtp)).default(ETypeOtp.EMAIL),
      otpExpiresAt: yup.date().default(() => new Date(Date.now() + 15 * 60 * 1000)),
      isVerified: yup.boolean().default(false),
      isDelete: yup.boolean().default(false),
      otp: yup.string().required(),
    });

    const [errors, result] = await to(validateWithYup(schema, data));

    if (errors || !result) {
      throw invalidInformation(`${where}.validate`, 'Thông tin không hợp lệ', errors);
    }

    return new Otp(result);
  }

  static async validateUpdate(data: any) {
    const schema = yup.object().shape({
      isVerified: yup.boolean().default(false),
      otp: yup.string().required(),
      otpExpiresAt: yup.string(),
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
  }
}
