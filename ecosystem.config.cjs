module.exports = {
  apps: [
    {
      name: 'ytnotifier',
      script: 'index.ts',
      interpreter: "~/.bun/bin/bun", // Path to the Bun interpreter
      watch: false, // Set to true if you want to watch for file changes
      autorestart: true, // Set to true if you want the process to be restarted on failure
      time: true,
      error_file: "./logs/error.log",
      out_file: "./logs/runtime.log"
    }
  ]
};
