const { spawn, exec } = require('child_process');
const bootnodeArgs = {
    ip: process.env.BOOTNODE_IP || process.env.MASTER_IP || '172.28.1.1',
    port: process.env.BOOTNODE_PORT || 30333,
    id: process.env.BOOTNODE_ID || 'QmRpheLN4JWdAnY7HGJfWFNbfkQCb6tFf4vvA6hgjMZKrR'
}
const spawnArgs = [
    '--chain=local',
    '-d',
    '/data',
    '--bootnodes',
    `/ip4/${bootnodeArgs.ip}/tcp/${bootnodeArgs.port}/p2p/${bootnodeArgs.id}`
];


module.exports = {

    pid: null,

    up: () => {
        return new Promise(resolve => {

            //SPAWN SUBSTRATE
            const substrate = spawn('substrate', spawnArgs);

            //RECORD PID
            this.pid = substrate.pid;

            //TRY TO PARSE LOCAL NODE ADDR. FROM STDOUT
            substrate.stderr.on('data', (data) => {
                const nodeId = findNodeId(data.toString());
                if (nodeId !== false) {
                    resolve(nodeId);
                }
            });
        });

    },

    down: () => {
        return new Promise(resolve => {
            exec(`kill ${this.pid}`, () => {
                exec(`rm -rf /data`, () => {
                    resolve();
                });
            });
        });
    }
};

function findNodeId(stdout) {

    var re1 = '.*?'; // Non-greedy match on filler
    var re2 = '(\\/)'; // Any Single Character 1
    var re3 = '(ip4)'; // Alphanum 1
    var re4 = '(\\/)'; // Any Single Character 2
    var re5 = '((?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))(?![\\d])'; // IPv4 IP Address 1
    var re6 = '(\\/)'; // Any Single Character 3
    var re7 = '(tcp)'; // Word 1
    var re8 = '(\\/)'; // Any Single Character 4
    var re9 = '(\\d+)'; // Integer Number 1
    var re10 = '(\\/)'; // Any Single Character 5
    var re11 = '(p2p)'; // Alphanum 2
    var re12 = '(\\/)'; // Any Single Character 6
    var re13 = '((?:[a-z][a-z]*[0-9]+[a-z0-9]*))';

    const p = new RegExp(re1+re2+re3+re4+re5+re6+re7+re8+re9+re10+re11+re12+re13, ["i"]);

    const m = p.exec(stdout);
    if (m != null) {
        return m[0];
    }
    return false;
}
