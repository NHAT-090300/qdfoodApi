import { ObjectId } from 'mongodb';

export interface IOtp {
  _id?: ObjectId;
  otp?: string;
  type?: ETypeOtp;
  email?: string;
  password?: string;
  otpExpiresAt?: Date;
  isVerified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export enum ETypeOtp {
  EMAIL = 'email',
  PHONE = 'phone',
}
