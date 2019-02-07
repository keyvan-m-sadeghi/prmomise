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

test('error thrown during execution results in a rejected promise', t => {
    const p = new Prmomise(resolve => {
        throw new Error('Something went wrong...');
        resolve(2);
    });
    t.is(p.state, states.rejected);
});

const delay = () => new Prmomise(resolve => {
    setTimeout(resolve, 500);
    return t;
});

test.cb('multiple then on single promise', t => {
    const p = delay();
    p.then(() => console.log('1st then on promise!'));
    p.then(() => console.log('2nd then on promise!'));
    p.then(() => console.log('3rd then on promise!'));
    p.then(delay).then(t.end());
});

test.cb('can chain then async', t => {
    delay()
        .then(delay)
        .then(delay)
        .then(() => t.end())
});

test.cb('can chain then sync', t => {
    new Prmomise(resolve => resolve(2))
        .then(value => {
            t.is(value, 2);
            return 3;
        })
        .then(value => {
            t.is(value, 3);
            return 4;
        })
        .then(value => {
            t.is(value, 4);
            t.end();
        });
});
