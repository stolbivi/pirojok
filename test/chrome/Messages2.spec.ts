// tests/calculator.spec.tx
import { assert } from 'chai';
import { createAction } from '../../src/chrome/MessagesV2';

describe('Messages2', () => {
  it('Should create an action with handler', () => {
    const handler = () => Promise.resolve();
    const action1 = createAction<{}, void>('action1', handler);
    assert.equal(action1.type, 'action1');



  });
});