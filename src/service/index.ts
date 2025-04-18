import { IConfig } from 'interface';
import { CloudinaryService } from './cloudinary';
import { DirectusService } from './directus';

export class Services {
  cloudinary: CloudinaryService;
  directus: DirectusService;

  constructor(config: IConfig) {
    this.cloudinary = new CloudinaryService(config.cloudinary);
    this.directus = new DirectusService(config.directus);
  }
}
