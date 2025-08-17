import { API } from 'api';
import * as handlers from 'api/handlers/partner';
import { authentication } from '@api/middleware';
import { ERole } from 'interface';

export function initPartner(api: API) {
  api.baseRoutes.partner.get('/list/web-user', api.handler(handlers.getAll));
  api.baseRoutes.partner.get(
    '/list',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.getAll),
  );
  api.baseRoutes.partner.get(
    '/',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.getPagination),
  );
  api.baseRoutes.partner.get(
    '/:id',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.getDetail),
  );
  api.baseRoutes.partner.post(
    '/create',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.createPartner),
  );
  api.baseRoutes.partner.put(
    '/:id',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.updatePartner),
  );
  api.baseRoutes.partner.delete(
    '/delete/:id',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.deletePartner),
  );
}
