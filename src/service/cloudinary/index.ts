import cloudinary from 'cloudinary';
import multer from 'multer';
// eslint-disable-next-line import/no-extraneous-dependencies
import { extractPublicId } from 'cloudinary-build-url';

import { ICloundinary } from 'interface';
import { isString } from 'lodash';
import createStorage from './cloudinary-storage';

export class CloudinaryService {
  private config: ICloundinary;
  private cloudinary = cloudinary.v2;

  constructor(config: ICloundinary) {
    this.config = config;
    this.cloudinary.config({
      cloud_name: config.cloudStorageName,
      api_key: config.cloudStorageApiKey,
      api_secret: config.cloudStorageApiSecret,
    });
  }

  getStorage() {
    const storage = createStorage({
      cloudinary: this.cloudinary,
      params: {
        folder: (request) => {
          const folderName = isString(request.query.folderName) ? request.query.folderName : '';
          return folderName.replaceAll('-', '/') || 'MALL';
        },
      },
    });

    return multer({ storage });
  }

  async delete(publicId: string) {
    await this.cloudinary.uploader.destroy(publicId);
  }

  async deleteByPaths(paths: string[]) {
    const promises = paths.map((path) => this.cloudinary.uploader.destroy(extractPublicId(path)));
    await Promise.allSettled(promises);
  }
}
