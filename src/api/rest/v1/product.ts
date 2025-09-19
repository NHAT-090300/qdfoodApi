import { API } from 'api';
import * as handlers from 'api/handlers/product';
import { authentication, authorization } from '@api/middleware';
import { EPermission, ERole } from 'interface';

export function initProduct(api: API) {
  // user
  api.baseRoutes.product.get('/random/web-user', api.handler(handlers.getMore));
  api.baseRoutes.product.get('/web-user', api.handler(handlers.getProductListByUser));
  api.baseRoutes.product.get('/cart/web-user', api.handler(handlers.getProductListCartByUser));
  api.baseRoutes.product.get('/:slug/web-user', api.handler(handlers.getDetailBySlug));
  // admin
  api.baseRoutes.product.get(
    '/list',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
      }),
    ),
    api.handler(handlers.getAll),
  );
  api.baseRoutes.product.get(
    '/all',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
      }),
    ),
    api.handler(handlers.getListWithInventory),
  );
  api.baseRoutes.product.get(
    '/',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
      }),
    ),
    api.handler(handlers.getPagination),
  );
  api.baseRoutes.product.get(
    '/:id',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
      }),
    ),
    api.handler(handlers.getDetail),
  );
  api.baseRoutes.product.post(
    '/create',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
        permissions: [EPermission.WRITE_PRODUCT],
      }),
    ),
    api.handler(handlers.createProduct),
  );
  api.baseRoutes.product.put(
    '/:id',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
        permissions: [EPermission.WRITE_PRODUCT],
      }),
    ),
    api.handler(handlers.updateProduct),
  );
  api.baseRoutes.product.put(
    '/update-status/:id',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
        permissions: [EPermission.WRITE_PRODUCT],
      }),
    ),
    api.handler(handlers.updateStatus),
  );
}
