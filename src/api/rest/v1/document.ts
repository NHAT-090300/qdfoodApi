import { API } from 'api';
import * as handlers from 'api/handlers/document';
import { authentication } from '@api/middleware';
import { ERole } from 'interface';

export function initDocument(api: API) {
  api.baseRoutes.document.get('/web-user', api.handler(handlers.getPagination));
  api.baseRoutes.document.get('/:id', api.handler(handlers.getDetail));
  api.baseRoutes.document.get('/list', api.handler(handlers.getAll));
  api.baseRoutes.document.get(
    '/',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.getPagination),
  );
  api.baseRoutes.document.post(
    '/create',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.createDocument),
  );
  api.baseRoutes.document.put(
    '/:id',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.updateDocument),
  );
  api.baseRoutes.document.delete(
    '/:id',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.deleteDocument),
  );
}
