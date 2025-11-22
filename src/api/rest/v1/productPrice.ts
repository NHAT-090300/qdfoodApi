import { API } from 'api';
import * as handlers from 'api/handlers/productPrice';
import { authentication, authorization } from '@api/middleware';
import { EPermission, ERole } from 'interface';

export function initProductPrice(api: API) {
  api.baseRoutes.productPrice.get(
    '/export',
    api.handler(authentication()),
    api.handler(handlers.exportPriceList),
  );
  api.baseRoutes.productPrice.get(
    '/web-user',
    api.handler(authentication()),
    api.handler(handlers.getPaginate),
  );
  api.baseRoutes.productPrice.get(
    '/list',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
      }),
    ),
    api.handler(handlers.getAll),
  );
  api.baseRoutes.productPrice.get(
    '/',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
      }),
    ),
    api.handler(handlers.getPaginateAdmin),
  );
  api.baseRoutes.productPrice.get(
    '/:id',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
      }),
    ),
    api.handler(handlers.getDetail),
  );
  api.baseRoutes.productPrice.post(
    '/create',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
        permissions: [EPermission.WRITE_CUSTOM_PRICE],
      }),
    ),
    api.handler(handlers.createProductPrice),
  );
  api.baseRoutes.productPrice.post(
    '/bulk-create',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
        permissions: [EPermission.WRITE_CUSTOM_PRICE],
      }),
    ),
    api.handler(handlers.bulkCreateProductPrice),
  );
  api.baseRoutes.productPrice.post(
    '/bulk-create-by-code',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
        permissions: [EPermission.WRITE_CUSTOM_PRICE],
      }),
    ),
    api.handler(handlers.bulkCreateProductPriceWithCode),
  );
  api.baseRoutes.productPrice.post(
    '/sync-price/:userId',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
        permissions: [EPermission.WRITE_CUSTOM_PRICE],
      }),
    ),
    api.handler(handlers.syncPriceProposals),
  );
  api.baseRoutes.productPrice.put(
    '/:id',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
        permissions: [EPermission.WRITE_CUSTOM_PRICE],
      }),
    ),
    api.handler(handlers.updateProductPrice),
  );
  api.baseRoutes.productPrice.delete(
    '/:id',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
        permissions: [EPermission.WRITE_CUSTOM_PRICE],
      }),
    ),
    api.handler(handlers.deleteProductPrice),
  );
}
