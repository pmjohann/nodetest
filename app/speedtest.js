const TestSuite = require('./TestSuite');
const test = new TestSuite();
const os = require('os');
const localKey = test.getKeypair(os.hostname());

/////////////////////

const { ApiPromise, WsProvider } = require('@polkadot/api');
const BN = require('bn.js');

///////////

const provider = new WsProvider('ws://127.0.0.1:9944');


ApiPromise.create(provider).then(api => {

    api.query.system.accountNonce(localKey.address).then(rawNonce1 => {

        let nonce1 = new BN(rawNonce1.toString());
        for (let i = 0; i < 100; i++) {
            const transfer = api.tx.balances.transfer(test.accounts[0], 500);
            let nonce = nonce1;
            transfer.signAndSend(localKey, {
                nonce
            });
            nonce1 = nonce1.add(new BN(1));
        }
        process.stdout.write('FINISHED');
        setTimeout(() => {
            process.exit();
        }, 60 * 1000);
    });

});
