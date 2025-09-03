import { API } from 'api';
import * as handlers from 'api/handlers/user';
import { authentication, authorization } from '@api/middleware';
import { EPermission, ERole } from 'interface';

export function initUser(api: API) {
  api.baseRoutes.user.put(
    '/',
    api.handler(authentication()),
    api.handler(handlers.updateUserClient),
  );
  api.baseRoutes.user.put(
    '/password',
    api.handler(authentication()),
    api.handler(handlers.updatePasswordClient),
  );
  api.baseRoutes.user.get(
    '/list',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
      }),
    ),
    api.handler(handlers.getAll),
  );
  api.baseRoutes.user.get(
    '/',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
      }),
    ),
    api.handler(handlers.getPagination),
  );
  api.baseRoutes.user.get(
    '/summary',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
      }),
    ),
    api.handler(handlers.getUserDebtPaginate),
  );
  api.baseRoutes.user.post(
    '/create',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
        permissions: [EPermission.WRITE_USER],
      }),
    ),
    api.handler(handlers.createUser),
  );
  api.baseRoutes.user.get(
    '/:id',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
      }),
    ),
    api.handler(handlers.getDetail),
  );
  api.baseRoutes.user.put(
    '/:id',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
        permissions: [EPermission.WRITE_USER],
      }),
    ),
    api.handler(handlers.updateUser),
  );
  api.baseRoutes.user.put(
    '/status/:id',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
        permissions: [EPermission.WRITE_USER],
      }),
    ),
    api.handler(handlers.deleteUser),
  );

  api.baseRoutes.user.get(
    '/dashboard/getTotal',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
      }),
    ),
    api.handler(handlers.getTotalData),
  );
}
