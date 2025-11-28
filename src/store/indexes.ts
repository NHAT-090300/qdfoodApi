import { Db } from 'mongodb';

interface IndexSpec {
  key: Record<string, 1 | -1 | 'text'>;
  options?: any;
}

export async function createAllIndexes(db: Db): Promise<void> {
  const collections: Array<{
    name: string;
    indexes: IndexSpec[];
  }> = [
    // 1. USERS
    {
      name: 'users',
      indexes: [
        { key: { email: 1 }, options: { unique: true, name: 'idx_user_email_unique' } },
        {
          key: { phoneNumber: 1 },
          options: { unique: true, sparse: true, name: 'idx_user_phone_unique' },
        },
        { key: { role: 1 }, options: { name: 'idx_user_role' } },
        { key: { isDelete: 1 }, options: { name: 'idx_user_isDelete' } },
        { key: { createdAt: -1 }, options: { name: 'idx_user_createdAt_desc' } },
        { key: { name: 'text', email: 'text' }, options: { name: 'idx_user_text_search' } },
      ],
    },

    // 2. PRODUCTS
    {
      name: 'products',
      indexes: [
        // 1. Unique
        { key: { code: 1 }, options: { unique: true, name: 'idx_product_code_unique' } },
        { key: { slug: 1 }, options: { unique: true, name: 'idx_product_slug_unique' } },

        // 2. Filter by category
        { key: { categoryId: 1 }, options: { name: 'idx_product_category' } },
        { key: { subCategoryId: 1 }, options: { sparse: true, name: 'idx_product_subcategory' } },
        {
          key: { categoryId: 1, subCategoryId: 1 },
          options: { sparse: true, name: 'idx_product_cat_subcat' },
        },

        // 3. Filter + sort chính
        {
          key: { isShow: 1, categoryId: 1, defaultPrice: 1, createdAt: -1 },
          options: { name: 'idx_product_filter_sort' },
        },

        // 4. Các filter riêng
        { key: { type: 1 }, options: { name: 'idx_product_type' } },
        { key: { defaultPrice: 1 }, options: { name: 'idx_product_price_range' } },
        { key: { isShow: 1 }, options: { name: 'idx_product_isShow' } },

        // 5. Sort mặc định
        { key: { createdAt: -1 }, options: { name: 'idx_product_createdAt_desc' } },

        // 6. Text search (chỉ dùng $text)
        {
          key: { name: 'text', description: 'text', code: 'text' },
          options: {
            name: 'idx_product_text_search',
            weights: { name: 10, code: 8, description: 5 },
          },
        },

        { key: { search: 1 }, options: { name: 'idx_product_search' } },
      ],
    },

    // 3. INVENTORY
    {
      name: 'inventory',
      indexes: [
        { key: { productId: 1 }, options: { unique: true, name: 'idx_inventory_product_unique' } },
        { key: { quantity: 1 }, options: { name: 'idx_inventory_quantity' } },
      ],
    },

    // 4. INVENTORY TRANSACTIONS
    {
      name: 'inventory_transactions',
      indexes: [
        { key: { productId: 1 }, options: { name: 'idx_transaction_product' } },
        { key: { type: 1 }, options: { name: 'idx_transaction_type' } },
        { key: { supplierId: 1 }, options: { sparse: true, name: 'idx_transaction_supplier' } },
        { key: { orderId: 1 }, options: { sparse: true, name: 'idx_transaction_order' } },
        { key: { createdAt: -1 }, options: { name: 'idx_transaction_createdAt_desc' } },
        // Compound: tìm theo sản phẩm + thời gian
        { key: { productId: 1, createdAt: -1 }, options: { name: 'idx_transaction_product_date' } },
      ],
    },

    // 5. PRODUCT PRICES (từ trước)
    {
      name: 'product_prices',
      indexes: [
        {
          key: { userId: 1, productId: 1 },
          options: { unique: true, name: 'idx_price_user_product_unique' },
        },
        { key: { userId: 1 }, options: { name: 'idx_price_user' } },
        { key: { createdAt: -1 }, options: { name: 'idx_price_createdAt_desc' } },
      ],
    },

    // 6. PRODUCT PRICE PROPOSALS
    {
      name: 'product_price_proposals',
      indexes: [
        {
          key: { userId: 1, productId: 1 },
          options: { unique: true, name: 'idx_proposal_user_product_unique' },
        },
        { key: { status: 1 }, options: { name: 'idx_proposal_status' } },
        { key: { createdAt: -1 }, options: { name: 'idx_proposal_createdAt_desc' } },
      ],
    },

    // 7. ORDERS
    {
      name: 'orders',
      indexes: [
        {
          key: { userId: 1, status: 1, createdAt: -1 },
          options: { name: 'idx_order_user_status_created' },
        },
      ],
    },
  ];

  for (const { name, indexes } of collections) {
    const coll = db.collection(name);
    console.log(`\nCreating indexes for: ${name}`);

    for (const { key, options } of indexes) {
      try {
        const indexName = await coll.createIndex(key, { background: true, ...options });
        console.log(`Index created: ${indexName}`);
      } catch (error: any) {
        if (error.code === 85 || error.codeName === 'IndexOptionsConflict') {
          console.log(`Index already exists: ${options?.name || JSON.stringify(key)}`);
        } else {
          console.error(`Failed on ${name}:`, error.message);
        }
      }
    }
  }

  console.log('\nAll indexes created successfully!');
}
