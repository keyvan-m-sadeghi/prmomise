const states = {
	pending: 'Pending',
	resolved: 'Resolved',
	rejected: 'Rejected'
};

class NancyProxy {
	constructor(state, value, trailingInvocations = []) {
		this.state = state;
		this.value = value;
		this.trailingInvocations = trailingInvocations;
	}

	addTrailingInvocation(cachedCallback, cachedHandler) {
		this.trailingInvocations.push([cachedCallback, cachedHandler]);
	}

	runTrailingInvocations() {
		for (const [cachedCallback, cachedHandler] of this.trailingInvocations) {
			debugger
			cachedCallback(cachedHandler(this.value));
		}
	}

	then(onFulfilled) {
		throw new Error('Not implemented');
	}

	catch(onRejected) {
		throw new Error('Not implemented.');
	}
}

class NancyProxyPending extends NancyProxy {
	constructor() {
		super(states.pending);
	}

	toResolved(value) {
		return new NancyProxyResolved(value, this.trailingInvocations);
	}

	toRejected(value) {
		return new NancyProxyRejected(value, this.trailingInvocations);
	}

	then(onFulfilled) {
		return new Nancy(resolve => this.addTrailingInvocation(resolve, onFulfilled));
	}

	catch(onRejected) {
		return new Nancy(resolve => this.addTrailingInvocation(resolve, onRejected));
	}
}

class NancyProxyResolved extends NancyProxy {
	constructor(value, trailingInvocations) {
		super(states.resolved, value, trailingInvocations);
	}

	then(onFulfilled) {
		return Nancy.resolve(onFulfilled(this.value));
	}

	catch(onRejected) {
		return this;
	}
}

class NancyProxyRejected extends NancyProxy {
	constructor(value, trailingInvocations) {
		super(value, states.rejected, trailingInvocations);
	}

	then(onFulfilled) {
		return this;
	}

	catch(onRejected) {
		return Nancy.resolve(onRejected(this.value));
	}
}

class Nancy {
	constructor(executor) {
		this.proxy = new NancyProxyPending();
		const resolve = value => {
			debugger
			const newProxy = this.proxy.toResolved(value);
			this.proxy.runTrailingInvocations();
			this.proxy = newProxy;
		}
		const reject = value => {
			debugger
			this.proxy = this.proxy.toRejected(value);
			this.proxy.runTrailingInvocations();
		}
		try {
			executor(resolve, reject);
		} catch (error) {
			reject(error);
			console.error('(in promise) error:')
			console.error(error);
		}
	}

	get state() {
		return this.proxy.state;
	}

	get value() {
		return this.proxy.value;
	}

	static resolve(value) {
		return new Nancy(resolve => resolve(value));
	}

	static reject(value) {
		return new Nancy((resolve, reject) => reject(value));
	}

	then(onFulfilled = value => {}) {
		return this.proxy.then(onFulfilled);
	}

	catch(onRejected = value => {}) {
		return this.proxy.catch(onRejected);
	}
}

module.exports = {Nancy, states};
