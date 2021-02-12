import * as assert from 'assert';
import {isLogObject} from '../../stripeLogsView';

suite('stripeLogsView', () => {
  suite('isLogObject', () => {
    test('returns true when all fields exist and are the correct type', () => {
      const object: any = {
        status: 200,
        method: 'POST',
        url: '/v1/checkout',
        request_id: 'req_123',
      };
      assert.strictEqual(isLogObject(object), true);
    });

    test('returns false when required field is undefined', () => {
      const object: any = {
        status: 200,
        method: 'POST',
        url: '/v1/checkout',
      };
      assert.strictEqual(isLogObject(object), false);
    });

    test('returns false when required field is null', () => {
      const object: any = {
        status: 200,
        method: 'POST',
        url: '/v1/checkout',
        request_id: null,
      };
      assert.strictEqual(isLogObject(object), false);
    });

    test('returns false when a field is the wrong type', () => {
      const object: any = {
        status: '200',
        method: 'POST',
        url: '/v1/checkout',
        request_id: 'req_123',
      };
      assert.strictEqual(isLogObject(object), false);
    });

    test('returns false when not an object', () => {
      const object: any = 'a string';
      assert.strictEqual(isLogObject(object), false);
    });
  });
});
