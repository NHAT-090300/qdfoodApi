import { API } from 'api';
import * as handlers from 'api/handlers/inventory';
import { authentication, authorization } from '@api/middleware';
import { EPermission, ERole } from 'interface';

export function initInventory(api: API) {
  api.baseRoutes.inventory.get(
    '/list',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
      }),
    ),
    api.handler(handlers.getAll),
  );
  api.baseRoutes.inventory.post(
    '/create-many',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
        permissions: [EPermission.WRITE_INVENTORY],
      }),
    ),
    api.handler(handlers.createManyInventory),
  );

  api.baseRoutes.inventory.get(
    '/exports',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
      }),
    ),
    api.handler(handlers.exportInventoryToExcel),
  );
  api.baseRoutes.inventory.get(
    '/',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
      }),
    ),
    api.handler(handlers.getPagination),
  );

  api.baseRoutes.inventory.get(
    '/:id',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
      }),
    ),
    api.handler(handlers.getDetail),
  );
  api.baseRoutes.inventory.post(
    '/create',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
        permissions: [EPermission.WRITE_INVENTORY],
      }),
    ),
    api.handler(handlers.createInventory),
  );
  api.baseRoutes.inventory.put(
    '/:id',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
        permissions: [EPermission.WRITE_INVENTORY],
      }),
    ),
    api.handler(handlers.updateInventory),
  );
  api.baseRoutes.inventory.put(
    '/quantity/:id',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
        permissions: [EPermission.WRITE_INVENTORY],
      }),
    ),
    api.handler(handlers.updateInventoryQuantity),
  );
}
