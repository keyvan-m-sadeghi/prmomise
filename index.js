const states = {
    pending: 'Pending',
    resolved: 'Resolved',
    rejected: 'Rejected'
};

class Prmomise {
    constructor(executor) {
        this.state = states.pending;
        const getCallback = state => value => {
            this.value = value;
            this.state = state;
        };
    
        try {
            executor(getCallback(states.resolved), getCallback(states.rejected));
        } catch (error) {
            getCallback(states.rejected)(error);
        }
    }
}

module.exports = {Prmomise, states};
