import { API } from 'api';
import * as handlers from 'api/handlers/order';
import { authentication } from '@api/middleware';
import { ERole } from 'interface';

export function initOrder(api: API) {
  api.baseRoutes.order.get(
    '/list',
    api.handler(authentication(ERole.USER)),
    api.handler(handlers.getAll),
  );
  api.baseRoutes.order.get(
    '/',
    api.handler(authentication(ERole.USER)),
    api.handler(handlers.getPagination),
  );
  api.baseRoutes.order.get(
    '/:id',
    api.handler(authentication(ERole.USER)),
    api.handler(handlers.getDetail),
  );
  api.baseRoutes.order.post(
    '/create',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.createOrder),
  );
  api.baseRoutes.order.put(
    '/:id',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.updateOrder),
  );
  api.baseRoutes.order.delete(
    '/delete/:id',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.deleteOrder),
  );
}
