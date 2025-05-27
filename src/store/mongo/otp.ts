import { ClientSession, Db, ObjectId } from 'mongodb';

import { IOtp } from 'interface';
import { Otp } from 'model';
import { BaseStore } from './base';

export class MongoOtp extends BaseStore<IOtp> {
  constructor(db: Db) {
    super(db, 'otps');
  }

  private getProject(custom: object = {}) {
    return {
      _id: 1,
      createdAt: 1,
      updatedAt: 1,
      isDelete: 1,
      email: 1,
      ...custom,
    };
  }

  async getOne(filters: Partial<IOtp>) {
    return this.collection.findOne<IOtp>(filters, {
      projection: this.getProject({
        otpExpiresAt: 1,
        isVerified: 1,
      }),
    });
  }

  async createOne(data: Otp, session?: ClientSession) {
    data.preSave();

    const result = await this.collection.insertOne(data, { session });
    data._id = result.insertedId;
    return data;
  }

  async updateOne(id: string, data: Otp, session?: ClientSession) {
    data.preUpdate();

    await this.baseUpdate({ _id: new ObjectId(id) }, { $set: data }, { session });
    data._id = new ObjectId(id);
    return data;
  }
}
