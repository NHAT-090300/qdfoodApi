import { API } from 'api';
import * as handlers from 'api/handlers/client';
import { authentication } from '@api/middleware';
import { ERole } from 'interface';

export function initClient(api: API) {
  api.baseRoutes.client.get('/list/web-user', api.handler(handlers.getAll));
  api.baseRoutes.client.get(
    '/list',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.getAll),
  );
  api.baseRoutes.client.get(
    '/',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.getPagination),
  );
  api.baseRoutes.client.get(
    '/:id',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.getDetail),
  );
  api.baseRoutes.client.post(
    '/create',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.createClient),
  );
  api.baseRoutes.client.put(
    '/:id',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.updateClient),
  );
  api.baseRoutes.client.delete(
    '/delete/:id',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.deleteClient),
  );
}
