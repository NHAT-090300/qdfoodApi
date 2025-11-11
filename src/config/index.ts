import dotenv from 'dotenv';
import { IConfig } from 'interface/config';

dotenv.config();

export const config: IConfig = {
  serviceSettings: {
    serviceName: process.env.SERVICE_NAME || 'qdfood',
    httpPort: parseInt(process.env.HTTP_PORT || '8000', 10),
    apiPrefix: process.env.API_PREFIX || '/qdfood/api',
    shouldSeedDb: process.env.SEED_DB === 'true',
  },
  mongoSettings: {
    mongoUri: process.env.MONGO_HOST || '',
    mongoDatabase: process.env.MONGO_DATABASE || '',
    mongoUsername: process.env.MONGO_USERNAME || '',
    mongoPassword: process.env.MONGO_PASSWORD || '',
  },
  loggerSettings: {
    serviceName: process.env.SERVICE_NAME || 'qdfood',
    maxSize: process.env.LOG_SIZE || '25m',
    maxRotate: Number(process.env.LOG_ROTATE) || '30d',
    level: process.env.LOG_LEVEL || 'info',
    dirpath: process.env.LOG_FOLDER || './logs',
    transport: process.env.LOG_TRANSPORT === 'all' ? 'all' : 'file',
  },
  cloudinary: {
    storageFolderPath: process.env.STORAGE_FOLDER_PATH || './uploads',
    cloudStorageName: process.env.CLOUD_STORAGE_NAME || '',
    cloudStorageApiKey: process.env.CLOUD_STORAGE_API_KEY || '',
    cloudStorageApiSecret: process.env.CLOUD_STORAGE_API_SECRET || '',
  },
  directus: {
    directusHost: process.env.DIRECTUS_HOST || '',
    staticToken: process.env.DIRECTUS_TOKEN || '',
    folderCode: process.env.DIRECTUS_FOLDER || '',
  },
  s3: {
    bucket: process.env.S3_BUCKET || '',
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    region: process.env.S3_REGION || '',
    folderCode: process.env.S3_FOLDER_CODE || '',
  },
  jwtSettings: {
    jwtSecret: process.env.JWT_SECRETS || '',
  },
  nodemailer: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '465', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    emailUser: process.env.EMAIL_USER || 'nhatnguyen.090300@gmail.com',
    emailPass: process.env.EMAIL_PASS || 'lpkjbsjfrkbyqfki',
  },
};
