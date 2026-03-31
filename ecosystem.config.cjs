module.exports = {
  apps: [{
    name: 'homepage-server',
    script: 'node_modules/tsx/dist/cli.mjs',
    args: 'server/index.ts',
    cwd: 'e:/server/homepage',
    env: {
      NODE_ENV: 'development'
    }
  }]
};
