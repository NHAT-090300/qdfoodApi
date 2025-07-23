import { IConfig } from 'interface';
import { CloudinaryService } from './cloudinary';
import { DirectusService } from './directus';
import { S3Service } from './s3';
import { MailerService } from './nodemailer';

export class Services {
  cloudinary: CloudinaryService;
  directus: DirectusService;
  mailer: MailerService;
  s3: S3Service;

  constructor(config: IConfig) {
    this.cloudinary = new CloudinaryService(config.cloudinary);
    this.directus = new DirectusService(config.directus);
    this.mailer = new MailerService();
    this.s3 = new S3Service(config.s3);
  }
}
