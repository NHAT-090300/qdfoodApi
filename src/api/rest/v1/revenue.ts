import { API } from 'api';
import * as handlers from 'api/handlers/revenue';
import { authentication, authorization } from '@api/middleware';
import { ERole } from 'interface';

export function initRevenue(api: API) {
  api.baseRoutes.revenue.get('/list', api.handler(authentication()), api.handler(handlers.getAll));
  api.baseRoutes.revenue.get(
    '/',
    api.handler(authentication()),
    api.handler(handlers.getPagination),
  );
  api.baseRoutes.revenue.get(
    '/:id',
    api.handler(authentication()),
    api.handler(handlers.getDetail),
  );
  api.baseRoutes.revenue.post(
    '/create',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
      }),
    ),
    api.handler(handlers.createRevenue),
  );
  api.baseRoutes.revenue.put(
    '/:id',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
      }),
    ),
    api.handler(handlers.updateRevenue),
  );
  api.baseRoutes.revenue.delete(
    '/delete/:id',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
      }),
    ),
    api.handler(handlers.deleteRevenue),
  );
}
