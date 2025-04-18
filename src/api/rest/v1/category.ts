import { API } from 'api';
import * as handlers from 'api/handlers/category';
import { authentication } from '@api/middleware';
import { ERole } from 'interface';

export function initCategory(api: API) {
  // user
  api.baseRoutes.category.get('/list/web-user', api.handler(handlers.getAll));
  // admin
  api.baseRoutes.category.get(
    '/list',
    api.handler(authentication(ERole.USER)),
    api.handler(handlers.getAll),
  );
  api.baseRoutes.category.get(
    '/',
    api.handler(authentication(ERole.USER)),
    api.handler(handlers.getPagination),
  );
  api.baseRoutes.category.get(
    '/:id',
    api.handler(authentication(ERole.USER)),
    api.handler(handlers.getDetail),
  );
  api.baseRoutes.category.post(
    '/create',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.createCategory),
  );
  api.baseRoutes.category.put(
    '/:id',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.updateCategory),
  );
  api.baseRoutes.category.delete(
    '/delete/:id',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.deleteCategory),
  );
}
