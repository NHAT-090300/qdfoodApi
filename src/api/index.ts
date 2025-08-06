import { Request, Response, NextFunction, Router } from 'express';

import { Server } from 'server';
import { logger } from 'logger';
import * as apiV1 from './rest/v1';

export type Context = Server;

class BaseRoutes {
  private root: Router;
  private v1: Router = Router();
  banners: Router = Router();
  user: Router = Router();
  news: Router = Router();
  category: Router = Router();
  auth: Router = Router();
  product: Router = Router();
  upload: Router = Router();
  location: Router = Router();
  partner: Router = Router();
  client: Router = Router();
  feedback: Router = Router();
  supplier: Router = Router();
  revenue: Router = Router();
  productPrice: Router = Router();
  order: Router = Router();
  inventory: Router = Router();
  inventoryTransaction: Router = Router();
  subCategory: Router = Router();

  constructor(rootRouter: Router) {
    this.root = rootRouter;
    this.root.use('/v1', this.v1);
    this.v1.use('/banner', this.banners);
    this.v1.use('/user', this.user);
    this.v1.use('/news', this.news);
    this.v1.use('/category', this.category);
    this.v1.use('/sub-category', this.subCategory);
    this.v1.use('/auth', this.auth);
    this.v1.use('/product', this.product);
    this.v1.use('/upload', this.upload);
    this.v1.use('/location', this.location);
    this.v1.use('/partner', this.partner);
    this.v1.use('/client', this.client);
    this.v1.use('/feedback', this.feedback);
    this.v1.use('/supplier', this.supplier);
    this.v1.use('/revenue', this.revenue);
    this.v1.use('/product-price', this.productPrice);
    this.v1.use('/order', this.order);
    this.v1.use('/inventory', this.inventory);
    this.v1.use('/inventory-transaction', this.inventoryTransaction);
  }
}

export class API {
  baseRoutes: BaseRoutes;
  server: Server;

  constructor(server: Server) {
    this.server = server;
    this.baseRoutes = new BaseRoutes(server.rootRouter);
  }

  setup = () => {
    apiV1.initBanner(this);
    apiV1.initUser(this);
    apiV1.initNews(this);
    apiV1.initCategory(this);
    apiV1.initSubCategory(this);
    apiV1.initAuth(this);
    apiV1.initProduct(this);
    apiV1.initUpload(this);
    apiV1.initLocation(this);
    apiV1.initPartner(this);
    apiV1.initClient(this);
    apiV1.initFeedback(this);
    apiV1.initSupplier(this);
    apiV1.initRevenue(this);
    apiV1.initProductPrice(this);
    apiV1.initOrder(this);
    apiV1.initInventory(this);
    apiV1.initInventorytransaction(this);
    logger.info('Setup api success!');
  };

  handler = (
    h: (ctx: Context, r: Request<any, any, any, any>, w: Response, n: NextFunction) => void,
  ) => {
    return (req: Request, res: Response, next: NextFunction) => {
      h(this.server, req, res, next);
    };
  };
}
