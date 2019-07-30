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

    api.query.system.accountNonce(localKey.address).then(rawNonce => {

        let nonce = new BN(rawNonce.toString());
        for (let i = 0; i < 100; i++) {
            const transfer = api.tx.balances.transfer(test.accounts[0], 500);
            transfer.signAndSend(localKey, {
                nonce
            });
            nonce = nonce.add(new BN(1));
        }
        process.stdout.write('FINISHED');
        setTimeout(() => {
            process.exit();
        }, 60 * 1000);
    });

});
