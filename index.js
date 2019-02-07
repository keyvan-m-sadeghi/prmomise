const states = {
	pending: 'Pending',
	resolved: 'Resolved',
	rejected: 'Rejected'
};

class Nancy {
	constructor(executor) {
		this.state = states.pending;
		const trailingInvocations = {
			[states.resolved]: [],
			[states.rejected]: []
		};
		this.addTrailingInvocation = (state, cachedCallback, cachedHandler) => trailingInvocations[state]
			.push([cachedCallback, cachedHandler]);
		const getCallback = state => value => {
			this.value = value;
			this.state = state;
			for (const [cachedCallback, cachedHandler] of trailingInvocations[state]) {
				const invoke = () => cachedCallback(cachedHandler(this.value));
				if (this.value instanceof Nancy) {
					this.value.then(invoke);
				} else {
					invoke();
				}
			}
		};

		try {
			executor(getCallback(states.resolved), getCallback(states.rejected));
		} catch (error) {
			getCallback(states.rejected)(error);
		}
	}

	static resolve(value) {
		return new Nancy(resolve => resolve(value));
	}

	static reject(value) {
		return new Nancy((resolve, reject) => reject(value));
	}

	then(onFulfilled) {
		if (this.state === states.resolved) {
			return new Nancy(resolve => resolve(onFulfilled(this.value)));
		}

		return new Nancy(resolve => this.addTrailingInvocation(states.resolved, resolve, onFulfilled));
	}

	catch(onRejected) {
		if (this.state === states.rejected) {
			return new Nancy(resolve => resolve(onRejected(this.value)));
		}

		return new Nancy(resolve => this.addTrailingInvocation(states.rejected, resolve, onRejected));
	}
}

module.exports = {Nancy, states};
