import { IConfig } from 'interface';
import { CloudinaryService } from './cloudinary';
import { DirectusService } from './directus';
import { MailerService } from './nodemailer';

export class Services {
  cloudinary: CloudinaryService;
  directus: DirectusService;
  mailer: MailerService;

  constructor(config: IConfig) {
    this.cloudinary = new CloudinaryService(config.cloudinary);
    this.directus = new DirectusService(config.directus);
    this.mailer = new MailerService();
  }
}
