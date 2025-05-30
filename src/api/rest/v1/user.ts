import { API } from 'api';
import * as handlers from 'api/handlers/user';
import { authentication } from '@api/middleware';
import { ERole } from 'interface';

export function initUser(api: API) {
  api.baseRoutes.user.get(
    '/list',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.getAll),
  );
  api.baseRoutes.user.get(
    '/',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.getPagination),
  );
  api.baseRoutes.user.post(
    '/create',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.createUser),
  );
  api.baseRoutes.user.get(
    '/:id',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.getDetail),
  );
  api.baseRoutes.user.put(
    '/:id',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.updateUser),
  );
  api.baseRoutes.user.put(
    '/status/:id',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.deleteUser),
  );
}
