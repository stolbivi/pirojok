// tests/calculator.spec.tx
import { assert } from 'chai';
import { createAction } from '../../src/chrome/Messages';

describe('Messages', () => {
  it('Should create an action with handler', () => {
    const handler = () => Promise.resolve();
    const action1 = createAction<{}, void>('action1', handler);
    assert.equal(action1.type, 'action1');
  });
});