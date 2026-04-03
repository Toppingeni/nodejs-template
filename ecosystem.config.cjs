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
      out_file: "logs/out.log",
      error_file: "logs/error.log",
    },
  ],
};
