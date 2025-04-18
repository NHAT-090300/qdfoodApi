import { v2 as Cloudinary, UploadApiOptions, UploadApiResponse } from 'cloudinary';
import type { Request } from 'express';
import type { StorageEngine } from 'multer';

type File = Express.Multer.File;

type WithDynamicValue<T> = {
  [K in keyof T]: T[K] | ((req: Request, file: File) => T[K]);
};

export type StorageOptions =
  | ((req: Request, file: File) => Promise<UploadApiOptions>)
  | ((req: Request, file: File) => UploadApiOptions)
  | WithDynamicValue<UploadApiOptions>;

interface Options {
  cloudinary: typeof Cloudinary;
  params?: StorageOptions;
}

class CloudinaryStorage implements StorageEngine {
  private cloudinary: typeof Cloudinary;
  private params: StorageOptions;

  constructor(data: Options) {
    if (!data || !data.cloudinary) {
      throw new Error('cloudinary option required');
    }

    this.cloudinary = data.cloudinary;
    this.params = data.params || {};
  }

  async _handleFile(
    req: Request,
    file: File,
    callback: (error?: any, info?: Partial<File>) => void,
  ): Promise<void> {
    try {
      let uploadOptions: UploadApiOptions = {};

      if (typeof this.params === 'function') {
        uploadOptions = await this.params(req, file);
      } else {
        for (const paramKey in this.params) {
          if (Object.prototype.hasOwnProperty.call(this.params, paramKey)) {
            const key = paramKey as keyof typeof this.params;
            const element = this.params[key];
            const value = typeof element === 'function' ? await element(req, file) : element;
            uploadOptions[key] = value;
          }
        }
      }

      const resp = await this.upload(uploadOptions, file);

      callback(undefined, {
        path: resp.secure_url,
        size: resp.bytes,
        filename: resp.public_id,
      });
    } catch (err) {
      callback(err);
    }
  }

  _removeFile(req: Request, file: File, callback: (error: Error) => void): void {
    this.cloudinary.uploader.destroy(file.filename, { invalidate: true }, callback);
  }

  private upload(options: UploadApiOptions, file: File): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const stream = this.cloudinary.uploader.upload_stream(options, (error, response) => {
        if (error) return reject(error);
        if (!response) return reject(new Error('upload no response'));

        return resolve(response);
      });

      file.stream.pipe(stream);
    });
  }
}

function createStorage(options: Options): CloudinaryStorage {
  return new CloudinaryStorage(options);
}

export default createStorage;
