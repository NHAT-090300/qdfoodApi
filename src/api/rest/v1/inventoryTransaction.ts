import { API } from 'api';
import * as handlers from 'api/handlers/inventoryTransaction';
import { authentication } from '@api/middleware';
import { ERole } from 'interface';

export function initInventorytransaction(api: API) {
  api.baseRoutes.inventoryTransaction.get(
    '/list',
    api.handler(authentication(ERole.USER)),
    api.handler(handlers.getAll),
  );
  api.baseRoutes.inventoryTransaction.get(
    '/',
    api.handler(authentication(ERole.USER)),
    api.handler(handlers.getPagination),
  );
  api.baseRoutes.inventoryTransaction.get(
    '/:id',
    api.handler(authentication(ERole.USER)),
    api.handler(handlers.getDetail),
  );
  api.baseRoutes.inventoryTransaction.post(
    '/create',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.createInventoryTransaction),
  );
  api.baseRoutes.inventoryTransaction.post(
    '/create-many',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.createManyInventoryTransaction),
  );
  api.baseRoutes.inventoryTransaction.put(
    '/:id',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.updateInventoryTransaction),
  );
  api.baseRoutes.inventoryTransaction.delete(
    '/delete/:id',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.deleteInventoryTransaction),
  );
}
