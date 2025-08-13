import { API } from 'api';
import * as handlers from 'api/handlers/inventory';
import { authentication } from '@api/middleware';
import { ERole } from 'interface';

export function initInventory(api: API) {
  api.baseRoutes.inventory.get(
    '/list',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.getAll),
  );
  api.baseRoutes.inventory.post(
    '/create-many',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.createManyInventory),
  );

  api.baseRoutes.inventory.get(
    '/exports',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.exportInventoryToExcel),
  );
  api.baseRoutes.inventory.get(
    '/',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.getPagination),
  );

  api.baseRoutes.inventory.get(
    '/:id',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.getDetail),
  );
  api.baseRoutes.inventory.post(
    '/create',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.createInventory),
  );
  api.baseRoutes.inventory.put(
    '/:id',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.updateInventory),
  );
  api.baseRoutes.inventory.delete(
    '/delete/:id',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.deleteInventory),
  );
}
