import { randomUUID } from "node:crypto";
import { copyFile, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import bcrypt from "bcryptjs";
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());
const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
const dataDirectory = path.join(process.cwd(), "data");
const platformFile = path.join(dataDirectory, "platform.json");

if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  throw new Error("Set BOOTSTRAP_ADMIN_EMAIL to a valid email address.");
}
if (!password || password.length < 14) {
  throw new Error("Set BOOTSTRAP_ADMIN_PASSWORD to a unique password with at least 14 characters.");
}

let state;
try {
  state = JSON.parse(await readFile(platformFile, "utf8"));
} catch (error) {
  if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
    throw new Error("data/platform.json has not been initialized. Start the app, make one sign-in request, stop the app, then rerun this command.");
  }
  throw new Error("Unable to read valid JSON from data/platform.json.", { cause: error });
}

if (!state || typeof state !== "object" || ![1, 2, 3].includes(state.version) ||
    !Array.isArray(state.companies) || !Array.isArray(state.employees) ||
    !Array.isArray(state.users) || !Array.isArray(state.cards)) {
  throw new Error("data/platform.json has an unsupported or invalid format.");
}
if (state.users.some((user) => typeof user.email === "string" && user.email.toLowerCase() === email)) {
  throw new Error("An account with this email already exists; no password was changed.");
}

const nextState = {
  ...state,
  version: 3,
  branches: Array.isArray(state.branches) ? state.branches : [],
  activityLogs: Array.isArray(state.activityLogs) ? state.activityLogs : [],
  users: [
    ...state.users,
    {
      id: randomUUID(),
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role: "SUPER_ADMIN",
      companyId: null,
      employeeId: null,
      status: "active",
      mustChangePassword: false,
      createdAt: new Date().toISOString(),
    },
  ],
};

const backupDirectory = path.join(dataDirectory, "backups");
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
await mkdir(backupDirectory, { recursive: true });
await copyFile(platformFile, path.join(backupDirectory, `platform-before-admin-${timestamp}-${randomUUID()}.json`));

const temporaryFile = `${platformFile}.${randomUUID()}.tmp`;
try {
  await writeFile(temporaryFile, JSON.stringify(nextState, null, 2), "utf8");
  await rename(temporaryFile, platformFile);
} finally {
  await rm(temporaryFile, { force: true });
}

console.log("Super Admin account created in data/platform.json.");
