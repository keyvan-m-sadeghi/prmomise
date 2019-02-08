const states = {
	pending: 'Pending',
	resolved: 'Resolved',
	rejected: 'Rejected'
};

class Nancy {
	constructor(executor) {
		const trailingInvocations = [];
		const addTrailingInvocation = (cachedCallback, cachedHandler) => trailingInvocations
			.push([cachedCallback, cachedHandler]);
		const runTrailingInvocations = () => {
			for (const [cachedCallback, cachedHandler] of trailingInvocations) {
				cachedCallback(cachedHandler(this.value));
			}
		};

		const members = {
			[states.resolved]: {
				state: states.resolved,
				then: onFulfilled => Nancy.resolve(onFulfilled(this.value)),
				catch: _ => this
			},
			[states.rejected]: {
				state: states.rejected,
				then: _ => this,
				catch: onRejected => Nancy.resolve(onRejected(this.value))
			},
			[states.pending]: {
				state: states.pending,
				then: onFulfilled => new Nancy(resolve => addTrailingInvocation(resolve, onFulfilled)),
				catch: onRejected => new Nancy(resolve => addTrailingInvocation(resolve, onRejected))
			}
		};
		const changeState = state => Object.assign(this, members[state]);
		const getCallback = state => value => {
			this.value = value;
			changeState(state);
			runTrailingInvocations();
		};

		changeState(states.pending);
		const resolve = getCallback(states.resolved);
		const reject = getCallback(states.rejected);
		try {
			executor(resolve, reject);
		} catch (error) {
			reject(error);
			console.error('(in promise) error:');
			console.error(error);
		}
	}

	static resolve(value) {
		return new Nancy(resolve => resolve(value));
	}

	static reject(value) {
		return new Nancy((resolve, reject) => reject(value));
	}
}

module.exports = {Nancy, states};
