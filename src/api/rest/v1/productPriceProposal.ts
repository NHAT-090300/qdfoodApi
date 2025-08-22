import { API } from 'api';
import * as handlers from 'api/handlers/productPriceProposal';
import { authentication } from '@api/middleware';
import { ERole } from 'interface';

export function initProductPriceProposal(api: API) {
  api.baseRoutes.productPriceProposal.get(
    '/web-user',
    api.handler(authentication(ERole.USER)),
    api.handler(handlers.getPaginate),
  );
  api.baseRoutes.productPriceProposal.get(
    '/list',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.getAll),
  );
  api.baseRoutes.productPriceProposal.get(
    '/',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.getPaginateAdmin),
  );
  api.baseRoutes.productPriceProposal.get(
    '/:id',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.getDetail),
  );
  api.baseRoutes.productPriceProposal.post(
    '/upsert-bulk/:userId',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.upsertPriceProposals),
  );
  api.baseRoutes.productPriceProposal.post(
    '/create',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.createProductPriceProposal),
  );
  api.baseRoutes.productPriceProposal.post(
    '/bulk-create',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.bulkCreateProductPriceProposal),
  );
  api.baseRoutes.productPriceProposal.put(
    '/:id',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.updateProductPriceProposal),
  );
  api.baseRoutes.productPriceProposal.delete(
    '/:id',
    api.handler(authentication(ERole.ADMIN)),
    api.handler(handlers.deleteProductPriceProposal),
  );
}
