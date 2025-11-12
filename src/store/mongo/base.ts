import {
  Collection,
  CountDocumentsOptions,
  Db,
  DeleteOptions,
  Document,
  Filter,
  FindOptions,
  MatchKeysAndValues,
  ObjectId,
  UpdateFilter,
  UpdateOptions,
} from 'mongodb';

export class BaseStore<T extends Document> {
  collection: Collection<T>;

  constructor(db: Db, collectionName: string) {
    this.collection = db.collection<T>(collectionName);
  }

  preSet(data: MatchKeysAndValues<T>) {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { _id, ...doc } = data;
    return Object.fromEntries(
      Object.entries(doc).filter(([, value]) => value !== undefined),
    ) as MatchKeysAndValues<T>;
  }

  async findById<Type extends object = T>(
    id: string | ObjectId,
    options: FindOptions<T> = {},
  ): Promise<Type | null> {
    return this.collection.findOne<Type>({ _id: new ObjectId(id) } as Filter<T>, options);
  }

  async find<Type extends object = T>(
    filters: Filter<T> = {},
    projection: Partial<Record<keyof Type, any>> = {},
    options: FindOptions<T> = {},
  ): Promise<Type[]> {
    return this.collection.find<Type>(filters, { projection, ...options }).toArray();
  }

  async findOne<Type extends object = T>(
    filters: Filter<T>,
    projection: Partial<Record<keyof Type, any>> = {},
    options: FindOptions<T> = {},
  ): Promise<Type | null> {
    return this.collection.findOne<Type>(filters, { projection, ...options });
  }

  async findOnePopulate<Type extends object = T>(
    filters: Filter<T>,
    populate: { path: string; localField: string; foreignField: string; as?: string }[] = [],
    projection: Partial<Record<keyof Type, any>> = {},
  ): Promise<Type | null> {
    const pipeline: any[] = [{ $match: filters }];

    for (const { path, localField, foreignField, as } of populate) {
      pipeline.push({
        $lookup: {
          from: path,
          localField,
          foreignField,
          as: as || path,
        },
      });
      pipeline.push({
        $unwind: {
          path: `$${as || path}`,
          preserveNullAndEmptyArrays: true,
        },
      });
    }

    if (Object.keys(projection).length > 0) {
      pipeline.push({ $project: projection });
    }

    const result = await this.collection.aggregate<Type>(pipeline).toArray();
    return result[0] || null;
  }

  async baseUpdate(
    filters: Filter<T>,
    update: UpdateFilter<T>,
    options?: UpdateOptions,
  ): Promise<void> {
    if (update.$set) {
      update.$set = this.preSet(update.$set);
    }
    await this.collection.updateOne(filters, update, options);
  }

  async baseUpdateMany(
    filters: Filter<T>,
    update: UpdateFilter<T>,
    options?: UpdateOptions,
  ): Promise<void> {
    if (update.$set) {
      update.$set = this.preSet(update.$set);
    }
    await this.collection.updateMany(filters, update, options);
  }

  async baseDelete(filters: Filter<T>, options?: DeleteOptions): Promise<void> {
    await this.collection.deleteOne(filters, options);
  }

  async baseDeleteMany(filters: Filter<T>, options?: DeleteOptions): Promise<void> {
    await this.collection.deleteMany(filters, options);
  }

  async count(filters?: Filter<T>, options?: CountDocumentsOptions) {
    return await this.collection.countDocuments(filters, options);
  }

  async aggregate<R extends Document = Document>(pipeline: object[]): Promise<R[]> {
    return this.collection.aggregate<R>(pipeline).toArray();
  }

  async aggregateOne<R extends Document = Document>(pipeline: object[]): Promise<R | null> {
    return this.collection.aggregate<R>(pipeline).next();
  }
}
