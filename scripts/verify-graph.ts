import assert from 'node:assert/strict';
import { assertConfidence, assertExclusiveTarget } from '../src/lib/graph/contracts';

assert.doesNotThrow(() => assertConfidence(0));
assert.doesNotThrow(() => assertConfidence(1));
assert.throws(() => assertConfidence(-0.01), /between 0 and 1/);
assert.throws(() => assertConfidence(1.01), /between 0 and 1/);
assert.throws(() => assertConfidence(Number.NaN), /between 0 and 1/);

assert.doesNotThrow(() => assertExclusiveTarget('entity-id', undefined, 'invalid'));
assert.doesNotThrow(() => assertExclusiveTarget(undefined, { value: true }, 'invalid'));
assert.throws(() => assertExclusiveTarget(undefined, undefined, 'exactly one'), /exactly one/);
assert.throws(() => assertExclusiveTarget('entity-id', { value: true }, 'exactly one'), /exactly one/);

console.log('Meridian graph invariant verification passed');
