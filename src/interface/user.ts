import { ObjectId } from 'mongodb';
import { ERole, ESortOrder, EPermission } from './enum';

export interface IUser {
  _id?: ObjectId;
  avatar?: string;
  name?: string;
  email: string;
  password: string;
  phoneNumber?: string;
  address?: {
    city?: string;
    ward?: string;
    street?: string;
  };
  permission?: EPermission[];
  role?: ERole;
  isDelete?: boolean;
  otp?: string;
  otpExpiresAt?: Date;
  isVerified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export interface ISocial {
  icon: string;
  link: string;
  name: string;
}

export interface IUserFilter {
  keyword?: string;
  role?: ERole;
  isDelete?: object;
  page?: number;
  limit?: number;
  sort?: string;
  order?: ESortOrder;
}

export type TUserUpdate = Pick<
  IUser,
  'name' | 'email' | 'phoneNumber' | 'avatar' | 'address' | 'otp' | 'otpExpiresAt' | 'isVerified'
>;
