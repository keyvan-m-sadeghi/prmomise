import test from 'ava';
import {asyncCounter} from 'async-counter';
import {states} from '.';
import {Nancy} from '.';

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

const throwSomethingWrong = ()  => {
	throw new Error('Something went wrong...');
}

test('error thrown during resolve execution results in a rejected promise', t => {
	const p = new Nancy(throwSomethingWrong)
	t.is(p.state, states.rejected);
});

// // Check test suite against native promise
// const throwSomethingWrong = ()  => {
// 	throw new Error('Something went wrong...');
// }
// const Nancy = Promise;

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

const anything = () => console.log('I can be anything because I never get called!');

test.cb('chain catch sync', t => {
	Nancy.reject(42)
		.catch(error => error)
		.catch(anything)
		.then(value => t.is(value, 42))
		.then(() => Nancy.reject(24))
		.then(() => anything)
		.catch(value => t.is(value, 24))
		.then(throwSomethingWrong)
		.catch(throwSomethingWrong)
		.catch(() => t.end())
});

const delay = () => new Nancy(resolve => setTimeout(resolve, 500));

test.cb('chain then async', t => {
	delay()
		.then(delay)
		.then(delay)
		.then(() => t.end());
});

test.cb('chain catch async', t => {
	delay()
		.then(() => Nancy.reject())
		.catch(throwSomethingWrong)
		.catch(() => 42)
		.catch(anything)
		.then(value => t.is(value, 42))
		.then(delay)
		.then(throwSomethingWrong)
		.catch(() => t.end());
});

test.cb('multiple then on single promise', t => {
	const counter = asyncCounter(3, {onFinished: () => t.end()});
	const p = Nancy.resolve();
	p.then(counter.count);
	p.then(counter.count);
	p.then(delay).then(counter.count);
});

test.cb('multiple catch on single promise', t => {
	const counter = asyncCounter(3, {onFinished: () => t.end()});
	const p = delay()
		.then(() => Nancy.reject());
	p.then(anything)
	p.catch(counter.count);
	p.catch(counter.count);
	p.catch(delay).then(counter.count);
});
