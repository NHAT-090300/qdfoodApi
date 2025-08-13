import { API } from 'api';
import * as handlers from 'api/handlers/productLog';
import { authentication } from '@api/middleware';
import { ERole } from 'interface';

export function initProductLog(api: API) {
  api.baseRoutes.productLog.get(
    '/exports',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.exportProductLogToExcel),
  );
  api.baseRoutes.productLog.get(
    '/',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.getPagination),
  );
  api.baseRoutes.productLog.post(
    '/',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.create),
  );
  api.baseRoutes.productLog.get(
    '/:id',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.getDetail),
  );
}
