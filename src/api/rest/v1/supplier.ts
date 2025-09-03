import { API } from 'api';
import * as handlers from 'api/handlers/supplier';
import { authentication, authorization } from '@api/middleware';
import { EPermission, ERole } from 'interface';

export function initSupplier(api: API) {
  api.baseRoutes.supplier.get('/list', api.handler(authentication()), api.handler(handlers.getAll));
  api.baseRoutes.supplier.get(
    '/',
    api.handler(authentication()),
    api.handler(handlers.getPagination),
  );
  api.baseRoutes.supplier.get(
    '/:id',
    api.handler(authentication()),
    api.handler(handlers.getDetail),
  );
  api.baseRoutes.supplier.post(
    '/create',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
        permissions: [EPermission.WRITE_USER],
      }),
    ),
    api.handler(handlers.createSupplier),
  );
  api.baseRoutes.supplier.put(
    '/:id',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
        permissions: [EPermission.WRITE_USER],
      }),
    ),
    api.handler(handlers.updateSupplier),
  );
  api.baseRoutes.supplier.delete(
    '/delete/:id',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
        permissions: [EPermission.WRITE_USER],
      }),
    ),
    api.handler(handlers.deleteSupplier),
  );
}
