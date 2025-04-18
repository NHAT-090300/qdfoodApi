import { API } from 'api';
import * as handlers from 'api/handlers/auth';
import { authentication } from '@api/middleware';
import { ERole } from 'interface';

export function initAuth(api: API) {
  api.baseRoutes.auth.post('/login', api.handler(handlers.login));
  api.baseRoutes.auth.get(
    '/info',
    api.handler(authentication(ERole.USER)),
    api.handler(handlers.getUserInfo),
  );
}
