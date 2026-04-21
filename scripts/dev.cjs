const { spawn } = require("node:child_process");
const path = require("node:path");

const rootDir = __dirname ? path.resolve(__dirname, "..") : process.cwd();
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

function run(name, cwd, args) {
  const child = spawn(npmCommand, args, {
    cwd,
    stdio: "inherit",
    shell: false,
  });

  child.on("exit", (code) => {
    if (code && !shuttingDown) {
      console.error(`${name} exited with code ${code}.`);
      shutdown(code);
    }
  });

  return child;
}

const children = [
  run("server", path.join(rootDir, "server"), ["run", "dev"]),
  run("client", path.join(rootDir, "client"), ["run", "dev"]),
];

let shuttingDown = false;

function shutdown(exitCode = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill();
    }
  }

  process.exit(exitCode);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
