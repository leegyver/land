module.exports = {
    apps: [{
        name: "land-app",
        script: "./dist/index.js",
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        env: {
            NODE_ENV: "production",
            PORT: 5000
        },
        ignore_watch: ["node_modules", "public", "public/uploads", "dist/public", "*.log"],
    }]
};
