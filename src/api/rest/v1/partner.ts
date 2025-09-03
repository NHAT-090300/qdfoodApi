import { API } from 'api';
import * as handlers from 'api/handlers/partner';
import { authentication, authorization } from '@api/middleware';
import { EPermission, ERole } from 'interface';

export function initPartner(api: API) {
  api.baseRoutes.partner.get('/list/web-user', api.handler(handlers.getAll));
  api.baseRoutes.partner.get(
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
  api.baseRoutes.partner.get(
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
  api.baseRoutes.partner.get(
    '/:id',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
        permissions: [EPermission.VIEW_GENERAL_INFO, EPermission.WRITE_GENERAL_INFO],
        mode: 'ANY',
      }),
    ),
    api.handler(handlers.getDetail),
  );
  api.baseRoutes.partner.post(
    '/create',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
        permissions: [EPermission.WRITE_GENERAL_INFO],
      }),
    ),
    api.handler(handlers.createPartner),
  );
  api.baseRoutes.partner.put(
    '/:id',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
        permissions: [EPermission.WRITE_GENERAL_INFO],
      }),
    ),
    api.handler(handlers.updatePartner),
  );
  api.baseRoutes.partner.delete(
    '/delete/:id',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
        permissions: [EPermission.WRITE_GENERAL_INFO],
      }),
    ),
    api.handler(handlers.deletePartner),
  );
}
