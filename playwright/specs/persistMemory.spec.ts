/**
 * Test suite for the InMemoryProvider class.
 *
 * This suite verifies that add, list, get, update, and delete operations
 * work as expected for the in-memory persistence provider.
 *
 * These tests are purely in-memory and do not require browser or extension context.
 */

import { test, expect } from '@playwright/test';
import { InMemoryProvider } from '../../src/persistProviderInMemory';
import type { EntryProps } from '../../src/persistProvider';

test.describe('InMemoryProvider', () => {
    let provider: InMemoryProvider<EntryProps>;
    let uuid: string | null;

    test.beforeEach(() => {
        provider = new InMemoryProvider();
    });

    test('should add an entry', async () => {
        uuid = await provider.add({ uuid: 'test-uuid', data: 'foo' });
        expect(uuid).toBe('test-uuid');
    });

    test('should list entries', async () => {
        await provider.add({ uuid: 'test-uuid', data: 'foo' });
        const list = await provider.list();
        expect(list).not.toBeNull();
        expect(Array.isArray(list)).toBe(true);
        expect(list!.some(e => e.uuid === 'test-uuid')).toBe(true);
    });

    test('should get an entry by uuid', async () => {
        await provider.add({ uuid: 'test-uuid', data: 'foo' });
        const entry = await provider.get('test-uuid');
        expect(entry).not.toBeNull();
        expect(entry!.data).toBe('foo');
    });

    test('should update an entry', async () => {
        await provider.add({ uuid: 'test-uuid', data: 'foo' });
        const updatedUuid = await provider.update({ uuid: 'test-uuid', data: 'bar' });
        expect(updatedUuid).toBe('test-uuid');
        const entry = await provider.get('test-uuid');
        expect(entry!.data).toBe('bar');
    });

    test('should delete an entry', async () => {
        await provider.add({ uuid: 'test-uuid', data: 'foo' });
        const deletedUuid = await provider.delete('test-uuid');
        expect(deletedUuid).toBe('test-uuid');
        const entry = await provider.get('test-uuid');
        expect(entry).toBeNull();
    });

    test('should return null when deleting non-existent entry', async () => {
        const deletedUuid = await provider.delete('does-not-exist');
        expect(deletedUuid).toBeNull();
    });
});