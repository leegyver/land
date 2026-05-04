module.exports = {
  apps: [{
    name: 'homepage-server',
    script: 'node',
    args: 'dist/index.js',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
