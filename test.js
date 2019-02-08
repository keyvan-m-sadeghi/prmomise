import test from 'ava';
import {asyncCounter} from 'async-counter';
import {Nancy, states} from '.';

test('empty executor results in a pending promise', t => {
	const p = new Nancy(() => {});
	t.is(p.state, states.pending);
});

test('simple resolve works', t => {
	const p = Nancy.resolve(42);
	t.is(p.state, states.resolved);
	t.is(p.value, 42);
});

test('simple reject works', t => {
	const p = Nancy.reject(42);
	t.is(p.state, states.rejected);
	t.is(p.value, 42);
});

test('error thrown during resolve execution results in a rejected promise', t => {
	const p = new Nancy(() => {
		throw new Error('Something went wrong...');
	});
	t.is(p.state, states.rejected);
});

test.cb('chain then sync', t => {
	Nancy.resolve(0)
		.then(value => {
			t.is(value, 0);
			return 1;
		})
		.then(value => {
			t.is(value, 1);
			return 2;
		})
		.then(value => {
			t.is(value, 2);
			t.end();
		});
});

test.cb('chain catch sync', t => {
	Nancy.reject(42)
		.catch(error => error)
		.then(value => t.is(value, 42))
		.then(() => Nancy.reject(24))
		.then(() => 'I can be anything because I never get called!')
		.catch(value => t.is(value, 24))
		.then(() => t.end());
});

const delay = (v) => new Nancy(resolve => setTimeout(resolve, 500)).then(()=>v);

test.cb('chain then async', t => {
	debugger
	// Nancy.resolve(34)
	delay()
		.then(delay)
		.then(delay)
		.then(() => t.end());
});

TODO
test.cb('chain catch async', t => {
	delay()
		.then(delay)
		.then(delay)
		.then(() => t.end());
});

test.cb('multiple then on single promise', t => {
	const counter = asyncCounter(4, {onFinished: () => t.end()});
	const p = Nancy.resolve();
	p.then(counter.count);
	p.then(counter.count);
	p.then(counter.count);
	p.then(delay).then(counter.count);
});

test.cb('multiple catch on single promise', t => {
	const counter = asyncCounter(4, {onFinished: () => t.end()});
	const p = Nancy.reject();
	p.catch(counter.count);
	p.catch(counter.count);
	p.catch(counter.count);
	p.catch(delay).then(counter.count);
});
