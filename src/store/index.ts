import to from 'await-to-js';
import { ClientSession, Db, MongoClient } from 'mongodb';

import { IConfig, IMongoSettings } from 'interface';
import { logger } from 'logger';
import { delayFunction } from 'utils';
import {
  MongoBanner,
  MongoUser,
  MongoNews,
  MongoDocument,
  MongoCategory,
  MongoProduct,
  MongoPartner,
  MongoClients,
  MongoFeedback,
  MongoSupplier,
  MongoRevenue,
  MongoProductPrice,
  MongoProductPriceProposal,
  MongoOrder,
  MongoInventory,
  MongoInventoryTransaction,
  MongoProductLog,
  MongoOtp,
  MongoSubCategory,
} from './mongo';

const DB_PING_ATTEMPTS = 5;
const DB_PING_TIMEOUT_SECS = 10;

class MongoStores {
  clientSession?: ClientSession;
  banner?: MongoBanner;
  user?: MongoUser;
  news?: MongoNews;
  document?: MongoDocument;
  category?: MongoCategory;
  product?: MongoProduct;
  partner?: MongoPartner;
  clients?: MongoClients;
  feedback?: MongoFeedback;
  supplier?: MongoSupplier;
  revenue?: MongoRevenue;
  productPrice?: MongoProductPrice;
  productPriceProposal?: MongoProductPriceProposal;
  order?: MongoOrder;
  inventory?: MongoInventory;
  inventoryTransaction?: MongoInventoryTransaction;
  productLog?: MongoProductLog;
  otp?: MongoOtp;
  subCategory?: MongoSubCategory;
}

export default class MongoStore {
  private static instance: MongoStore;
  client: MongoClient;
  config: IMongoSettings;
  stores: MongoStores;
  db?: Db;

  private constructor(mongoConfig: IMongoSettings) {
    this.config = mongoConfig;
    this.client = new MongoClient(
      `mongodb://${this.config.mongoUsername}:${this.config.mongoPassword}@${this.config.mongoUri}/?authMechanism=DEFAULT&directConnection=true`,
    );
    this.stores = new MongoStores();
  }

  static async getInstance(config: IConfig) {
    if (!this.instance) {
      this.instance = new MongoStore(config.mongoSettings);
      await this.instance.start();
    }

    return this.instance;
  }

  setup = async () => {
    for (let i = 0; i < DB_PING_ATTEMPTS; i += 1) {
      const [error] = await to(this.client.connect());

      if (!error) {
        logger.info('Connect MongoDB successfully!');
        this.db = this.client.db(this.config.mongoDatabase);
        break;
      }

      if (i === DB_PING_ATTEMPTS - 1) {
        throw error;
      }

      logger.error(`Connect MongoDB fail at time ${i + 1}: ${error?.message}`);
      await delayFunction(DB_PING_TIMEOUT_SECS * 1000);
    }
  };

  start = async () => {
    await this.setup();

    if (this.db) {
      this.stores.banner = new MongoBanner(this.db);
      this.stores.user = new MongoUser(this.db);
      this.stores.news = new MongoNews(this.db);
      this.stores.document = new MongoDocument(this.db);
      this.stores.category = new MongoCategory(this.db);
      this.stores.product = new MongoProduct(this.db);
      this.stores.partner = new MongoPartner(this.db);
      this.stores.clients = new MongoClients(this.db);
      this.stores.feedback = new MongoFeedback(this.db);
      this.stores.supplier = new MongoSupplier(this.db);
      this.stores.revenue = new MongoRevenue(this.db);
      this.stores.productPrice = new MongoProductPrice(this.db);
      this.stores.productPriceProposal = new MongoProductPriceProposal(this.db);
      this.stores.order = new MongoOrder(this.db);
      this.stores.inventory = new MongoInventory(this.db);
      this.stores.inventoryTransaction = new MongoInventoryTransaction(this.db);
      this.stores.productLog = new MongoProductLog(this.db);
      this.stores.otp = new MongoOtp(this.db);
      this.stores.subCategory = new MongoSubCategory(this.db);
    }
  };

  close = async () => {
    if (this.client) {
      await this.client.close();
    }
  };

  seed = async () => {
    try {
      await this.stores.product?.seed();

      logger.info('Seeding Database Schema Successfully.');
    } catch (error) {
      logger.error('Seeding Database Schema Error.');
      throw error;
    }
  };

  startSession = (): ClientSession => {
    return this.client.startSession();
  };

  endSession = async (session: ClientSession) => {
    await session.commitTransaction();
    session.endSession();
  };

  abortSession = async (session?: ClientSession) => {
    if (!session) return;

    await session.abortTransaction();
    session.endSession();
  };

  dropDatabase = async () => {
    await this.db?.dropDatabase();
  };

  database = () => this.db;

  banner() {
    if (!this.stores.banner) {
      throw new Error('Banner Store is not setup yet');
    }
    return this.stores.banner;
  }

  user() {
    if (!this.stores.user) {
      throw new Error('User Store is not setup yet');
    }
    return this.stores.user;
  }

  otp() {
    if (!this.stores.otp) {
      throw new Error('Otp Store is not setup yet');
    }
    return this.stores.otp;
  }

  news() {
    if (!this.stores.news) {
      throw new Error('News Store is not setup yet');
    }
    return this.stores.news;
  }

  document() {
    if (!this.stores.document) {
      throw new Error('Document Store is not setup yet');
    }
    return this.stores.document;
  }

  category() {
    if (!this.stores.category) {
      throw new Error('Category Store is not setup yet');
    }
    return this.stores.category;
  }

  product() {
    if (!this.stores.product) {
      throw new Error('Product Store is not setup yet');
    }
    return this.stores.product;
  }

  partner() {
    if (!this.stores.partner) {
      throw new Error('Partner Store is not setup yet');
    }
    return this.stores.partner;
  }

  clients() {
    if (!this.stores.clients) {
      throw new Error('Client Store is not setup yet');
    }
    return this.stores.clients;
  }

  feedback() {
    if (!this.stores.feedback) {
      throw new Error('Feedback Store is not setup yet');
    }
    return this.stores.feedback;
  }
  supplier() {
    if (!this.stores.supplier) {
      throw new Error('Supplier Store is not setup yet');
    }
    return this.stores.supplier;
  }
  revenue() {
    if (!this.stores.revenue) {
      throw new Error('Revenue Store is not setup yet');
    }
    return this.stores.revenue;
  }
  productPrice() {
    if (!this.stores.productPrice) {
      throw new Error('ProductPrice Store is not setup yet');
    }
    return this.stores.productPrice;
  }
  productPriceProposal() {
    if (!this.stores.productPriceProposal) {
      throw new Error('productPriceProposal Store is not setup yet');
    }
    return this.stores.productPriceProposal;
  }
  order() {
    if (!this.stores.order) {
      throw new Error('Order Store is not setup yet');
    }
    return this.stores.order;
  }
  inventory() {
    if (!this.stores.inventory) {
      throw new Error('Inventory Store is not setup yet');
    }
    return this.stores.inventory;
  }
  inventoryTransaction() {
    if (!this.stores.inventoryTransaction) {
      throw new Error('InventoryTransaction Store is not setup yet');
    }
    return this.stores.inventoryTransaction;
  }
  productLog() {
    if (!this.stores.productLog) {
      throw new Error('ProductLog Store is not setup yet');
    }
    return this.stores.productLog;
  }
  subCategory() {
    if (!this.stores.subCategory) {
      throw new Error('subCategory Store is not setup yet');
    }
    return this.stores.subCategory;
  }
}
