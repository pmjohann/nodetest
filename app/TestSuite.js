const { ApiPromise } = require('@polkadot/api');
const keyring = require('@polkadot/keyring/testing');
const crypto = require('crypto');

const ALICE = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
const BOB = '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty';
const CHARLIE = '5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y';
const DAVE = '5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy';
const EVE = '5HGjWAeFDfFCWPsjFQdVV2Msvz2XtMktvgocEZcCj68kUMaw';
const FERDIE = '5CiPPseXPECbkjWCa6MnjNokrgYjMqmKndv2rSnekmSK2DjL';

class TestSuite{

    constructor(){
        this.api = null;
        this.accounts = [ ALICE, BOB, CHARLIE, DAVE, EVE, FERDIE ];
        this.keyring = keyring.default();
        this.nonces = {
            [ALICE]: 0,
            [BOB]: 0,
            [CHARLIE]: 0,
            [DAVE]: 0,
            [EVE]: 0,
            [FERDIE]: 0
        }
        this.balances = {
            [ALICE]: 1048000,
            [BOB]: 1048000,
            [CHARLIE]: 1048000,
            [DAVE]: 1048000,
            [EVE]: 1048000,
            [FERDIE]: 1048000
        }
        this.transfers = {

        }
    }

    init(){
        return new Promise(resolve => {
            console.log('Initializing TestSuite');
            ApiPromise.create().then(api => {
                console.log('Initialized TestSuite');
                this.api = api;
                resolve(this);
            });
        });
    }

    queryBalanceUntil(address, wantedBalance, cb, timeout){

        if(timeout){
            console.log('set tout');
            setTimeout(() => {
                console.log('tout fire');
                cb(false);
            }, timeout);
        }

        this.getBalance(address).then(balance => {
            console.log(address, balance.toString());
            if(parseInt(balance) === parseInt(wantedBalance)){
                return cb(true);
            }
            setTimeout(() => {
                this.queryBalanceUntil(address, wantedBalance, cb)
            }, 1000);

        });
    }

    getBalance(address){
        return new Promise(resolve => {
            this.api.query.balances.freeBalance(address).then(balance => {
                resolve(balance);
            });
        });
    }

    getKeypair(seed){

        const seedHash = crypto
            .createHash('sha256')
            .update(seed)
            .digest('hex')
            .substring(0,32);

        const keypair = this.keyring.addFromSeed(Buffer.from(seedHash));
        this.nonces[keypair.address] = 0;
        this.balances[keypair.address] = 0;
        this.accounts.push(keypair.address);
        return keypair;
    }

    getNonce(address){
        return new Promise(resolve => {
            this.api.query.system.accountNonce(address).then(nonce => {
                resolve(nonce);
            });
        });
    }

    calcTxSpeed(){

        const transfers = Object.values(this.transfers);

        if(transfers.length > 1){

            const avg = {
                blocktime: [],
                txCount: [],
                txPerSec: []
            };

            console.log('====================');

            transfers.forEach((transfer, i) => {

                if(transfers[i + 1]){
                    const blockTime = transfers[i + 1].time - transfer.time;
                    const txPerSec =  Math.floor(transfer.txCount / blockTime);

                    avg.blocktime.push(blockTime);
                    avg.txCount.push(transfer.txCount);
                    avg.txPerSec.push(txPerSec);

                    console.log('BLOCK HASH:', transfer.hash);
                    console.log('BLOCK TIME:', blockTime, 'seconds');
                    console.log('BLOCK TXs :', transfer.txCount,);
                    console.log('TXs / SEC :', txPerSec, 'TX / sec');
                    console.log("\n");
                }
            });

            console.log('--------------------');

            console.log('AVG BLOCK TIME:', this._calcAvg(avg.blocktime));
            console.log('AVG TXs COUNT :', this._calcAvg(avg.txCount));
            console.log('AVG TXs / SEC :', this._calcAvg(avg.txPerSec));

            console.log('====================' + "\n\n");
        }

        /*
        this.api.rpc.chain.subscribeNewHead((header) => {
            console.log(`Chain is at block: #${header.blockNumber}`);
            this.api.rpc.chain.getBlockHash(header.blockNumber).then((blockHash) => {
                console.log(`Hash of block: #${blockHash}`);
                this.api.rpc.chain.getBlock(blockHash).then((blockInfo) => {
                    console.log(JSON.stringify(blockInfo));
                    process.exit();

                });

            });
        });
        */
    }

    makeCalc(blockNumber){
        this.api.rpc.chain.getBlockHash(blockNumber).then((blockHash) => {
            console.log(`Hash of block ${blockNumber}: #${blockHash}`);


            this.api.rpc.chain.getHeader(blockHash).then((header) => {
                //console.log(JSON.stringify(header));
                //process.exit();

            });
            this.api.rpc.chain.getBlock(blockHash).then((blockInfo) => {
                //console.log(blockInfo);
                blockInfo.block.extrinsics.forEach(extrinsic => {
                    console.log(extrinsic.method._meta.name.toString());
                    extrinsic.method.args.forEach(arg => {
                        console.log(arg.toString());
                    })


                });
                //process.exit();

            });


        });
    }

    getBlockTime(blockNumber){
        return new Promise(resolve => {
            this.api.rpc.chain.getBlockHash(blockNumber).then((blockHash) => {
                this.api.rpc.chain.getBlock(blockHash).then((blockInfo) => {

                    resolve(JSON.parse(JSON.stringify(blockInfo.block.extrinsics[0].method.args))[0]);
                });
            });
        });
    }

    getTransfersInBlock(blockNumber){
        const transfers = [];
        return new Promise(resolve => {
            this.api.rpc.chain.getBlockHash(blockNumber).then((blockHash) => {
                this.api.rpc.chain.getBlock(blockHash).then((blockInfo) => {

                    blockInfo.block.extrinsics.forEach(extrinsic => {
                        if(extrinsic.method._meta.name.toString() === 'transfer'){
                            transfers.push({
                                to: extrinsic.method.args[0].toString(),
                                amount: extrinsic.method.args[1].toString()
                            })
                        }
                    });
                    resolve(transfers);
                });
            });
        });
    }

    _calcAvg(arr){
        if(arr.length){
            let sum = 0;
            arr.forEach(item => {
                sum += item;
            })
            return sum / arr.length;
        }
        return 0;
    }

    transfer(from, to, amount){

        const senderKeys = this.keyring.getPair(from);
        const nonce = this.nonces[from];
        this.nonces[from]++;
        return new Promise(resolve => {

            this.api.tx.balances
                .transfer(to, amount)
                .sign(senderKeys, { nonce })
                .send(({ events = [], status }) => {
                    if (status.isFinalized) {

                        const blockHash = status.asFinalized.toHex();

                        this.balances[from] -= amount;
                        this.balances[to] += amount;
                        /*
                        if(!this.transfers[blockHash]){
                            this.calcTxSpeed();
                            this.transfers[blockHash] = {
                                time: Math.floor((new Date).getTime() / 1000),
                                hash: blockHash,
                                txCount: 0
                            };
                        }

                        this.transfers[blockHash].txCount++;
                        */
                        resolve(blockHash);
                    }
                });
        });
    }

    transferRaw(from, to, amount, nonce){

        const senderKeys = this.keyring.getPair(from);
        return new Promise(resolve => {

            this.api.tx.balances
                .transfer(to, amount)
                .sign(senderKeys, { nonce })
                .send(({ events = [], status }) => {
                    if (status.isFinalized) {

                        const blockHash = status.asFinalized.toHex();

                        this.balances[from] -= amount;
                        this.balances[to] += amount;
                        /*
                        if(!this.transfers[blockHash]){
                            this.calcTxSpeed();
                            this.transfers[blockHash] = {
                                time: Math.floor((new Date).getTime() / 1000),
                                hash: blockHash,
                                txCount: 0
                            };
                        }

                        this.transfers[blockHash].txCount++;
                        */
                        resolve(blockHash);
                    }
                });
        });
    }

    transferRawImmediate(from, to, amount, nonce){

        const senderKeys = this.keyring.getPair(from);
        return new Promise(resolve => {

            this.api.tx.balances
                .transfer(to, amount)
                .sign(senderKeys, { nonce })
                .send(({ events = [], status }) => {
                    this.balances[from] -= amount;
                    this.balances[to] += amount;
                    resolve();
                });
        });
    }
}

module.exports = TestSuite;
