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
            const substrate = spawn('substrate', spawnArgs);
            substrate.stdout.on('data', () => {
                this.pid = substrate.pid;
                resolve();
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
