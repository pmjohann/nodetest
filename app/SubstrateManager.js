const { spawn, exec } = require('child_process');
const spawnArgs = [
    '--chain=local',
    '-d',
    '/data',
    '--bootnodes',
    process.env.BOOTNODE
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
