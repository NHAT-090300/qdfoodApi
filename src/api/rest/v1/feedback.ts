import { API } from 'api';
import * as handlers from 'api/handlers/feedback';
import { authentication } from '@api/middleware';
import { ERole } from 'interface';

export function initFeedback(api: API) {
  api.baseRoutes.feedback.get(
    '/list',
    api.handler(authentication(ERole.USER)),
    api.handler(handlers.getAll),
  );
  api.baseRoutes.feedback.get(
    '/',
    api.handler(authentication(ERole.USER)),
    api.handler(handlers.getPagination),
  );
  api.baseRoutes.feedback.get(
    '/:id',
    api.handler(authentication(ERole.USER)),
    api.handler(handlers.getDetail),
  );
  api.baseRoutes.feedback.post(
    '/create',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.createFeedback),
  );
  api.baseRoutes.feedback.put(
    '/:id',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.updateFeedback),
  );
  api.baseRoutes.feedback.delete(
    '/delete/:id',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.deleteFeedback),
  );
}
