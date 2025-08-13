import {
  EInventoryTransactionType,
  EOrderStatus,
  IErrors,
  IOrderShippingAddress,
  IProductLog,
  IProductLogItem,
} from 'interface';
import { ObjectId } from 'mongodb';
import fs from 'fs';
import { logger } from 'logger';
import districts from 'shared/constants/districts.json';
import provinces from 'shared/constants/provinces.json';
import wards from 'shared/constants/wards.json';
import { isNaN } from 'lodash';

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

export const formatCurrency = (amount: unknown) => {
  const value = Number(amount);
  if (isNaN(value)) return '0 VND';
  return `${value.toLocaleString('vi-VN')} VND`;
};

export function getOrderAddress(info: IOrderShippingAddress): string {
  const list: string[] = [];

  if (info?.address) list.push(info.address);

  const province = provinces?.find((item) => item.code === info.city)?.name_with_type;
  const district = districts?.find((item) => item.code === info.district)?.name_with_type;
  const ward = wards?.find((item) => item.code === info.ward)?.name_with_type;

  if (ward) list.push(ward);
  if (district) list.push(district);
  if (province) list.push(province);

  return list.join(', ');
}

export const OrderStatus = [
  {
    key: EOrderStatus.PENDING,
    color: '#FF8800',
    label: 'Chờ xác nhận',
    hasReason: false,
    hasShippingCode: false,
  },
  {
    key: EOrderStatus.CONFIRM,
    color: '#320A6B',
    label: 'Xác nhận',
    hasReason: false,
    hasShippingCode: false,
  },
  {
    key: EOrderStatus.SHIPPING,
    color: '#7B61FF',
    label: 'Đang giao',
    hasReason: false,
    hasShippingCode: true,
  },
  {
    key: EOrderStatus.COMPLETED,
    color: '#38C976',
    label: 'Đã giao',
    hasReason: false,
    hasShippingCode: false,
  },
  {
    key: EOrderStatus.CANCELED,
    color: '#FF4241',
    label: 'Đơn huỷ',
    hasReason: true,
    hasShippingCode: false,
  },
];

export const findOrderWithStatus = (status: EOrderStatus) => {
  return OrderStatus.find((o) => o.key === status);
};

export const getTransactionTypeTag = (type: EInventoryTransactionType) => {
  const typeMap: Record<EInventoryTransactionType, { color: string; text: string }> = {
    [EInventoryTransactionType.IMPORT]: {
      color: 'cyan',
      text: 'Nhập kho',
    },
    [EInventoryTransactionType.EXPORT]: {
      color: 'geekblue',
      text: 'Xuất kho',
    },
    [EInventoryTransactionType.RETURN_DAMAGED]: {
      color: 'volcano',
      text: 'Hoàn trả',
    },
    [EInventoryTransactionType.PRODUC_EXPORT]: {
      color: 'blue',
      text: 'Xuất nguyên liệu',
    },
    [EInventoryTransactionType.PRODUC_IMPORT]: {
      color: 'green',
      text: 'Nhập thành phẩm',
    },
  };

  return typeMap[type] || { color: 'default', text: 'Không xác định' };
};

export function createUnsignedRegex(str: string): RegExp {
  const map: Record<string, string> = {
    a: '[aáàảạãăắằẳặẵâấầẩậẫ]',
    d: '[dđ]',
    e: '[eéèẻẹẽêếềểệễ]',
    i: '[iíìỉịĩ]',
    o: '[oóòỏọõôốòòỏọõôốồổộỗơớờởợỡ]',
    u: '[uúùủụũưứừửựữ]',
    y: '[yýỳỷỵỹ]',
  };

  let regexStr = '';
  for (const char of str.toLowerCase()) {
    // Dùng một câu lệnh `switch` để xử lý các trường hợp cụ thể
    // Nếu không có ký tự có dấu, nó sẽ tự động rơi vào `default`
    switch (char) {
      case 'a':
      case 'á':
      case 'à':
      case 'ả':
      case 'ạ':
      case 'ã':
      case 'ă':
      case 'ắ':
      case 'ằ':
      case 'ẳ':
      case 'ặ':
      case 'ẵ':
      case 'â':
      case 'ấ':
      case 'ầ':
      case 'ẩ':
      case 'ậ':
      case 'ẫ':
        regexStr += map.a;
        break;
      case 'd':
      case 'đ':
        regexStr += map.d;
        break;
      case 'e':
      case 'é':
      case 'è':
      case 'ẻ':
      case 'ẹ':
      case 'ẽ':
      case 'ê':
      case 'ế':
      case 'ề':
      case 'ể':
      case 'ệ':
      case 'ễ':
        regexStr += map.e;
        break;
      case 'i':
      case 'í':
      case 'ì':
      case 'ỉ':
      case 'ị':
      case 'ĩ':
        regexStr += map.i;
        break;
      case 'o':
      case 'ó':
      case 'ò':
      case 'ỏ':
      case 'ọ':
      case 'õ':
      case 'ô':
      case 'ố':
      case 'ồ':
      case 'ổ':
      case 'ộ':
      case 'ỗ':
      case 'ơ':
      case 'ớ':
      case 'ờ':
      case 'ở':
      case 'ợ':
      case 'ỡ':
        regexStr += map.o;
        break;
      case 'u':
      case 'ú':
      case 'ù':
      case 'ủ':
      case 'ụ':
      case 'ũ':
      case 'ư':
      case 'ứ':
      case 'ừ':
      case 'ử':
      case 'ự':
      case 'ữ':
        regexStr += map.u;
        break;
      case 'y':
      case 'ý':
      case 'ỳ':
      case 'ỷ':
      case 'ỵ':
      case 'ỹ':
        regexStr += map.y;
        break;
      default:
        regexStr += char;
    }
  }

  return new RegExp(regexStr, 'i');
}

export function mergeProductLogItems(items: IProductLogItem[]): IProductLogItem[] {
  return Object.values(
    items?.reduce((acc: any, item: any) => {
      if (!acc[item.productId]) {
        acc[item.productId] = { ...item }; // tạo bản sao để tránh mutate
      } else {
        acc[item.productId].quantity += item.quantity;
      }
      return acc;
    }, {}),
  );
}
