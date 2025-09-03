import { API } from 'api';
import * as handlers from 'api/handlers/subCategory';
import { authentication, authorization } from '@api/middleware';
import { EPermission, ERole } from 'interface';

export function initSubCategory(api: API) {
  // user
  api.baseRoutes.subCategory.get('/list/:categoryId/web-user', api.handler(handlers.getAll));
  // admin
  api.baseRoutes.subCategory.get(
    '/list/:categoryId',
    api.handler(authentication()),
    api.handler(handlers.getAll),
  );
  api.baseRoutes.subCategory.get(
    '/:categoryId',
    api.handler(authentication()),
    api.handler(handlers.getPagination),
  );
  api.baseRoutes.subCategory.get(
    '/:id',
    api.handler(authentication()),
    api.handler(handlers.getDetail),
  );
  api.baseRoutes.subCategory.post(
    '/create',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
        permissions: [EPermission.WRITE_CATEGORY],
      }),
    ),
    api.handler(handlers.createSubCategory),
  );
  api.baseRoutes.subCategory.put(
    '/:id',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
        permissions: [EPermission.WRITE_CATEGORY],
      }),
    ),
    api.handler(handlers.updateSubCategory),
  );
  api.baseRoutes.subCategory.delete(
    '/delete/:id',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
        permissions: [EPermission.WRITE_CATEGORY],
      }),
    ),
    api.handler(handlers.deleteSubCategory),
  );
}
