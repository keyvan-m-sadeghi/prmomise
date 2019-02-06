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
        executor(getCallback(states.resolved), getCallback(states.rejected));        
    }
}

module.exports = {Prmomise, states};
