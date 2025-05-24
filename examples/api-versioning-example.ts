/**
 * Midaz SDK API Versioning Example
 * 
 * This example demonstrates how to use the SDK with different API versions
 * and how to create version-specific transformers.
 */

import { 
  createModelTransformer,
  createSandboxConfig,
  createVersionTransformerFactory,
  MidazClient
} from '../src';

// Example model interfaces for different versions
interface Transaction {
  id: string;
  description: string;
  amount: number;
  currency: string;
  timestamp: string;
}

// Example API models for different versions
interface TransactionApiV1 {
  id: string;
  description: string;
  amount: number;
  currency: string;
  createdAt: string;
}

interface TransactionApiV2 {
  id: string;
  description: string;
  amount: {
    value: number;
    currency: string;
  };
  metadata: {
    createdAt: string;
  };
}

async function main() {
  // PART 1: Using different API versions in the client

  // Create a client using API v1 (default)
  const v1Client = new MidazClient(
    createSandboxConfig('your-api-key')
  );

  // Create a client using API v2
  const v2Client = new MidazClient(
    createSandboxConfig('your-api-key', 'v2')
  );

  // You can check which version a client is using
  console.log(`v1Client API Version: ${v1Client.getConfig().apiVersion}`);
  console.log(`v2Client API Version: ${v2Client.getConfig().apiVersion}`);

  // PART 2: Creating version-specific transformers

  // Create transformers for different API versions
  const v1Transformer = createModelTransformer<Transaction, TransactionApiV1>(
    // Client to API transformation (for requests)
    (transaction: Transaction): TransactionApiV1 => ({
      id: transaction.id,
      description: transaction.description,
      amount: transaction.amount,
      currency: transaction.currency,
      createdAt: transaction.timestamp,
    }),
    // API to client transformation (for responses)
    (apiTransaction: TransactionApiV1): Transaction => ({
      id: apiTransaction.id,
      description: apiTransaction.description,
      amount: apiTransaction.amount,
      currency: apiTransaction.currency,
      timestamp: apiTransaction.createdAt,
    })
  );

  // V2 transformer handles the structural changes in the API model
  const v2Transformer = createModelTransformer<Transaction, TransactionApiV2>(
    // Client to API transformation (for requests)
    (transaction: Transaction): TransactionApiV2 => ({
      id: transaction.id,
      description: transaction.description,
      amount: {
        value: transaction.amount,
        currency: transaction.currency,
      },
      metadata: {
        createdAt: transaction.timestamp,
      },
    }),
    // API to client transformation (for responses)
    (apiTransaction: TransactionApiV2): Transaction => ({
      id: apiTransaction.id,
      description: apiTransaction.description,
      amount: apiTransaction.amount.value,
      currency: apiTransaction.amount.currency,
      timestamp: apiTransaction.metadata.createdAt,
    })
  );

  // Create a version-specific transformer factory
  const transactionTransformerFactory = createVersionTransformerFactory({
    v1: v1Transformer,
    v2: v2Transformer,
  });

  // PART 3: Using the transformers based on client version

  // Function to get the appropriate transformer for a client's API version
  function getTransformerForClient(client: MidazClient) {
    return transactionTransformerFactory.getTransformer(
      client.getConfig().apiVersion || 'v1'
    );
  }

  // Example transaction in client format
  const clientTransaction: Transaction = {
    id: 'tx_123',
    description: 'Example transaction',
    amount: 100.50,
    currency: 'USD',
    timestamp: new Date().toISOString(),
  };

  // Get the appropriate transformer for each client
  const v1ClientTransformer = getTransformerForClient(v1Client);
  const v2ClientTransformer = getTransformerForClient(v2Client);

  // Transform for API requests
  const v1ApiTransaction = v1ClientTransformer.toApiModel(clientTransaction);
  const v2ApiTransaction = v2ClientTransformer.toApiModel(clientTransaction);

  console.log('V1 API Transaction:', v1ApiTransaction);
  console.log('V2 API Transaction:', v2ApiTransaction);

  // Example API responses
  const v1ApiResponse: TransactionApiV1 = {
    id: 'tx_456',
    description: 'Response example',
    amount: 200.75,
    currency: 'EUR',
    createdAt: new Date().toISOString(),
  };

  const v2ApiResponse: TransactionApiV2 = {
    id: 'tx_789',
    description: 'Response example',
    amount: {
      value: 300.25,
      currency: 'GBP',
    },
    metadata: {
      createdAt: new Date().toISOString(),
    },
  };

  // Transform API responses to client format
  const clientTransactionFromV1 = v1ClientTransformer.toClientModel(v1ApiResponse);
  const clientTransactionFromV2 = v2ClientTransformer.toClientModel(v2ApiResponse);

  console.log('Client Transaction from V1 Response:', clientTransactionFromV1);
  console.log('Client Transaction from V2 Response:', clientTransactionFromV2);
}

// Run the example
main().catch(console.error);