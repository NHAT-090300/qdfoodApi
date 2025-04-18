import { API } from 'api';
import * as handlers from 'api/handlers/supplier';
import { authentication } from '@api/middleware';
import { ERole } from 'interface';

export function initSupplier(api: API) {
  api.baseRoutes.supplier.get(
    '/list',
    api.handler(authentication(ERole.USER)),
    api.handler(handlers.getAll),
  );
  api.baseRoutes.supplier.get(
    '/',
    api.handler(authentication(ERole.USER)),
    api.handler(handlers.getPagination),
  );
  api.baseRoutes.supplier.get(
    '/:id',
    api.handler(authentication(ERole.USER)),
    api.handler(handlers.getDetail),
  );
  api.baseRoutes.supplier.post(
    '/create',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.createSupplier),
  );
  api.baseRoutes.supplier.put(
    '/:id',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.updateSupplier),
  );
  api.baseRoutes.supplier.delete(
    '/delete/:id',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.deleteSupplier),
  );
}
