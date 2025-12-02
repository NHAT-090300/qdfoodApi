import { API } from 'api';
import * as handlers from 'api/handlers/order';
import { authentication, authorization } from '@api/middleware';
import { EPermission, ERole } from 'interface';

export function initOrder(api: API) {
  api.baseRoutes.order.get(
    '/summary/web_user',
    api.handler(authentication()),
    api.handler(handlers.getSummary),
  );

  api.baseRoutes.order.get(
    '/stock-order',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
      }),
    ),
    api.handler(handlers.getStockOrderPaginate),
  );

  api.baseRoutes.order.get(
    '/revenue-stats/:clientId',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
      }),
    ),
    api.handler(handlers.getRevenueStatsPaginate),
  );

  api.baseRoutes.order.get(
    '/user-debt/list',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
      }),
    ),
    api.handler(handlers.getUserDebt),
  );

  api.baseRoutes.order.post(
    '/create/web_user',
    api.handler(authentication()),
    api.handler(handlers.createOrderUser),
  );
  api.baseRoutes.order.get(
    '/exports',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
      }),
    ),
    api.handler(handlers.exportOrders),
  );
  api.baseRoutes.order.get(
    '/exports/pdf',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
      }),
    ),
    api.handler(handlers.exportOrdersPDF),
  );
  api.baseRoutes.order.get(
    '/list/web_user',
    api.handler(authentication()),
    api.handler(handlers.getAll),
  );
  api.baseRoutes.order.get(
    '/web_user',
    api.handler(authentication()),
    api.handler(handlers.getPaginationForUser),
  );
  api.baseRoutes.order.get(
    '/',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
      }),
    ),
    api.handler(handlers.getPagination),
  );
  api.baseRoutes.order.get('/:id', api.handler(authentication()), api.handler(handlers.getDetail));
  api.baseRoutes.order.put(
    '/:id/add-items',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
        permissions: [EPermission.WRITE_ORDER],
      }),
    ),
    api.handler(handlers.updateOrderAddItems),
  );

  api.baseRoutes.order.patch(
    '/:id/isTax',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
        permissions: [EPermission.WRITE_ORDER],
      }),
    ),
    api.handler(handlers.updateOrderTax),
  );

  api.baseRoutes.order.patch(
    '/:id/status',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
        permissions: [EPermission.WRITE_ORDER],
      }),
    ),
    api.handler(handlers.updateStatusOrder),
  );

  api.baseRoutes.order.patch(
    '/pay-debt',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
        permissions: [EPermission.WRITE_ORDER],
      }),
    ),
    api.handler(handlers.payDebtForOrders),
  );

  api.baseRoutes.order.put(
    '/:id/refund-item',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
        permissions: [EPermission.WRITE_ORDER],
      }),
    ),
    api.handler(handlers.updateOrderItemRefund),
  );

  api.baseRoutes.order.put(
    '/:id/update-quantity-item',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
        permissions: [EPermission.WRITE_ORDER],
      }),
    ),
    api.handler(handlers.updateOrderItemQuantity),
  );

  api.baseRoutes.order.get(
    '/export/missing',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
      }),
    ),
    api.handler(handlers.exportMissingProducts),
  );

  api.baseRoutes.order.get(
    '/export/order-detail/:id',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
      }),
    ),
    api.handler(handlers.exportOrderDetailsToExcel),
  );
  api.baseRoutes.order.get(
    '/export/pdf/order-detail/:id',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
      }),
    ),
    api.handler(handlers.exportOrderDetailsToExcel),
  );

  api.baseRoutes.order.post(
    '/export/user-debt',
    api.handler(authentication()),
    api.handler(
      authorization({
        role: ERole.ADMIN,
        permissions: [EPermission.WRITE_ORDER],
      }),
    ),
    api.handler(handlers.exportUserDebtToExcel),
  );
}
