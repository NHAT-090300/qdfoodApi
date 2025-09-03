import { API } from 'api';
import * as handlers from 'api/handlers/news';
import { authentication, authorization } from '@api/middleware';
import { EPermission, ERole } from 'interface';

export function initNews(api: API) {
  api.baseRoutes.news.get('/web-user', api.handler(handlers.getPagination));
  api.baseRoutes.news.get('/:id', api.handler(handlers.getDetail));
  api.baseRoutes.news.get('/list', api.handler(authentication()), api.handler(handlers.getAll));
  api.baseRoutes.news.get('/', api.handler(authentication()), api.handler(handlers.getPagination));
  api.baseRoutes.news.post(
    '/create',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
        permissions: [EPermission.WRITE_GENERAL_INFO],
      }),
    ),
    api.handler(handlers.createNews),
  );
  api.baseRoutes.news.put(
    '/:id',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
        permissions: [EPermission.WRITE_GENERAL_INFO],
      }),
    ),
    api.handler(handlers.updateNews),
  );
  api.baseRoutes.news.delete(
    '/:id',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
        permissions: [EPermission.WRITE_GENERAL_INFO],
      }),
    ),
    api.handler(handlers.deleteNews),
  );
}
