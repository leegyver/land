module.exports = {
    apps: [{
        name: "land-app",
        script: "./dist/index.js",
        instances: 1,
        exec_mode: "fork",
        env: {
            NODE_ENV: "production",
            PORT: 5000
        }
    }]
}
