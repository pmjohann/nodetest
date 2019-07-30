module.exports = function(instance, localKey){
    return new Promise(resolve => {

        const totalTx = 100
        const amount = 500;
        let nonce = 0;
        let delay = 0;
        let processed = 0;

        const timeOut = setTimeout(() => {
            resolve();
        }, 60 * 1000);

        for (let i = 0; i < totalTx; i++) {
            setTimeout(() => {
                nonce++;
                console.log('TX START :: ', nonce - 1, (new Date()).getTime());
                instance.transferRaw(localKey.address, instance.accounts[0], amount, nonce - 1).then(hash => {
                    processed++;
                    console.log('TX DONE :: ', nonce - 1, (new Date()).getTime(), hash, `${processed} / ${totalTx}`);
                    if(processed === totalTx){
                        clearTimeout(timeOut);
                        resolve();
                    }
                });
            }, delay);
            delay += 25;
        }
    });
}
/*

ApiPromise.create(provider).then(api => {
    let delay = 0;
    api.query.system.accountNonce(localKey.address).then(rawNonce => {
        console.log(rawNonce);
        let nonce = parseInt(rawNonce.toString());
        for (let i = 0; i < 100; i++) {
            const transfer = api.tx.balances.transfer(test.accounts[0], 500);
            console.log('NONCE :: ', nonce);
            setTimeout(() => {
                transfer.signAndSend(localKey, {
                    nonce
                });
            }, delay);
            nonce++;
            delay += 200;
        }
        process.stdout.write('FINISHED');
        setTimeout(() => {
            process.exit();
        }, 60 * 1000);
    });

});

*/
