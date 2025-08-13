import { API } from 'api';
import * as handlers from 'api/handlers/product';
import { authentication } from '@api/middleware';
import { ERole } from 'interface';

export function initProduct(api: API) {
  // user
  api.baseRoutes.product.get('/random/web-user', api.handler(handlers.getMore));
  api.baseRoutes.product.get('/web-user', api.handler(handlers.getProductListByUser));
  api.baseRoutes.product.get('/cart/web-user', api.handler(handlers.getProductListCartByUser));
  api.baseRoutes.product.get('/:slug/web-user', api.handler(handlers.getDetailBySlug));
  // admin
  api.baseRoutes.product.get(
    '/list',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.getAll),
  );
  api.baseRoutes.product.get(
    '/all',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.getListWithInventory),
  );
  api.baseRoutes.product.get(
    '/',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.getPagination),
  );
  api.baseRoutes.product.get(
    '/:id',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.getDetail),
  );
  api.baseRoutes.product.post(
    '/create',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.createProduct),
  );
  api.baseRoutes.product.put(
    '/:id',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.updateProduct),
  );
  api.baseRoutes.product.delete(
    '/delete/:id',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.deleteProduct),
  );
}
