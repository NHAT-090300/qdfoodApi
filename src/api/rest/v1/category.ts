import { API } from 'api';
import * as handlers from 'api/handlers/category';
import { authentication, authorization } from '@api/middleware';
import { EPermission, ERole } from 'interface';

export function initCategory(api: API) {
  // user
  api.baseRoutes.category.get('/web-user', api.handler(handlers.getSubCategory));
  api.baseRoutes.category.get('/list/web-user', api.handler(handlers.getAll));
  // admin
  api.baseRoutes.category.get(
    '/all',
    api.handler(authentication()),
    api.handler(handlers.getSubCategory),
  );
  api.baseRoutes.category.get('/list', api.handler(authentication()), api.handler(handlers.getAll));
  api.baseRoutes.category.get(
    '/',
    api.handler(authentication()),
    api.handler(handlers.getPagination),
  );
  api.baseRoutes.category.get(
    '/:id',
    api.handler(authentication()),
    api.handler(handlers.getDetail),
  );
  api.baseRoutes.category.post(
    '/create',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
        permissions: [EPermission.WRITE_CATEGORY],
      }),
    ),
    api.handler(handlers.createCategory),
  );
  api.baseRoutes.category.put(
    '/:id',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
        permissions: [EPermission.WRITE_CATEGORY],
      }),
    ),
    api.handler(handlers.updateCategory),
  );
  api.baseRoutes.category.delete(
    '/delete/:id',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
        permissions: [EPermission.WRITE_CATEGORY],
      }),
    ),
    api.handler(handlers.deleteCategory),
  );
}
