/**
 * Data Utility Example
 * 
 * This example demonstrates how to use the data utilities from the Midaz SDK
 * to handle pagination, format data, and transform models.
 */

import { BasePaginator, PaginationState, PaginatorConfig } from '../src/util/data/pagination-abstraction';
import { formatBalance } from '../src/util/data/formatting';
import { ListOptions, ListResponse } from '../src/models/common';
import { Observability } from '../src/util/observability';

// Simplified interfaces for the example
interface SimplePaginatorConfig<T> {
  fetchFunction: (options: any) => Promise<any>;
  limit: number;
}

// Custom paginator implementations for the example
class CursorPaginator<T> extends BasePaginator<T> {
  // Add missing properties needed for our implementation
  protected nextCursor?: string;
  protected prevCursor?: string;
  constructor(options: SimplePaginatorConfig<T>) {
    super({
      fetchPage: async (listOptions: ListOptions): Promise<ListResponse<T>> => {
        const response = await options.fetchFunction({
          cursor: listOptions.cursor,
          limit: listOptions.limit || options.limit
        });
        
        return {
          items: response.data,
          meta: {
            nextCursor: response.metadata?.cursor,
            prevCursor: undefined,
            total: response.data.length,
            count: response.data.length
          }
        };
      },
      initialOptions: {
        limit: options.limit
      }
    });
  }
  
  async next(): Promise<T[]> {
    // This is a simplified implementation for the example
    // In a real implementation, you would need more error handling and state management
    const state = this.getPaginationState();
    
    // Check if there are more pages
    if (!this.hasMorePages) {
      return [];
    }
    
    // Create options for the next page
    const options: ListOptions = {
      cursor: this.nextCursor,
      limit: this.config.initialOptions?.limit || 10
    };
    
    try {
      // Call the fetchPage method from the config
      const response = await this.config.fetchPage(options);
      
      // Store the current page
      this.currentPage = response.items;
      
      // Update pagination state
      this.nextCursor = response.meta.nextCursor;
      this.prevCursor = response.meta.prevCursor;
      this.hasMorePages = !!response.meta.nextCursor;
      this.itemsFetched += response.items.length;
      this.pagesFetched++;
      this.lastFetchTimestamp = Date.now();
      
      // Return the current page
      return this.currentPage;
    } catch (error) {
      console.error('Error fetching next page:', error);
      return [];
    }
  }
}

class OffsetPaginator<T> extends BasePaginator<T> {
  private offset = 0;
  // Add missing properties needed for our implementation
  protected nextCursor?: string;
  protected prevCursor?: string;
  
  constructor(options: SimplePaginatorConfig<T>) {
    super({
      fetchPage: async (listOptions: ListOptions): Promise<ListResponse<T>> => {
        const response = await options.fetchFunction({
          offset: this.offset,
          limit: listOptions.limit || options.limit
        });
        
        // Update offset for next page
        this.offset += (listOptions.limit || options.limit);
        
        // Calculate if there are more pages
        const total = response.metadata?.total || 0;
        const hasMore = this.offset < total;
        
        return {
          items: response.data,
          meta: {
            nextCursor: this.offset < total ? String(this.offset) : undefined,
            prevCursor: undefined,
            total,
            count: response.data.length
          }
        };
      },
      initialOptions: {
        limit: options.limit
      }
    });
  }
  
  // Override reset to also reset the offset
  public reset(): void {
    super.reset();
    this.offset = 0;
  }
  
  async next(): Promise<T[]> {
    // This is a simplified implementation for the example
    // In a real implementation, you would need more error handling and state management
    const state = this.getPaginationState();
    
    // Check if there are more pages
    if (!this.hasMorePages) {
      return [];
    }
    
    // Create options for the next page
    const options: ListOptions = {
      limit: this.config.initialOptions?.limit || 10
    };
    
    try {
      // Call the fetchPage method from the config
      const response = await this.config.fetchPage(options);
      
      // Store the current page
      this.currentPage = response.items;
      
      // Update pagination state
      this.nextCursor = response.meta.nextCursor;
      this.prevCursor = response.meta.prevCursor;
      this.hasMorePages = !!response.meta.nextCursor;
      this.itemsFetched += response.items.length;
      this.pagesFetched++;
      this.lastFetchTimestamp = Date.now();
      
      // Return the current page
      return this.currentPage;
    } catch (error) {
      console.error('Error fetching next page:', error);
      return [];
    }
  }
}

// Helper functions for formatting
function formatCurrency(value: number, currency: string): string {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency 
  }).format(value);
}

function formatDate(date: Date, format: string): string {
  if (format === 'short') {
    return date.toLocaleDateString();
  } else if (format === 'medium') {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  } else if (format === 'long') {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  } else if (format === 'iso') {
    return date.toISOString();
  } else {
    // Simple custom format implementation
    return date.toISOString().split('T')[0];
  }
}

function formatNumber(value: number, decimals: number = 2): string {
  return value.toFixed(decimals);
}

function formatPercentage(value: number, decimals: number = 2): string {
  return (value * 100).toFixed(decimals) + '%';
}

function transformModel<T>(source: any, mapping: Record<string, any>): T {
  const result: any = {};
  
  for (const [targetKey, sourceConfig] of Object.entries(mapping)) {
    if (typeof sourceConfig === 'string') {
      // Simple mapping
      result[targetKey] = source[sourceConfig];
    } else if (typeof sourceConfig === 'object' && sourceConfig !== null) {
      // Complex mapping with transformation
      const { key, transform } = sourceConfig;
      const sourceValue = source[key];
      result[targetKey] = transform ? transform(sourceValue) : sourceValue;
    }
  }
  
  return result as T;
}

// Example 1: Pagination with Cursor-based API
async function cursorPaginationExample() {
  console.log('\n=== Cursor Pagination Example ===');
  
  // Mock API function that returns paginated data with a cursor
  async function fetchUsers(cursor?: string, limit: number = 10): Promise<any> {
    // Simulate a database with 35 users
    const allUsers = Array.from({ length: 35 }, (_, i) => ({
      id: `user-${i + 1}`,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`
    }));
    
    // Determine the starting index based on the cursor
    let startIndex = 0;
    if (cursor) {
      const cursorIndex = allUsers.findIndex(user => user.id === cursor);
      startIndex = cursorIndex !== -1 ? cursorIndex + 1 : 0;
    }
    
    // Get the subset of users for this page
    const endIndex = Math.min(startIndex + limit, allUsers.length);
    const users = allUsers.slice(startIndex, endIndex);
    
    // Determine if there are more results
    const hasMore = endIndex < allUsers.length;
    
    // Return the paginated response
    return {
      data: users,
      metadata: {
        cursor: hasMore ? users[users.length - 1].id : undefined,
        hasMore
      }
    };
  }
  
  // Create a cursor paginator
  const userPaginator = new CursorPaginator<any>({
    fetchFunction: async (options: any) => {
      const response = await fetchUsers(options.cursor, options.limit);
      return {
        items: response.data,
        meta: {
          nextCursor: response.metadata.cursor,
          total: response.data.length,
          hasMore: response.metadata.hasMore
        }
      };
    },
    limit: 10
  });
  
  // Example 1.1: Get the first page
  console.log('Fetching first page...');
  const firstPage = await userPaginator.getCurrentPage();
  console.log(`Retrieved ${firstPage.length} users`);
  console.log('First user:', firstPage[0]);
  
  // Example 1.2: Check if there are more pages and get the next page
  if (await userPaginator.hasNext()) {
    console.log('\nFetching next page...');
    const secondPage = await userPaginator.next();
    console.log(`Retrieved ${secondPage.length} users`);
    console.log('First user on second page:', secondPage[0]);
  }
  
  // Example 1.3: Process each page with a callback
  console.log('\nProcessing all remaining pages...');
  await userPaginator.forEachPage(async (users: any[]) => {
    console.log(`Processing page with ${users.length} users`);
  });
  
  // Example 1.4: Reset and get all items at once
  console.log('\nResetting paginator and fetching all items...');
  userPaginator.reset();
  const allUsers = await userPaginator.getAllItems();
  console.log(`Retrieved all ${allUsers.length} users`);
}

// Example 2: Pagination with Offset-based API
async function offsetPaginationExample() {
  console.log('\n=== Offset Pagination Example ===');
  
  // Mock API function that returns paginated data with offset/limit
  async function fetchProducts(offset: number = 0, limit: number = 10): Promise<any> {
    // Simulate a database with 45 products
    const allProducts = Array.from({ length: 45 }, (_, i) => ({
      id: i + 1,
      name: `Product ${i + 1}`,
      price: 10 + Math.floor(Math.random() * 90)
    }));
    
    // Get the subset of products for this page
    const products = allProducts.slice(offset, offset + limit);
    
    // Return the paginated response
    return {
      data: products,
      metadata: {
        offset,
        limit,
        total: allProducts.length
      }
    };
  }
  
  // Create an offset paginator
  const productPaginator = new OffsetPaginator<any>({
    fetchFunction: async (options: any) => {
      const response = await fetchProducts(options.offset, options.limit);
      const hasMore = (options.offset + options.limit) < response.metadata.total;
      return {
        items: response.data,
        meta: {
          nextCursor: hasMore ? String(options.offset + options.limit) : undefined,
          total: response.metadata.total,
          hasMore
        }
      };
    },
    limit: 15
  });
  
  // Example 2.1: Get the first page
  console.log('Fetching first page...');
  const firstPage = await productPaginator.getCurrentPage();
  console.log(`Retrieved ${firstPage.length} products`);
  
  // Example 2.2: Process each item with a callback
  console.log('\nProcessing each item individually...');
  let processedCount = 0;
  
  // Only process the first 30 items to keep the example short
  await productPaginator.forEachItem(async (product: any) => {
    processedCount++;
    if (processedCount <= 3) {
      console.log(`Processing product: ${product.name} - $${product.price}`);
    } else if (processedCount === 4) {
      console.log('... (processing remaining items)');
    }
    
    // Stop after 30 items
    if (processedCount >= 30) {
      return Promise.reject(new Error('STOP_ITERATION'));
    }
  });
  
  console.log(`Processed ${processedCount} products`);
}

// Example 3: Data Formatting
function dataFormattingExample() {
  console.log('\n=== Data Formatting Example ===');
  
  // Example 3.1: Format currency
  const price = 1234.56;
  console.log(`Original price: ${price}`);
  console.log(`Formatted price (USD): ${formatCurrency(price, 'USD')}`);
  console.log(`Formatted price (EUR): ${formatCurrency(price, 'EUR')}`);
  console.log(`Formatted price (JPY): ${formatCurrency(price, 'JPY')}`);
  
  // Example 3.2: Format date
  const now = new Date();
  console.log(`\nOriginal date: ${now}`);
  console.log(`Formatted date (short): ${formatDate(now, 'short')}`);
  console.log(`Formatted date (medium): ${formatDate(now, 'medium')}`);
  console.log(`Formatted date (long): ${formatDate(now, 'long')}`);
  console.log(`Formatted date (ISO): ${formatDate(now, 'iso')}`);
  console.log(`Formatted date (custom): ${formatDate(now, 'YYYY-MM-DD HH:mm:ss')}`);
  
  // Example 3.3: Format numbers
  const number = 9876543.21;
  console.log(`\nOriginal number: ${number}`);
  console.log(`Formatted number (default): ${formatNumber(number)}`);
  console.log(`Formatted number (2 decimals): ${formatNumber(number, 2)}`);
  console.log(`Formatted number (0 decimals): ${formatNumber(number, 0)}`);
  
  // Example 3.4: Format percentages
  const percentage = 0.1234;
  console.log(`\nOriginal percentage: ${percentage}`);
  console.log(`Formatted percentage (default): ${formatPercentage(percentage)}`);
  console.log(`Formatted percentage (1 decimal): ${formatPercentage(percentage, 1)}`);
  console.log(`Formatted percentage (3 decimals): ${formatPercentage(percentage, 3)}`);
  
  // Example 3.5: Format balance (from SDK)
  const balance = 123456;
  const scale = 100;
  console.log(`\nOriginal balance: ${balance} (scale: ${scale})`);
  console.log(`Formatted balance: ${formatBalance(balance, scale)}`);
  console.log(`Formatted balance (USD): ${formatBalance(balance, scale, { currency: 'USD' })}`);
  console.log(`Formatted balance (EUR): ${formatBalance(balance, scale, { currency: 'EUR', locale: 'de-DE' })}`);
}

// Example 4: Model Transformation
function modelTransformationExample() {
  console.log('\n=== Model Transformation Example ===');
  
  // Example 4.1: Transform a model from API format to application format
  const apiUser = {
    user_id: '12345',
    first_name: 'John',
    last_name: 'Doe',
    email_address: 'john.doe@example.com',
    created_at: '2023-01-15T08:30:45Z',
    is_active: true,
    role_name: 'admin'
  };
  
  console.log('API User Model:', apiUser);
  
  // Define the transformation mapping
  const userTransformMap = {
    id: 'user_id',
    firstName: 'first_name',
    lastName: 'last_name',
    email: 'email_address',
    createdAt: {
      key: 'created_at',
      transform: (value: string) => new Date(value)
    },
    active: 'is_active',
    role: 'role_name'
  };
  
  // Transform the model
  const appUser = transformModel<any>(apiUser, userTransformMap);
  
  console.log('Transformed Application User Model:', appUser);
  
  // Example 4.2: Transform a nested model
  const apiOrder = {
    order_id: 'ORD-12345',
    order_date: '2023-05-20T14:25:30Z',
    customer: {
      customer_id: 'CUST-789',
      customer_name: 'Jane Smith',
      customer_email: 'jane.smith@example.com'
    },
    items: [
      {
        item_id: 'ITEM-1',
        item_name: 'Product A',
        quantity: 2,
        unit_price: 29.99
      },
      {
        item_id: 'ITEM-2',
        item_name: 'Product B',
        quantity: 1,
        unit_price: 49.99
      }
    ],
    total_amount: 109.97,
    status: 'shipped'
  };
  
  console.log('\nAPI Order Model:', apiOrder);
  
  // Define the transformation mapping for the order and nested objects
  const orderTransformMap = {
    id: 'order_id',
    date: {
      key: 'order_date',
      transform: (value: string) => new Date(value)
    },
    customer: {
      key: 'customer',
      transform: (customer: any) => ({
        id: customer.customer_id,
        name: customer.customer_name,
        email: customer.customer_email
      })
    },
    items: {
      key: 'items',
      transform: (items: any[]) => items.map(item => ({
        id: item.item_id,
        name: item.item_name,
        quantity: item.quantity,
        price: item.unit_price,
        subtotal: item.quantity * item.unit_price
      }))
    },
    total: 'total_amount',
    status: 'status'
  };
  
  // Transform the model
  const appOrder = transformModel<any>(apiOrder, orderTransformMap);
  
  console.log('Transformed Application Order Model:', appOrder);
}

// Run the examples
async function runExamples() {
  try {
    await cursorPaginationExample();
    await offsetPaginationExample();
    dataFormattingExample();
    modelTransformationExample();
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Execute if this file is run directly
if (require.main === module) {
  runExamples();
}
