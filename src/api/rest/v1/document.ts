import { API } from 'api';
import * as handlers from 'api/handlers/document';
import { EPermission, ERole } from 'interface';

import { authentication, authorization } from '@api/middleware';

export function initDocument(api: API) {
  api.baseRoutes.document.get('/web-user', api.handler(handlers.getPagination));
  api.baseRoutes.document.get('/list', api.handler(handlers.getAll));
  api.baseRoutes.document.get('/:id', api.handler(handlers.getDetail));
  api.baseRoutes.document.get(
    '/',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
        permissions: [EPermission.VIEW_GENERAL_INFO, EPermission.WRITE_GENERAL_INFO],
        mode: 'ANY',
      }),
    ),
    api.handler(handlers.getPagination),
  );
  api.baseRoutes.document.post(
    '/create',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
        permissions: [EPermission.VIEW_GENERAL_INFO, EPermission.WRITE_GENERAL_INFO],
        mode: 'ANY',
      }),
    ),
    api.handler(handlers.createDocument),
  );
  api.baseRoutes.document.put(
    '/:id',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
        permissions: [EPermission.WRITE_GENERAL_INFO],
      }),
    ),
    api.handler(handlers.updateDocument),
  );
  api.baseRoutes.document.delete(
    '/:id',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
        permissions: [EPermission.WRITE_GENERAL_INFO],
      }),
    ),
    api.handler(handlers.deleteDocument),
  );
}
