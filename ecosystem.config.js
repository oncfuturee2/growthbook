const resolveInstances = (value, fallback = 1) => {
  if (value === "max") return "max";

  const parsed = Number.parseInt(value || "", 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const resolveExecMode = (value, instances) => {
  if (value === "cluster" || value === "fork") return value;
  return instances === 1 ? "fork" : "cluster";
};

const frontEndInstances = resolveInstances(process.env.FRONTEND_INSTANCES);
const frontEndExecMode = resolveExecMode(
  process.env.FRONTEND_EXEC_MODE,
  frontEndInstances,
);

module.exports = {
  apps: [
    {
      name: "back-end",
      script: "dist/server.js",
      cwd: "./packages/back-end",
      instances: 1,
      autorestart: process.env.PM2_AUTORESTART === "true",
      watch: false,
      max_memory_restart: process.env.PM2_MAX_MEMORY_RESTART || "6G",
      ...(process.env.TRACING_PROVIDER === "datadog" && {
        node_args: "--require ./packages/back-end/dist/tracing.datadog.js",
      }),
      ...(process.env.TRACING_PROVIDER === "opentelemetry" && {
        node_args:
          "--require ./packages/back-end/dist/tracing.opentelemetry.js",
      }),
    },
    {
      name: "front-end",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      cwd: "./packages/front-end",
      exec_mode: frontEndExecMode,
      instances: frontEndInstances,
      autorestart: process.env.PM2_AUTORESTART === "true",
      watch: false,
      max_memory_restart: process.env.PM2_MAX_MEMORY_RESTART || "6G",
    },
    ...(process.env.PREVIEW_IDLE_TIMEOUT_SECONDS
      ? [
          {
            name: "idle-monitor",
            script: "./preview/idle-monitor.sh",
            instances: 1,
            autorestart: false,
            watch: false,
          },
        ]
      : []),
  ],
};
