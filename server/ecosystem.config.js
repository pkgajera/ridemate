require('dotenv').config();

module.exports = {
    apps: [
        {
            name: 'ridemate_backend',
            script: 'app.js',
            restart_delay: 10000,
            max_memory_restart: "300M",
            watch: false,
            watch_delay: 3000,
            autorestart: false,
            ignore_watch: ["node_modules", "public/**", "package.json"],
            env: {
                NODE_ENV: 'production',
                PORT: process.env.PORT || 8001
            },
            log_date_format: "DD-MM HH:mm:ss Z",
        }
    ]
}