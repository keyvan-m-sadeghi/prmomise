const states = {
    pending: 'Pending',
    resolved: 'Resolved',
    rejected: 'Rejected'
};

class Prmomise {
    constructor(executor) {
        this.state = states.pending;
        this.trailingInvocations = {
            [states.resolved]: [],
            [states.rejected]: []
        };
        const getCallback = state => value => {
            this.value = value;
            this.state = state;
            for (const [cachedCallback, trailingInvocation] of this.trailingInvocations[state]) {
                cachedCallback(trailingInvocation(this.value));
            }
        };
    
        try {
            executor(getCallback(states.resolved), getCallback(states.rejected));
        } catch (error) {
            getCallback(states.rejected)(error);
        }
    }

    then(onFulfilled) {
        return new Promise(resolve => {
            this.trailingInvocations[states.resolved].push([resolve, onFulfilled])
        });
    }
}

module.exports = {Prmomise, states};
