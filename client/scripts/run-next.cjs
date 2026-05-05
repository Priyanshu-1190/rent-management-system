/* eslint-disable @typescript-eslint/no-require-imports */
const { spawn } = require("node:child_process");

const command = process.argv[2];
const forwardedArgs = process.argv.slice(3);

if (!command) {
  console.error("Missing Next.js command.");
  process.exit(1);
}

const memoryByCommand = {
  dev: "1536",
  build: "1536",
  start: "512",
};

const existingNodeOptions = process.env.NODE_OPTIONS || "";
const hasHeapLimit = /--max-old-space-size=\d+/u.test(existingNodeOptions);
const nextArgs = [require.resolve("next/dist/bin/next"), command];

const hasPortArg = forwardedArgs.some(
  (arg) => arg === "--port" || arg === "-p" || arg.startsWith("--port=")
);



if ((command === "dev" || command === "start") && !hasPortArg) {
  nextArgs.push("--port", process.env.PORT || "3000");
}

nextArgs.push(...forwardedArgs);

const env = {
  ...process.env,
  NODE_OPTIONS: hasHeapLimit
    ? existingNodeOptions
    : `${existingNodeOptions} --max-old-space-size=${memoryByCommand[command] || "768"}`.trim(),
};

const child = spawn(process.execPath, nextArgs, {
  stdio: "inherit",
  env,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
