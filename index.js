const states = {
	pending: 'Pending',
	resolved: 'Resolved',
	rejected: 'Rejected'
};

class Proxy {
	constructor(value) {
		this.value = value;
		const trailingInvocations = [];
		this.addTrailingInvocation = (cachedCallback, cachedHandler) => trailingInvocations
			.push([cachedCallback, cachedHandler]);
		this.runTrailingInvocations = () => {
			for (const [cachedCallback, cachedHandler] of trailingInvocations) {
				cachedCallback(cachedHandler(value));
			}
		}
	}

	then(onFulfilled) {
		return new Nancy(resolve => this.addTrailingInvocation(resolve, onFulfilled));
	}

	catch(onRejected) {
		return new Nancy(resolve => this.addTrailingInvocation(resolve, onRejected));
	}
}

class ResolvedProxy extends Proxy {
	constructor(value) {
		super(value);
		this.state = states.resolved;
	}

	then(onFulfilled) {
		return Nancy.resolve(onFulfilled(this.value));
	}

	catch(onRejected) {
		return this;
	}
}

class RejectedProxy extends ResolvedProxy {
	constructor(value) {
		super(value);
		this.state = states.rejected;
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
		this.proxy = {
			state: states.pending
		};
		const getCallback = state => value => {
			if (value instanceof Nancy) {
				debugger
				value.then(value => {
					this.proxy = new ResolvedProxy(value);
				});
				value.catch(value => {
					this.proxy = new RejectedProxy(value);
				});
			} else if (state === states.resolved) {
				this.proxy = new ResolvedProxy(value);				
			} else if (state === states.rejected) {
				this.proxy = new RejectedProxy(value);
			} else {
				this.proxy = new Proxy(value);
				this.proxy.state = state;
			}
			this.proxy.runTrailingInvocations();
		};

		try {
			executor(getCallback(states.resolved), getCallback(states.rejected));
		} catch (error) {
			getCallback(states.rejected)(error);
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
