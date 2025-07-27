import { API } from 'api';
import * as handlers from 'api/handlers/news';
import { authentication } from '@api/middleware';
import { ERole } from 'interface';

export function initNews(api: API) {
  api.baseRoutes.news.get('/web-user', api.handler(handlers.getPagination));
  api.baseRoutes.news.get('/:id', api.handler(handlers.getDetail));
  api.baseRoutes.news.get(
    '/list',
    api.handler(authentication(ERole.USER)),
    api.handler(handlers.getAll),
  );
  api.baseRoutes.news.get(
    '/',
    api.handler(authentication(ERole.USER)),
    api.handler(handlers.getPagination),
  );
  api.baseRoutes.news.post(
    '/create',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.createNews),
  );
  api.baseRoutes.news.put(
    '/:id',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.updateNews),
  );
  api.baseRoutes.news.delete(
    '/:id',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.deleteNews),
  );
}
