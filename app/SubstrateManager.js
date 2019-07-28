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
            substrate.stdout.on('data', (data) => {
                console.log(data.toString());
                const nodeId = findNodeId(data.toString());
                if(nodeId !== false){
                    resolve(nodeId);
                }
            });
        });

    },

    down: () => {
        return new Promise(resolve => {
            exec(`kill ${this.pid}`, () => {
                resolve();
            });
        });
    }
};

function findNodeId(stdout){

    const p = new RegExp('(\\/)(ip4)(\\/)(0\\.0\\.0\\.0)(\\/)(tcp)(\\/)(\\d+)(\\/)(p2p)(\\/)((?:[a-z][a-z]*[0-9]+[a-z0-9]*))', ["i"]);
    const m = p.exec(stdout);
    if (m != null) {
        return m[0];
    }
    return false;
}
