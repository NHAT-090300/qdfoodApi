import { IConfig } from 'interface';
import { CloudinaryService } from './cloudinary';
import { DirectusService } from './directus';
import { S3Service } from './s3';

export class Services {
  cloudinary: CloudinaryService;
  directus: DirectusService;
  s3: S3Service;

  constructor(config: IConfig) {
    this.cloudinary = new CloudinaryService(config.cloudinary);
    this.directus = new DirectusService(config.directus);
    this.s3 = new S3Service(config.s3);
  }
}
