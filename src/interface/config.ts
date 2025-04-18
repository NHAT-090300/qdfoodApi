export interface IServiceSettings {
  serviceName: string;
  httpPort: number;
  apiPrefix: string;
  shouldSeedDb: boolean;
}

export interface IMongoSettings {
  mongoUri: string;
  mongoDatabase: string;
  mongoUsername: string;
  mongoPassword: string;
}

export interface ILoggerSettings {
  serviceName: string;
  maxSize: string;
  maxRotate: number | string;
  dirpath: string;
  level: string;
  transport: 'file' | 'all';
}

export interface IHttpSettings {
  identityService: string;
  notificationService: string;
}

export interface ICloundinary {
  storageFolderPath: string;
  cloudStorageName: string;
  cloudStorageApiKey: string;
  cloudStorageApiSecret: string;
}

export interface IJwtSettings {
  jwtSecret: string;
}

export interface IDirectusSettings {
  folderCode: string;
  directusHost: string;
  staticToken: string;
}

export interface IConfig {
  serviceSettings: IServiceSettings;
  mongoSettings: IMongoSettings;
  loggerSettings: ILoggerSettings;
  httpSettings?: IHttpSettings;
  cloudinary: ICloundinary;
  jwtSettings: IJwtSettings;
  directus: IDirectusSettings;
}
