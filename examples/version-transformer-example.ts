/**
 * Version Transformer Example
 *
 * This example demonstrates how to use the version transformer utilities from the Midaz SDK
 * to handle API versioning in requests and responses.
 */

import {
  createIdentityTransformer,
  createModelTransformer,
  createVersionTransformerFactory,
  transformRequest,
  transformResponse,
} from '../src/util/data';

// Example 1: Basic Model Transformation
function basicModelTransformationExample() {
  console.log('\n=== Basic Model Transformation Example ===');

  // Define client-side user model (the format used in your application)
  interface ClientUser {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    createdAt: Date;
    isActive: boolean;
  }

  // Define API v1 user model (the format used by API v1)
  interface ApiV1User {
    user_id: string;
    first_name: string;
    last_name: string;
    email_address: string;
    created_at: string;
    is_active: boolean;
  }

  // Create a transformer between client and API v1 models
  const userV1Transformer = createModelTransformer<ClientUser, ApiV1User>(
    // Client to API transformation (for requests)
    (clientUser: ClientUser): ApiV1User => ({
      user_id: clientUser.id,
      first_name: clientUser.firstName,
      last_name: clientUser.lastName,
      email_address: clientUser.email,
      created_at: clientUser.createdAt.toISOString(),
      is_active: clientUser.isActive,
    }),

    // API to Client transformation (for responses)
    (apiUser: ApiV1User): ClientUser => ({
      id: apiUser.user_id,
      firstName: apiUser.first_name,
      lastName: apiUser.last_name,
      email: apiUser.email_address,
      createdAt: new Date(apiUser.created_at),
      isActive: apiUser.is_active,
    })
  );

  // Example client user
  const clientUser: ClientUser = {
    id: 'user-123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    createdAt: new Date('2023-01-15T10:30:00Z'),
    isActive: true,
  };

  console.log('Original Client User:');
  console.log(clientUser);

  // Transform client user to API format (for sending to API)
  const apiUser = userV1Transformer.toApiModel(clientUser);
  console.log('\nTransformed to API V1 Format:');
  console.log(apiUser);

  // Transform API user back to client format (after receiving from API)
  const transformedClientUser = userV1Transformer.toClientModel(apiUser);
  console.log('\nTransformed back to Client Format:');
  console.log(transformedClientUser);
}

// Example 2: Version-Specific Transformers
function versionSpecificTransformersExample() {
  console.log('\n=== Version-Specific Transformers Example ===');

  // Define client-side product model
  interface ClientProduct {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    tags: string[];
    inStock: boolean;
    createdAt: Date;
  }

  // Define API v1 product model
  interface ApiV1Product {
    product_id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    tags: string; // comma-separated in v1
    in_stock: boolean;
    created_at: string;
  }

  // Define API v2 product model with some changes
  interface ApiV2Product {
    id: string; // Changed from product_id
    name: string;
    description: string;
    pricing: {
      // Nested pricing object in v2
      amount: number;
      currency: string;
    };
    category: string;
    tags: string[]; // Array in v2
    inventory: {
      // Nested inventory object in v2
      available: boolean;
      quantity?: number;
    };
    metadata: {
      // Metadata added in v2
      created_at: string;
      updated_at?: string;
    };
  }

  // Create v1 transformer
  const productV1Transformer = createModelTransformer<ClientProduct, ApiV1Product>(
    // Client to API v1
    (clientProduct: ClientProduct): ApiV1Product => ({
      product_id: clientProduct.id,
      name: clientProduct.name,
      description: clientProduct.description,
      price: clientProduct.price,
      category: clientProduct.category,
      tags: clientProduct.tags.join(','), // Join array to comma-separated string
      in_stock: clientProduct.inStock,
      created_at: clientProduct.createdAt.toISOString(),
    }),

    // API v1 to Client
    (apiProduct: ApiV1Product): ClientProduct => ({
      id: apiProduct.product_id,
      name: apiProduct.name,
      description: apiProduct.description,
      price: apiProduct.price,
      category: apiProduct.category,
      tags: apiProduct.tags.split(',').map((tag) => tag.trim()), // Split string to array
      inStock: apiProduct.in_stock,
      createdAt: new Date(apiProduct.created_at),
    })
  );

  // Create v2 transformer
  const productV2Transformer = createModelTransformer<ClientProduct, ApiV2Product>(
    // Client to API v2
    (clientProduct: ClientProduct): ApiV2Product => ({
      id: clientProduct.id,
      name: clientProduct.name,
      description: clientProduct.description,
      pricing: {
        amount: clientProduct.price,
        currency: 'USD', // Default currency
      },
      category: clientProduct.category,
      tags: clientProduct.tags,
      inventory: {
        available: clientProduct.inStock,
        quantity: clientProduct.inStock ? 1 : 0, // Default quantity
      },
      metadata: {
        created_at: clientProduct.createdAt.toISOString(),
        updated_at: new Date().toISOString(), // Add current time as updated_at
      },
    }),

    // API v2 to Client
    (apiProduct: ApiV2Product): ClientProduct => ({
      id: apiProduct.id,
      name: apiProduct.name,
      description: apiProduct.description,
      price: apiProduct.pricing.amount,
      category: apiProduct.category,
      tags: apiProduct.tags,
      inStock: apiProduct.inventory.available,
      createdAt: new Date(apiProduct.metadata.created_at),
    })
  );

  // Create version transformer factory
  const productTransformerFactory = createVersionTransformerFactory<ClientProduct>(
    {
      v1: productV1Transformer,
      v2: productV2Transformer,
    },
    'v1'
  ); // v1 is the default version

  // Example client product
  const clientProduct: ClientProduct = {
    id: 'prod-456',
    name: 'Wireless Headphones',
    description: 'High-quality wireless headphones with noise cancellation',
    price: 149.99,
    category: 'Electronics',
    tags: ['audio', 'wireless', 'headphones'],
    inStock: true,
    createdAt: new Date('2023-03-20T14:45:00Z'),
  };

  console.log('Original Client Product:');
  console.log(clientProduct);

  // Get transformers for different versions
  const v1Transformer = productTransformerFactory.getTransformer('v1');
  const v2Transformer = productTransformerFactory.getTransformer('v2');

  // Transform to API v1 format
  const apiV1Product = v1Transformer.toApiModel(clientProduct);
  console.log('\nTransformed to API V1 Format:');
  console.log(apiV1Product);

  // Transform to API v2 format
  const apiV2Product = v2Transformer.toApiModel(clientProduct);
  console.log('\nTransformed to API V2 Format:');
  console.log(apiV2Product);

  // Transform back from both versions
  const fromV1 = v1Transformer.toClientModel(apiV1Product);
  const fromV2 = v2Transformer.toClientModel(apiV2Product);

  console.log('\nTransformed back from V1:');
  console.log(fromV1);

  console.log('\nTransformed back from V2:');
  console.log(fromV2);
}

// Example 3: Handling API Responses with Transformers
function apiResponseTransformExample() {
  console.log('\n=== Handling API Responses with Transformers Example ===');

  // Define client-side order model
  interface ClientOrder {
    id: string;
    customerId: string;
    items: {
      productId: string;
      quantity: number;
      unitPrice: number;
    }[];
    totalAmount: number;
    status: 'pending' | 'processing' | 'shipped' | 'delivered';
    createdAt: Date;
  }

  // Define API v1 order model
  interface ApiV1Order {
    order_id: string;
    customer_id: string;
    line_items: {
      product_id: string;
      quantity: number;
      unit_price: number;
    }[];
    total_amount: number;
    status: string;
    created_at: string;
  }

  // Create order transformer
  const orderTransformer = createModelTransformer<ClientOrder, ApiV1Order>(
    // Client to API
    (clientOrder: ClientOrder): ApiV1Order => ({
      order_id: clientOrder.id,
      customer_id: clientOrder.customerId,
      line_items: clientOrder.items.map((item) => ({
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
      })),
      total_amount: clientOrder.totalAmount,
      status: clientOrder.status,
      created_at: clientOrder.createdAt.toISOString(),
    }),

    // API to Client
    (apiOrder: ApiV1Order): ClientOrder => ({
      id: apiOrder.order_id,
      customerId: apiOrder.customer_id,
      items: apiOrder.line_items.map((item) => ({
        productId: item.product_id,
        quantity: item.quantity,
        unitPrice: item.unit_price,
      })),
      totalAmount: apiOrder.total_amount,
      status: apiOrder.status as any,
      createdAt: new Date(apiOrder.created_at),
    })
  );

  // Simulate different types of API responses

  // 1. Single order response
  const singleOrderResponse: ApiV1Order = {
    order_id: 'ord-789',
    customer_id: 'cust-123',
    line_items: [
      { product_id: 'prod-1', quantity: 2, unit_price: 29.99 },
      { product_id: 'prod-2', quantity: 1, unit_price: 49.99 },
    ],
    total_amount: 109.97,
    status: 'processing',
    created_at: '2023-04-15T09:30:00Z',
  };

  // 2. Array of orders response
  const ordersArrayResponse: ApiV1Order[] = [
    singleOrderResponse,
    {
      order_id: 'ord-790',
      customer_id: 'cust-123',
      line_items: [{ product_id: 'prod-3', quantity: 1, unit_price: 19.99 }],
      total_amount: 19.99,
      status: 'pending',
      created_at: '2023-04-16T10:15:00Z',
    },
  ];

  // 3. Paginated response
  const paginatedOrdersResponse = {
    items: ordersArrayResponse,
    page: 1,
    pageSize: 10,
    totalItems: 2,
    totalPages: 1,
  };

  // Transform each type of response
  const transformedSingleOrder = transformResponse(orderTransformer, singleOrderResponse);
  const transformedOrdersArray = transformResponse(orderTransformer, ordersArrayResponse);
  const transformedPaginatedOrders = transformResponse(orderTransformer, paginatedOrdersResponse);

  console.log('Transformed Single Order:');
  console.log(transformedSingleOrder);

  console.log('\nTransformed Orders Array:');
  console.log(transformedOrdersArray);

  console.log('\nTransformed Paginated Orders:');
  console.log(transformedPaginatedOrders);
}

// Example 4: API Version Negotiation
function apiVersionNegotiationExample() {
  console.log('\n=== API Version Negotiation Example ===');

  // Define client-side transaction model
  interface ClientTransaction {
    id: string;
    sourceAccountId: string;
    destinationAccountId: string;
    amount: number;
    currency: string;
    status: 'pending' | 'completed' | 'failed';
    metadata: Record<string, any>;
    createdAt: Date;
  }

  // Define API v1 transaction model
  interface ApiV1Transaction {
    transaction_id: string;
    source_account: string;
    destination_account: string;
    amount: number;
    currency: string;
    status: string;
    metadata: string; // JSON string in v1
    created_at: string;
  }

  // Define API v2 transaction model
  interface ApiV2Transaction {
    id: string;
    source: {
      account_id: string;
    };
    destination: {
      account_id: string;
    };
    amount: {
      value: number;
      currency: string;
    };
    status: string;
    metadata: Record<string, any>; // Object in v2
    timestamps: {
      created_at: string;
      updated_at?: string;
    };
  }

  // Create v1 transformer
  const transactionV1Transformer = createModelTransformer<ClientTransaction, ApiV1Transaction>(
    // Client to API v1
    (clientTx: ClientTransaction): ApiV1Transaction => ({
      transaction_id: clientTx.id,
      source_account: clientTx.sourceAccountId,
      destination_account: clientTx.destinationAccountId,
      amount: clientTx.amount,
      currency: clientTx.currency,
      status: clientTx.status,
      metadata: JSON.stringify(clientTx.metadata),
      created_at: clientTx.createdAt.toISOString(),
    }),

    // API v1 to Client
    (apiTx: ApiV1Transaction): ClientTransaction => ({
      id: apiTx.transaction_id,
      sourceAccountId: apiTx.source_account,
      destinationAccountId: apiTx.destination_account,
      amount: apiTx.amount,
      currency: apiTx.currency,
      status: apiTx.status as any,
      metadata: JSON.parse(apiTx.metadata),
      createdAt: new Date(apiTx.created_at),
    })
  );

  // Create v2 transformer
  const transactionV2Transformer = createModelTransformer<ClientTransaction, ApiV2Transaction>(
    // Client to API v2
    (clientTx: ClientTransaction): ApiV2Transaction => ({
      id: clientTx.id,
      source: {
        account_id: clientTx.sourceAccountId,
      },
      destination: {
        account_id: clientTx.destinationAccountId,
      },
      amount: {
        value: clientTx.amount,
        currency: clientTx.currency,
      },
      status: clientTx.status,
      metadata: clientTx.metadata,
      timestamps: {
        created_at: clientTx.createdAt.toISOString(),
        updated_at: new Date().toISOString(),
      },
    }),

    // API v2 to Client
    (apiTx: ApiV2Transaction): ClientTransaction => ({
      id: apiTx.id,
      sourceAccountId: apiTx.source.account_id,
      destinationAccountId: apiTx.destination.account_id,
      amount: apiTx.amount.value,
      currency: apiTx.amount.currency,
      status: apiTx.status as any,
      metadata: apiTx.metadata,
      createdAt: new Date(apiTx.timestamps.created_at),
    })
  );

  // Create version transformer factory
  const transactionTransformerFactory = createVersionTransformerFactory<ClientTransaction>({
    v1: transactionV1Transformer,
    v2: transactionV2Transformer,
  });

  // Simulate API client with version negotiation
  class ApiClient {
    private apiVersion: string;
    private transformer: any;

    constructor(preferredVersion = 'v2') {
      // Simulate version negotiation with server
      this.apiVersion = this.negotiateVersion(preferredVersion);
      this.transformer = transactionTransformerFactory.getTransformer(this.apiVersion);

      console.log(`API Client initialized with version: ${this.apiVersion}`);
    }

    // Simulate version negotiation
    private negotiateVersion(preferredVersion: string): string {
      // Simulate server supporting only v1 and v2
      const supportedVersions = ['v1', 'v2'];

      if (supportedVersions.includes(preferredVersion)) {
        return preferredVersion;
      }

      // Fall back to latest supported version
      console.log(`Preferred version ${preferredVersion} not supported, falling back to v2`);
      return 'v2';
    }

    // Simulate creating a transaction
    async createTransaction(transaction: ClientTransaction): Promise<ClientTransaction> {
      // Transform client model to API model for the current version
      const apiTransaction = transformRequest(this.transformer, transaction);

      console.log(`Sending ${this.apiVersion} transaction to API:`, apiTransaction);

      // Simulate API response (in real code, this would be a fetch/axios call)
      const apiResponse = this.simulateApiResponse(apiTransaction);

      // Transform API response back to client model
      return transformResponse(this.transformer, apiResponse) as ClientTransaction;
    }

    // Simulate API response based on version
    private simulateApiResponse(request: any): any {
      // Add server-generated fields
      if (this.apiVersion === 'v1') {
        return {
          ...request,
          transaction_id: request.transaction_id || `tx-${Date.now()}`,
          status: 'pending',
          created_at: new Date().toISOString(),
        };
      } else {
        return {
          ...request,
          id: request.id || `tx-${Date.now()}`,
          status: 'pending',
          timestamps: {
            created_at: new Date().toISOString(),
            updated_at: null,
          },
        };
      }
    }
  }

  // Example transaction
  const transaction: ClientTransaction = {
    id: '', // Empty ID, will be generated by server
    sourceAccountId: 'acc-123',
    destinationAccountId: 'acc-456',
    amount: 500,
    currency: 'USD',
    status: 'pending',
    metadata: {
      purpose: 'Monthly rent',
      category: 'Housing',
    },
    createdAt: new Date(),
  };

  // Create API clients with different version preferences
  const clientV1 = new ApiClient('v1');
  const clientV2 = new ApiClient('v2');
  const clientV3 = new ApiClient('v3'); // Unsupported version

  // Simulate creating transactions with different clients
  console.log('\nCreating transaction with V1 client:');
  clientV1.createTransaction(transaction).then((result) => {
    console.log('Transaction created:', result);
  });

  console.log('\nCreating transaction with V2 client:');
  clientV2.createTransaction(transaction).then((result) => {
    console.log('Transaction created:', result);
  });

  console.log('\nCreating transaction with V3 client (falls back to V2):');
  clientV3.createTransaction(transaction).then((result) => {
    console.log('Transaction created:', result);
  });
}

// Example 5: Identity Transformer for Backward Compatibility
function identityTransformerExample() {
  console.log('\n=== Identity Transformer for Backward Compatibility Example ===');

  // Define client-side notification model
  interface ClientNotification {
    id: string;
    userId: string;
    type: 'email' | 'sms' | 'push';
    message: string;
    isRead: boolean;
    createdAt: Date;
  }

  // Define specific union type for notification types
  type NotificationType = 'email' | 'sms' | 'push';

  // Define API v1 notification model (identical to client model)
  interface ApiV1Notification {
    id: string;
    userId: string;
    type: string;
    message: string;
    isRead: boolean;
    createdAt: string; // Only difference is Date vs string
  }

  // Define API v2 notification model (with changes)
  interface ApiV2Notification {
    id: string;
    recipient: {
      userId: string;
    };
    channel: NotificationType; // 'email', 'sms', 'push'
    content: {
      message: string;
      template?: string;
    };
    status: {
      read: boolean;
      delivered: boolean;
    };
    createdAt: string;
  }

  // Create v1 transformer (mostly identity with Date conversion)
  const notificationV1Transformer = createModelTransformer<ClientNotification, ApiV1Notification>(
    // Client to API v1
    (clientNotif: ClientNotification): ApiV1Notification => ({
      ...clientNotif,
      createdAt: clientNotif.createdAt.toISOString(),
    }),

    // API v1 to Client
    (apiNotif: ApiV1Notification): ClientNotification => ({
      id: apiNotif.id,
      userId: apiNotif.userId,
      type: apiNotif.type as NotificationType,
      message: apiNotif.message,
      isRead: apiNotif.isRead,
      createdAt: new Date(apiNotif.createdAt),
    })
  );

  // Create v2 transformer (with significant changes)
  const notificationV2Transformer = createModelTransformer<ClientNotification, ApiV2Notification>(
    // Client to API v2
    (clientNotif: ClientNotification): ApiV2Notification => ({
      id: clientNotif.id,
      recipient: {
        userId: clientNotif.userId,
      },
      channel: clientNotif.type,
      content: {
        message: clientNotif.message,
      },
      status: {
        read: clientNotif.isRead,
        delivered: true,
      },
      createdAt: clientNotif.createdAt.toISOString(),
    }),

    // API v2 to Client
    (apiNotif: ApiV2Notification): ClientNotification => ({
      id: apiNotif.id,
      userId: apiNotif.recipient.userId,
      type: apiNotif.channel as any,
      message: apiNotif.content.message,
      isRead: apiNotif.status.read,
      createdAt: new Date(apiNotif.createdAt),
    })
  );

  // Create v3 using identity transformer (future version not yet implemented)
  const notificationV3Transformer = createIdentityTransformer<ClientNotification>();

  // Create version transformer factory with all versions
  const notificationTransformerFactory = createVersionTransformerFactory<ClientNotification>(
    {
      v1: notificationV1Transformer,
      v2: notificationV2Transformer,
      v3: notificationV3Transformer, // Identity transformer for future compatibility
    },
    'v2'
  ); // v2 is the default version

  // Example notification
  const clientNotification: ClientNotification = {
    id: 'notif-123',
    userId: 'user-456',
    type: 'email',
    message: 'Your order has been shipped!',
    isRead: false,
    createdAt: new Date(),
  };

  console.log('Original Client Notification:');
  console.log(clientNotification);

  // Transform to different API versions
  const v1Transformer = notificationTransformerFactory.getTransformer('v1');
  const v2Transformer = notificationTransformerFactory.getTransformer('v2');
  const v3Transformer = notificationTransformerFactory.getTransformer('v3');

  const apiV1Notification = v1Transformer.toApiModel(clientNotification);
  const apiV2Notification = v2Transformer.toApiModel(clientNotification);
  const apiV3Notification = v3Transformer.toApiModel(clientNotification);

  console.log('\nTransformed to API V1 Format:');
  console.log(apiV1Notification);

  console.log('\nTransformed to API V2 Format:');
  console.log(apiV2Notification);

  console.log('\nTransformed to API V3 Format (identity transformer):');
  console.log(apiV3Notification);

  // Demonstrate backward compatibility
  console.log('\nDemonstrating backward compatibility:');

  // Simulate receiving a v3 response that has the same structure as client model
  const v3Response = {
    id: 'notif-789',
    userId: 'user-456',
    type: 'push',
    message: 'New login detected',
    isRead: false,
    createdAt: new Date().toISOString(),
  };

  // Even though we don't have a specific v3 transformer implementation,
  // the identity transformer allows us to handle this response
  const fromV3 = v3Transformer.toClientModel(v3Response as any);

  console.log('V3 Response transformed to client model:');
  console.log(fromV3);
}

// Run the examples
function runExamples() {
  try {
    basicModelTransformationExample();
    versionSpecificTransformersExample();
    apiResponseTransformExample();
    apiVersionNegotiationExample();
    identityTransformerExample();
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Execute if this file is run directly
if (require.main === module) {
  runExamples();
}
