const NATS = require('nats');
const nc = NATS.connect('nats://' + (process.env.NATS_IP || process.env.MASTER_IP || '127.0.0.1') + ':4222', {json: true});
const TestSuite = require('./TestSuite');
const substrateMgr = require('./SubstrateManager');
const test = new TestSuite();
const os = require('os');
const localKey = test.getKeypair(os.hostname());
const { spawn } = require('child_process');
const path = require('path');
const Redis = require('ioredis');
const redis = new Redis(6379, process.env.MASTER_IP || '127.0.0.1');

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
    nc.subscribe('spread.done', function(balance) {

        console.log('spread.done', balance);
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

                instance.queryBalanceUntil(localKey.address, balance, (isBalanceOK) => {

                    if(!isBalanceOK){
                        process.stderr.write(`BALANCE NOT FOUND FOR ADDRESS ${localKey.address}` + "\n");
                        return process.exit();
                    }

                    //BALANCE OK
                    nc.publish('node.balanceOK', {
                        address: localKey.address,
                        totalNodes: process.env.TOTAL_NODES || 1,
                        balance: balance
                    });
                }, null, 60 * 1000);

                //WHEN WEALTH SPREAD WAS DONE, WE SHOULD HAVE MONEY ON THIS ADDRESS
                nc.subscribe('speedtest.start', function() {
                    console.log('szpidteszt on!');

                    const clustered = spawn('node', [ __dirname + path.sep + 'speedtest.js' ]);

                    clustered.stdout.on('data', (data) => {
                        console.log(`${data}`.trim());
                    });

                    clustered.stderr.on('data', (data) => {
                        console.log(`STDERR: ${data}`);
                    });

                    clustered.on('close', (code) => {
                        console.log(`child process exited with code ${code}`);
                    });

                    //SUBSCRIBE IN REDIS FOR THE TX CLUSTER FINISH
                    redis.subscribe('cluster.done', function() {

                        //UPON RECEIVING THIS EVENT
                        redis.on("message", function(channel, message) {
                            if(channel === 'cluster.done'){

                                //PUBLISH IN NATS THAT THIS NODE HAS DONE TESTING
                                nc.publish('speedtest.finished', {
                                    address: localKey.address,
                                    totalNodes: process.env.TOTAL_NODES || 1
                                });
                            }
                        });
                    });
                });
            });
        });
    });
});
