const NATS = require('nats');
const nc = NATS.connect('nats://' + (process.env.NATS_IP || process.env.MASTER_IP || '127.0.0.1') + ':4222', {json: true});
const TestSuite = require('./TestSuite');
const substrateMgr = require('./SubstrateManager');
const test = new TestSuite();
const os = require('os');
const localKey = test.getKeypair(os.hostname());

process.on('SIGINT', () => {
    console.log('shutting down SUBSTRATE...');
    substrateMgr.down().then(() => {
        console.log('SUBSTRATE shutdown complete.');
        process.exit();
    });
});

nc.on('connect', function() {

    console.log('NATS CONNECTED!');

    nc.on('error', function(err) {
        console.log(err);
        process.exit();
    });

    //REGISTER NODE
    nc.publish('node.register', {
        address: localKey.address,
        totalNodes: process.env.TOTAL_NODES || 1
    });

    //WHEN WEALTH SPREAD WAS DONE, WE SHOULD HAVE MONEY ON THIS ADDRESS
    nc.subscribe('spread.done', function(amount) {

        console.log('ittten', amount);
        //BRING UP LOCAL SUBSTRATE NODE
        substrateMgr.up().then(nodeId => {
            console.log(nodeId);
            //PUBLISH NODE ID
            nc.publish('node.id', {
                address: localKey.address,
                nodeId: nodeId
            });

            //INIT TEST SUITE (CONNECT TO LOCAL NODE RPC)
            test.init().then(instance => {

                instance.queryBalanceUntil(localKey.address, amount, (isBalanceOK) => {

                    if(!isBalanceOK){
                        process.stderr.write(`BALANCE NOT FOUND FOR ADDRESS ${localKey.address}` + "\n");
                        return process.exit();
                    }

                    //BALANCE OK
                    nc.publish('node.balanceOK', {
                        address: localKey.address,
                        totalNodes: process.env.TOTAL_NODES || 1,
                        balance: amount
                    });
                }, 60 * 1000);
            });
        });
    });

    //WHEN WEALTH SPREAD WAS DONE, WE SHOULD HAVE MONEY ON THIS ADDRESS
    nc.subscribe('speedtest.start', function() {
        console.log('RUN DA TEST!!!!!');
    });
});
