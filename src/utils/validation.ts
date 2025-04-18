import { StatusCodes } from 'http-status-codes';
import _, { isNumber } from 'lodash';
import { ObjectId } from 'mongodb';

import { AppError } from 'model';
import { AnyObject, ObjectSchema } from 'yup';
import { formatErrorYup } from './function';

export function invalidInformation(id: string, detail: string, errors?: any) {
  return new AppError({
    id,
    message: 'Thông tin không hợp lệ',
    statusCode: StatusCodes.BAD_REQUEST,
    detail,
    errors,
  });
}

export const validateEmail = (email: string) => {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email);
};

export const validatePhone = (phone: string) => {
  const regex = /^\d{10}$/;
  return regex.test(phone);
};

export const isFloatNumberString = (str: string) => {
  const floatRegex = /[-+]?[0-9]+\.[0-9]+$/;
  if (_.isString(str) && str.match(floatRegex)) {
    return true;
  }
  return false;
};

export const isStringEnum = (object: any, value: string) => {
  if (!Object.values(object).includes(value)) {
    return false;
  }

  return true;
};

export function isValidId(id: string | undefined): boolean {
  if (!id) return false;

  if (!ObjectId.isValid(id)) return false;

  return true;
}

export function isValidIds(ids: string[]): boolean {
  if (!ids.length || !Array.isArray(ids)) return false;

  for (const id of ids) {
    if (!ObjectId.isValid(id)) return false;
  }

  return true;
}

export function validatePagination(page: any, limit: any) {
  if (!isNumber(limit) || limit < 1) {
    throw new AppError({
      id: 'validate.pagination',
      message: 'limit không phải number và limit nhỏ hơn 0',
      statusCode: StatusCodes.BAD_REQUEST,
    });
  }

  if (!isNumber(page) || page < 1) {
    throw new AppError({
      id: 'validate.pagination',
      message: 'page không phải number và page nhỏ hơn 0',
      statusCode: StatusCodes.BAD_REQUEST,
    });
  }
}

export const validateWithYup = async <T extends AnyObject>(schema: ObjectSchema<T>, data: any) => {
  try {
    return await schema.validate(data, { stripUnknown: true, abortEarly: false });
  } catch (errorYup: any) {
    throw formatErrorYup(errorYup);
  }
};
