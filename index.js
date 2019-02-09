const states = {
	pending: 'Pending',
	resolved: 'Resolved',
	rejected: 'Rejected'
};

class Nancy {
	constructor(executor) {
		const tailCalls = [];
		const members = {
			[states.resolved]: {
				state: states.resolved,
				then: onResolved => Nancy.try(() => onResolved(this.value)),
				catch: _ => this
			},
			[states.rejected]: {
				state: states.rejected,
				then: _ => this,
				catch: onRejected => Nancy.try(() => onRejected(this.value))
			},
			[states.pending]: {
				state: states.pending,
				then: onResolved => new Nancy(resolve => tailCalls.push({
					[states.resolved]: () => resolve(Nancy.try(() => onResolved(this.value))),
					[states.rejected]: () => resolve(this)
				})),
				catch: onRejected => new Nancy(resolve => tailCalls.push({
					[states.resolved]: () => resolve(this),
					[states.rejected]: () => resolve(Nancy.try(() => onRejected(this.value)))
				})),
			}
		};
		const changeState = state => Object.assign(this, members[state]);
		const getCallback = state => value => {
			const apply = (value, state) => {
				this.value = value;
				changeState(state);
				for (const tailCall of tailCalls) {
					tailCall[state]();
				}
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

	static try(callback) {
		return new Nancy(resolve => resolve(callback()));
	}
}

module.exports = {Nancy, states};
