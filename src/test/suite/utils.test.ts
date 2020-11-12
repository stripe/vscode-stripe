import * as assert from 'assert';
import * as utils from '../../utils';

suite("Utils", () => {
  const arr = [1, 2, 3];

  suite("findAsync", () => {
    test("Finds an item", async () => {
      const item = await utils.findAsync(arr, (value) => {
        return new Promise((resolve) => {
          resolve(value === 1);
        });
      });
      assert.strictEqual(item, 1);
    });

    test("Returns undefined when failing to find an item", async () => {
      const item = await utils.findAsync(arr, (value) => {
        return new Promise((resolve) => {
          resolve(value === 0);
        });
      });
      assert.strictEqual(item, undefined);
    });

    test("Returns undefined when searching an empty array", async () => {
      const item = await utils.findAsync([], (value) => {
        return new Promise((resolve) => {
          resolve(value === 0);
        });
      });
      assert.strictEqual(item, undefined);
    });
  });

  suite("filterAsync", () => {
    test("Filters an array", async () => {
      const items = await utils.filterAsync(arr, (value) => {
        return new Promise((resolve) => {
          resolve(value < 3);
        });
      });
      assert.deepStrictEqual(items, [1, 2]);
    });

    test("Returns empty array when all items fail the predicate", async () => {
      const item = await utils.filterAsync(arr, (value) => {
        return new Promise((resolve) => {
          resolve(value > 3);
        });
      });
      assert.deepStrictEqual(item, []);
    });

    test("Returns empty array when filtering an empty array", async () => {
      const item = await utils.filterAsync([], (value) => {
        return new Promise((resolve) => {
          resolve(value < 3);
        });
      });
      assert.deepStrictEqual(item, []);
    });
  });
});
