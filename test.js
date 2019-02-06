import test from 'ava';
import {Prmomise, states} from './'

test('empty executor results in a pending promise', t => {
    const p = new Prmomise(() => {});
    t.is(p.state, states.pending);
});

test('simple resolve works', t => {
    const p = new Prmomise(resolve => resolve(2));
    t.is(p.state, states.resolved);
    t.is(p.value, 2);
});

test('simple reject works', t => {
    const p = new Prmomise((resolve, reject) => reject(2));
    t.is(p.state, states.rejected);
    t.is(p.value, 2);
});
