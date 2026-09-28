import { execFile, spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const executeFile = promisify(execFile);
const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRequire = createRequire(join(repositoryRoot, "package.json"));
const firebaseEntryPoint = repositoryRequire.resolve(
  `firebase-tools/${repositoryRequire("firebase-tools/package.json").bin.firebase}`
);

async function readJsonFile(fileName) {
  return JSON.parse(await readFile(join(repositoryRoot, fileName), "utf8"));
}

async function isHostingSiteExisting(siteId, firebaseFlags) {
  try {
    await executeFile(process.execPath, [firebaseEntryPoint, "hosting:sites:get", siteId, ...firebaseFlags], {
      cwd: repositoryRoot
    });
    return true;
  } catch {
    return false;
  }
}

async function runFirebase(firebaseArguments) {
  const firebaseProcess = spawn(process.execPath, [firebaseEntryPoint, ...firebaseArguments], {
    cwd: repositoryRoot,
    stdio: "inherit"
  });
  const exitCode = await new Promise(resolve => firebaseProcess.on("close", resolve));
  if (exitCode !== 0) {
    process.exit(exitCode);
  }
}

const { hosting } = await readJsonFile("firebase.json");
const { projects } = await readJsonFile(".firebaserc");
const siteId = hosting.site;
const firebaseFlags = ["--project", projects.default, "--non-interactive"];

if (!(await isHostingSiteExisting(siteId, firebaseFlags))) {
  console.log(`Hosting site "${siteId}" does not exist yet — creating it`);
  await runFirebase(["hosting:sites:create", siteId, ...firebaseFlags]);
}

await runFirebase(["deploy", ...firebaseFlags]);
