import { API } from 'api';
import * as handlers from 'api/handlers/inventoryTransaction';
import { authentication, authorization } from '@api/middleware';
import { ERole } from 'interface';

export function initInventorytransaction(api: API) {
  api.baseRoutes.inventoryTransaction.get(
    '/list',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
      }),
    ),
    api.handler(handlers.getAll),
  );
  api.baseRoutes.inventoryTransaction.get(
    '/',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
      }),
    ),
    api.handler(handlers.getPagination),
  );

  api.baseRoutes.inventoryTransaction.get(
    '/exports',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
      }),
    ),
    api.handler(handlers.exportInventoryTransactionsToExcel),
  );

  api.baseRoutes.inventoryTransaction.get(
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
