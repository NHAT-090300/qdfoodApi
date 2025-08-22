import { API } from 'api';
import * as handlers from 'api/handlers/productPrice';
import { authentication } from '@api/middleware';
import { ERole } from 'interface';

export function initProductPrice(api: API) {
  api.baseRoutes.productPrice.get(
    '/web-user',
    api.handler(authentication(ERole.USER)),
    api.handler(handlers.getPaginate),
  );
  api.baseRoutes.productPrice.get(
    '/list',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.getAll),
  );
  api.baseRoutes.productPrice.get(
    '/',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.getPaginateAdmin),
  );
  api.baseRoutes.productPrice.get(
    '/:id',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.getDetail),
  );
  api.baseRoutes.productPrice.post(
    '/create',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.createProductPrice),
  );
  api.baseRoutes.productPrice.post(
    '/bulk-create',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.bulkCreateProductPrice),
  );
  api.baseRoutes.productPrice.put(
    '/:id',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.updateProductPrice),
  );
  api.baseRoutes.productPrice.delete(
    '/:id',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.deleteProductPrice),
  );
}
