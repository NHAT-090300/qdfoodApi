import { API } from 'api';
import * as handlers from 'api/handlers/productLog';
import { authentication, authorization } from '@api/middleware';
import { EPermission, ERole } from 'interface';

export function initProductLog(api: API) {
  api.baseRoutes.productLog.get(
    '/exports',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
      }),
    ),
    api.handler(handlers.exportProductLogToExcel),
  );
  api.baseRoutes.productLog.get(
    '/',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
      }),
    ),
    api.handler(handlers.getPagination),
  );
  api.baseRoutes.productLog.post(
    '/',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
        permissions: [EPermission.WRITE_MATERIAL_HISTORY],
      }),
    ),
    api.handler(handlers.create),
  );
  api.baseRoutes.productLog.get(
    '/:id',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
      }),
    ),
    api.handler(handlers.getDetail),
  );
}
