import { IErrors } from 'interface';
import { ObjectId } from 'mongodb';
import fs from 'fs';
import { logger } from 'logger';

export function generateRandomNumber() {
  return Math.floor(100000 + Math.random() * 999999);
}

export const replaceTrimString = (string: string) => {
  const newString = string.replace(/\s+/g, ' ').trim();
  return newString;
};

export function formatSecondsToDate(seconds?: number) {
  if (!seconds) return null;
  return new Date(new Date(1970, 0, 1).setSeconds(seconds));
}

export function isValueInEnum<E extends string>(
  strEnum: Record<string, E>,
  value: string,
): boolean {
  const enumValues = Object.values(strEnum) as string[];

  return enumValues.includes(value);
}

export const formatErrorYup = (errorYup: any) => {
  const errors: IErrors = {};

  errorYup.inner.forEach((error: any) => {
    if (error.path !== undefined) {
      errors[error.path] = error.errors.map((message: string) => ({
        id: message,
        message,
      }));
    }
  });

  return errors;
};

export function delayFunction(delayTime: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, delayTime);
  });
}

export async function retryFunction<T>(
  callback: () => any,
  maxRetries: number = 3,
  sleepTime: number = 0,
): Promise<T> {
  try {
    return callback();
  } catch (error) {
    if (maxRetries <= 0) {
      throw error;
    }

    if (sleepTime > 0) {
      await delayFunction(sleepTime);
    }

    return retryFunction(callback, maxRetries - 1, sleepTime);
  }
}

export const transformToObjectId = (id: any) => {
  if (id && ObjectId.isValid(id)) {
    return new ObjectId(id);
  }
};

export function calculateMinMaxPrice(
  items: { sellingPrice: number; discountedPrice: number; discountPercentage: number }[],
) {
  if (!items || items.length === 0)
    return { sellingPrice: 0, discountedPrice: 0, discountPercentage: 0 };

  const minPrice = items.reduce((prev, curr) => {
    if (curr.sellingPrice < prev.sellingPrice) {
      return curr;
    }
    if (curr.sellingPrice === prev.sellingPrice && curr.discountedPrice < prev.discountedPrice) {
      return curr;
    }
    return prev;
  });

  return minPrice;
}

export function tryParseJson(str: any) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return {};
  }
}

export const removeFileLocal = (path: string) => {
  try {
    if (fs.existsSync(path)) fs.unlinkSync(path);
  } catch (error) {
    logger.error('delete file error', { error, path });
  }
};

export function isValidFileExtension(fileName: string) {
  const validExtensions = [
    // Hình ảnh
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.bmp',
    '.svg',
    '.webp',
    '.tiff',
    '.ico',
    // Tài liệu
    '.pdf',
    '.doc',
    '.docx',
    '.xls',
    '.xlsx',
    '.ppt',
    '.pptx',
    '.txt',
    '.csv',
    '.rtf',
    // Âm thanh
    '.mp3',
    '.wav',
    '.aac',
    '.flac',
    '.ogg',
    '.m4a',
    '.wma',
    // Video
    '.mp4',
    '.mkv',
    '.avi',
    '.mov',
    '.wmv',
    '.flv',
    '.webm',
    '.3gp',
    // Lưu trữ
    '.zip',
    '.rar',
    '.7z',
    '.tar',
    '.gz',
    '.iso',
    // Code/Script
    '.html',
    '.css',
    '.js',
    '.ts',
    '.json',
    '.xml',
    '.yml',
    '.sql',
    '.md',
    '.sh',
    '.bat',
    '.py',
    '.java',
    '.cpp',
    '.cs',
    '.php',
    // Font
    '.ttf',
    '.otf',
    '.woff',
    '.woff2',
    // Khác
    '.exe',
    '.dll',
    '.apk',
    '.bin',
    '.dat',
    '.db',
  ];

  const fileExtension = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
  return validExtensions.includes(fileExtension);
}
