import { API } from 'api';
import * as handlers from 'api/handlers/productPriceProposal';
import { authentication, authorization } from '@api/middleware';
import { EPermission, ERole } from 'interface';

export function initProductPriceProposal(api: API) {
  api.baseRoutes.productPriceProposal.get(
    '/:userId/web-user',
    api.handler(authentication()),
    api.handler(handlers.getPaginate),
  );
  api.baseRoutes.productPriceProposal.get(
    '/list',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
      }),
    ),
    api.handler(handlers.getAll),
  );
  api.baseRoutes.productPriceProposal.get(
    '/',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
      }),
    ),
    api.handler(handlers.getPaginateAdmin),
  );
  api.baseRoutes.productPriceProposal.get(
    '/:id',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
      }),
    ),
    api.handler(handlers.getDetail),
  );
  api.baseRoutes.productPriceProposal.post(
    '/upsert-bulk/:userId',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
        permissions: [EPermission.WRITE_CUSTOM_PRICE],
      }),
    ),
    api.handler(handlers.upsertPriceProposals),
  );
  api.baseRoutes.productPriceProposal.post(
    '/create',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
        permissions: [EPermission.WRITE_CUSTOM_PRICE],
      }),
    ),
    api.handler(handlers.createProductPriceProposal),
  );
  api.baseRoutes.productPriceProposal.post(
    '/bulk-create',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
        permissions: [EPermission.WRITE_CUSTOM_PRICE],
      }),
    ),
    api.handler(handlers.bulkCreateProductPriceProposal),
  );
  api.baseRoutes.productPriceProposal.post(
    '/bulk-create-by-code',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
        permissions: [EPermission.WRITE_CUSTOM_PRICE],
      }),
    ),
    api.handler(handlers.bulkCreateProductPriceProposalWithCode),
  );
  api.baseRoutes.productPriceProposal.put(
    '/:id',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
        permissions: [EPermission.WRITE_CUSTOM_PRICE],
      }),
    ),
    api.handler(handlers.updateProductPriceProposal),
  );
  api.baseRoutes.productPriceProposal.delete(
    '/:id',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
        permissions: [EPermission.WRITE_CUSTOM_PRICE],
      }),
    ),
    api.handler(handlers.deleteProductPriceProposal),
  );
}
