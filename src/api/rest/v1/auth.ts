import { API } from 'api';
import * as handlers from 'api/handlers/auth';

import { authentication } from '@api/middleware';

export function initAuth(api: API) {
  // admin
  api.baseRoutes.auth.post('/login', api.handler(handlers.loginAdmin));
  // user
  api.baseRoutes.auth.post('/login/client', api.handler(handlers.loginUser));
  api.baseRoutes.auth.post('/forgot-password', api.handler(handlers.forgotPassword));
  api.baseRoutes.auth.post('/reset-password', api.handler(handlers.resetPassword));
  api.baseRoutes.auth.post('/register', api.handler(handlers.register));
  api.baseRoutes.auth.post('/verify-otp', api.handler(handlers.verifyOtp));
  api.baseRoutes.auth.post('/resend-otp', api.handler(handlers.resendOtp));
  api.baseRoutes.auth.post('/refresh-token', api.handler(handlers.handleRefreshToken));
  api.baseRoutes.auth.get(
    '/info',
    api.handler(authentication()),
    api.handler(handlers.getUserInfo),
  );
}
