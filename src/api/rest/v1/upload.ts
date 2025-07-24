import { API } from 'api';
import {
  authentication,
  multerUploadFile,
  multerUploadImage,
  multerUploadVideo,
} from 'api/middleware';
import * as handlers from 'api/handlers/upload';
import { ERole } from 'interface';

export function initUpload(api: API) {
  // upload image
  api.baseRoutes.upload.post(
    '/image',
    multerUploadImage.single('image'),
    // api.handler(authentication(ERole.USER)),
    api.handler(handlers.uploadFile),
  );

  api.baseRoutes.upload.post(
    '/video',
    multerUploadVideo.single('video'),
    // api.handler(authentication(ERole.USER)),
    api.handler(handlers.uploadFile),
  );

  // upload file
  api.baseRoutes.upload.post(
    '/file',
    multerUploadFile.single('file'),
    api.handler(authentication(ERole.USER)),
    api.handler(handlers.uploadFile),
  );
  api.baseRoutes.upload.post('/import', api.handler(handlers.importFile));
  api.baseRoutes.upload.patch(
    '/files/:fileId',
    multerUploadFile.single('file'),
    api.handler(authentication(ERole.USER)),
    api.handler(handlers.patchFile),
  );
  api.baseRoutes.upload.post(
    '/remove_file',
    api.handler(authentication(ERole.USER)),
    api.handler(handlers.removeFile),
  );
}
