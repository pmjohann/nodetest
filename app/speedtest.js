const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const Redis = require('ioredis');
const redis = new Redis();
const TestSuite = require('./TestSuite');
const test = new TestSuite();
const os = require('os');
const localKey = test.getKeypair(os.hostname());

test.init().then(instance => {

    if (cluster.isMaster) {

        console.log(`Speedtest MASTER up. PID: ${process.pid}`);

        instance.getBalance(localKey.address).then(initialBalance => {

            //SET INITIAL BALANCE & NONCE
            redis.set(`${localKey.address}.balance`, initialBalance);
            redis.set(`${localKey.address}.nonce`, 0);

            //FORK TX WORKERS
            for (let i = 0; i < numCPUs / 2; i++) {
                cluster.fork();
            }

            //LISTEN FOR FINISHED MESSAGE
            for (const id in cluster.workers) {
                cluster.workers[id].on('message', (msg) => {
                    if (msg.cmd && msg.cmd === 'finished') {

                        //KILL EACH WORKER ONCE THE JOB IS FINISHED
                        for (const id in cluster.workers) {
                            cluster.workers[id].kill();
                        }

                        console.log('LAST NONCE:', msg.nonce);
                        redis.publish('cluster.done', msg.nonce);
                    }
                });
            }

            cluster.on('exit', (worker, code, signal) => {
                console.log(`worker ${worker.process.pid} died`);
            });
        })

    } else {
        console.log(`Speedtest WORKER up. PID: ${process.pid}`);

        run(instance, localKey, 500, (lastNonce) => {
            process.send({ cmd: 'finished', nonce: lastNonce });
        });
    }
});

function run(instance, localKey, amount, cb, i, millisec) {
    i = i ? i : 0;
    millisec = millisec ? millisec : 20;
    redis.get(`${localKey.address}.balance`).then(balance => {
        if (balance - amount > 5000) {
            redis.set(`${localKey.address}.balance`, balance - amount);

            redis.incr(`${localKey.address}.nonce`).then(nonce => {

                instance.transferRaw(localKey.address, instance.accounts[0], amount, nonce - 1).then((hash) => {
                    console.log(".\n\n" + process.pid + ' :: ' + hash + "\n" + `TX[${nonce - 1}]: ${localKey.address} => ${instance.accounts[0]} (${amount})`);
                });
                setTimeout(() => {

                    run(instance, localKey, amount, cb, i + 1, millisec);
                }, i + millisec);
            });
            return;
        }
        redis.get(`${localKey.address}.nonce`).then(lastNonce => {
            cb(lastNonce);
        });
    });
}

/*
function transfer2(instance) {

    const senders = {};
    const transfersPerAccount = 1;
    const amount = 1000000;


    let pendingCounter = 0;
    let completedCounter = 0;


    const recipient = instance.getKeypair('wealthy');

    return new Promise(resolve => {
        Object.keys(senders).forEach(sender => {
            const transfers = senders[sender];
            let delay = 0;
            transfers.forEach(amount => {
                delay += 300;
                setTimeout(() => {

                    instance.transfer(sender, recipient.address, amount).then(hash => {
                        console.log(`${sender} => ${recipient.address} (${amount}) :: ${hash}`);
                        completedCounter++;

                        console.log(`${completedCounter} / ${pendingCounter}`);
                        if (completedCounter === pendingCounter) {
                            resolve(completedCounter);
                        }
                    });
                }, delay);
            });
        });
    });
}
*/
