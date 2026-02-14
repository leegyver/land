module.exports = {
    apps: [{
        name: "leegyver-v2",
        script: "./dist/index.js",
        cwd: "/root/land",
        instances: 1,
        exec_mode: "fork",
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
