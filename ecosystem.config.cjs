module.exports = {
    apps: [
        {
            name: "app-template",
            cwd: process.cwd(),
            script: "dist/server/node-build.mjs",
            interpreter: "node",
            env: {
                NODE_ENV: "production",
            },
            exec_mode: "fork",
            instances: 1,
            time: true,
            // default 1600ms สั้นเกินกว่าที่ shutdown จะ drain Oracle pool (5s) เสร็จ
            // → โดน SIGKILL แล้ว connection ค้างที่ฝั่ง DB
            kill_timeout: 8000,
            out_file: "logs/out.log",
            error_file: "logs/error.log",
        },
    ],
};
