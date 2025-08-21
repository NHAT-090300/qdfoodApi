import { API } from 'api';
import * as handlers from 'api/handlers/banner';
import { authentication } from '@api/middleware';
import { ERole } from 'interface';

export function initBanner(api: API) {
  api.baseRoutes.banners.get('/list', api.handler(handlers.getAll));
  api.baseRoutes.banners.get(
    '/',
    api.handler(authentication(ERole.USER)),
    api.handler(handlers.getPagination),
  );
  api.baseRoutes.banners.get(
    '/:id',
    api.handler(authentication(ERole.USER)),
    api.handler(handlers.getDetail),
  );
  api.baseRoutes.banners.post(
    '/create',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.createBanner),
  );
  api.baseRoutes.banners.put(
    '/:id',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.updateBanner),
  );
  api.baseRoutes.banners.delete(
    '/delete/:id',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.deleteBanner),
  );
}
