import { API } from 'api';
import * as handlers from 'api/handlers/client';
import { authentication, authorization } from '@api/middleware';
import { EPermission, ERole } from 'interface';

export function initClient(api: API) {
  api.baseRoutes.client.get('/list/web-user', api.handler(handlers.getAll));
  api.baseRoutes.client.get(
    '/list',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
        permissions: [EPermission.VIEW_GENERAL_INFO, EPermission.WRITE_GENERAL_INFO],
        mode: 'ANY',
      }),
    ),
    api.handler(handlers.getAll),
  );
  api.baseRoutes.client.get(
    '/',
    api.handler(authentication()),
    authorization({
      role: ERole.ADMIN,
      permissions: [EPermission.VIEW_GENERAL_INFO, EPermission.WRITE_GENERAL_INFO],
      mode: 'ANY',
    }),
    api.handler(handlers.getPagination),
  );
  api.baseRoutes.client.get(
    '/:id',
    api.handler(authentication()),
    authorization({
      role: ERole.ADMIN,
      permissions: [EPermission.VIEW_GENERAL_INFO, EPermission.WRITE_GENERAL_INFO],
      mode: 'ANY',
    }),
    api.handler(handlers.getDetail),
  );
  api.baseRoutes.client.post(
    '/create',
    api.handler(authentication()),
    authorization({
      role: ERole.ADMIN,
      permissions: [EPermission.WRITE_GENERAL_INFO],
    }),
    api.handler(handlers.createClient),
  );
  api.baseRoutes.client.put(
    '/:id',
    api.handler(authentication()),
    authorization({
      role: ERole.ADMIN,
      permissions: [EPermission.WRITE_GENERAL_INFO],
    }),
    api.handler(handlers.updateClient),
  );
  api.baseRoutes.client.delete(
    '/delete/:id',
    api.handler(authentication()),
    authorization({
      role: ERole.ADMIN,
      permissions: [EPermission.WRITE_GENERAL_INFO],
    }),
    api.handler(handlers.deleteClient),
  );
}
