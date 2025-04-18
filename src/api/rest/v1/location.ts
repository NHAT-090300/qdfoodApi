import { API } from 'api';
import * as handlers from 'api/handlers/location';

export function initLocation(api: API) {
  api.baseRoutes.location.get('/', api.handler(handlers.getLocation));
}
