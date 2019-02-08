const states = {
	pending: 'Pending',
	resolved: 'Resolved',
	rejected: 'Rejected'
};

class Nancy {
	constructor(executor) {
		const trailingInvocations = [];
		const addTrailingInvocation = ({cachedCallback, cachedHandler, omitOn}) => trailingInvocations
			.push({cachedCallback, cachedHandler, omitOn});
		const runTrailingInvocations = () => {
			for (const {cachedCallback, cachedHandler, omitOn} of trailingInvocations) {
				if (omitOn === this.state) {
					cachedCallback(this);
				} else {
					cachedCallback(cachedHandler(this.value));
				}
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
				then: onFulfilled => new Nancy(resolve => addTrailingInvocation({
					cachedCallback: resolve,
					cachedHandler: onFulfilled,
					omitOn: states.rejected
				})),
				catch: onRejected => new Nancy(resolve => addTrailingInvocation({
					cachedCallback: resolve,
					cachedHandler: onRejected,
					omitOn: states.resolved
				}))
			}
		};
		const changeState = state => Object.assign(this, members[state]);
		const getCallback = state => value => {
			const apply = (value, state) => {
				this.value = value;
				changeState(state);
				runTrailingInvocations();
			};
			if (value instanceof Nancy) {
				value.then(value => apply(value, states.resolved));
				value.catch(value => apply(value, states.rejected));
			} else {
				apply(value, state);
			}
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
