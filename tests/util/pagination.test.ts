/**
 * @file Tests for pagination utilities
 */
import {
  fetchAllPages,
  fetchAllItems,
  paginateItems,
  Paginator,
} from '../../src/util/data/pagination';
import { ListOptions, ListResponse } from '../../src/models/common';

describe('Pagination Utilities', () => {
  // Mock data for testing
  const mockItems = [
    { id: 'item1', name: 'Item 1' },
    { id: 'item2', name: 'Item 2' },
    { id: 'item3', name: 'Item 3' },
    { id: 'item4', name: 'Item 4' },
    { id: 'item5', name: 'Item 5' },
    { id: 'item6', name: 'Item 6' },
    { id: 'item7', name: 'Item 7' },
    { id: 'item8', name: 'Item 8' },
    { id: 'item9', name: 'Item 9' },
    { id: 'item10', name: 'Item 10' },
  ];

  // Mock fetch function that simulates paginated API responses
  const createMockFetch = (pageSize = 3) => {
    return jest.fn((options: ListOptions): Promise<ListResponse<any>> => {
      const cursor = options.cursor ? parseInt(options.cursor, 10) : 0;
      const limit = options.limit || pageSize;
      const start = cursor;
      const end = Math.min(start + limit, mockItems.length);
      const items = mockItems.slice(start, end);
      const nextCursor = end < mockItems.length ? end.toString() : undefined;

      return Promise.resolve({
        items,
        meta: {
          limit,
          nextCursor,
          total: mockItems.length,
          count: items.length,
          prevCursor: cursor > 0 ? (start - limit).toString() : undefined,
        },
      });
    });
  };

  // Test 1: Paginator class
  describe('Paginator', () => {
    it('should fetch pages of items correctly', async () => {
      const mockFetch = createMockFetch(3);
      const paginator = new Paginator({
        fetchPage: mockFetch,
        pageSize: 3,
      });

      // First page
      const result1 = await paginator.next();
      expect(result1.done).toBe(false);
      expect(result1.value).toHaveLength(3);
      expect(result1.value[0].id).toBe('item1');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second page
      const result2 = await paginator.next();
      expect(result2.done).toBe(false);
      expect(result2.value).toHaveLength(3);
      expect(result2.value[0].id).toBe('item4');
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Third page
      const result3 = await paginator.next();
      expect(result3.done).toBe(false);
      expect(result3.value).toHaveLength(3);
      expect(result3.value[0].id).toBe('item7');
      expect(mockFetch).toHaveBeenCalledTimes(3);

      // Fourth page (last)
      const result4 = await paginator.next();
      expect(result4.done).toBe(false);
      expect(result4.value).toHaveLength(1);
      expect(result4.value[0].id).toBe('item10');
      expect(mockFetch).toHaveBeenCalledTimes(4);

      // No more pages
      const result5 = await paginator.next();
      expect(result5.done).toBe(true);
      expect(result5.value).toBeUndefined();
      expect(mockFetch).toHaveBeenCalledTimes(4); // No additional call
    });

    it('should respect maxItems limit', async () => {
      const mockFetch = createMockFetch(3);
      const paginator = new Paginator({
        fetchPage: mockFetch,
        pageSize: 3,
        maxItems: 5,
      });

      // First page
      const result1 = await paginator.next();
      expect(result1.done).toBe(false);
      expect(result1.value).toHaveLength(3);

      // Second page (should be the last due to maxItems)
      const result2 = await paginator.next();
      expect(result2.done).toBe(false);
      expect(result2.value).toHaveLength(3);

      // No more pages due to maxItems limit
      const result3 = await paginator.next();
      expect(result3.done).toBe(true);
      expect(result3.value).toBeUndefined();
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should respect maxPages limit', async () => {
      const mockFetch = createMockFetch(2);
      const paginator = new Paginator({
        fetchPage: mockFetch,
        pageSize: 2,
        maxPages: 2,
      });

      // First page
      const result1 = await paginator.next();
      expect(result1.done).toBe(false);
      expect(result1.value).toHaveLength(2);

      // Second page (should be the last due to maxPages)
      const result2 = await paginator.next();
      expect(result2.done).toBe(false);
      expect(result2.value).toHaveLength(2);

      // No more pages due to maxPages limit
      const result3 = await paginator.next();
      expect(result3.done).toBe(true);
      expect(result3.value).toBeUndefined();
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should call onPage callback for each page', async () => {
      const mockFetch = createMockFetch(3);
      const onPageMock = jest.fn();

      const paginator = new Paginator({
        fetchPage: mockFetch,
        pageSize: 3,
        onPage: onPageMock,
      });

      // Fetch all pages
      let result = await paginator.next();
      while (!result.done) {
        result = await paginator.next();
      }

      // Should have called onPage for each page (4 pages total)
      expect(onPageMock).toHaveBeenCalledTimes(4);
    });

    it('should reset the paginator state', async () => {
      const mockFetch = createMockFetch(5);
      const paginator = new Paginator({
        fetchPage: mockFetch,
        pageSize: 5,
      });

      // Fetch first page
      const result1 = await paginator.next();
      expect(result1.done).toBe(false);
      expect(result1.value).toHaveLength(5);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Reset paginator
      paginator.reset();

      // Fetch first page again
      const result2 = await paginator.next();
      expect(result2.done).toBe(false);
      expect(result2.value).toHaveLength(5);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  // Test 2: paginateItems function
  describe('paginateItems', () => {
    it('should iterate through all pages', async () => {
      const mockFetch = createMockFetch(3);
      const pages = paginateItems<any>({
        fetchPage: mockFetch,
        pageSize: 3,
      });

      const allPages: any[][] = [];
      for await (const page of pages) {
        allPages.push(page);
      }

      expect(allPages).toHaveLength(4);
      expect(allPages[0]).toHaveLength(3);
      expect(allPages[1]).toHaveLength(3);
      expect(allPages[2]).toHaveLength(3);
      expect(allPages[3]).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });

    it('should respect maxItems limit', async () => {
      const mockFetch = createMockFetch(3);
      const pages = paginateItems<any>({
        fetchPage: mockFetch,
        pageSize: 3,
        maxItems: 5,
      });

      const allPages: any[][] = [];
      for await (const page of pages) {
        allPages.push(page);
      }

      expect(allPages).toHaveLength(2);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  // Test 3: fetchAllItems function
  describe('fetchAllItems', () => {
    it('should fetch and combine all items', async () => {
      const mockFetch = createMockFetch(3);
      const allItems = await fetchAllItems({
        fetchPage: mockFetch,
        pageSize: 3,
      });

      expect(allItems).toHaveLength(10);
      expect(allItems[0].id).toBe('item1');
      expect(allItems[9].id).toBe('item10');
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });

    it('should respect maxItems limit', async () => {
      const mockFetch = createMockFetch(3);
      const allItems = await fetchAllItems({
        fetchPage: mockFetch,
        pageSize: 3,
        maxItems: 7,
      });

      expect(allItems).toHaveLength(9); // Will fetch 9 items because it completes the page
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should respect maxPages limit', async () => {
      const mockFetch = createMockFetch(3);
      const allItems = await fetchAllItems({
        fetchPage: mockFetch,
        pageSize: 3,
        maxPages: 2,
      });

      expect(allItems).toHaveLength(6);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});
