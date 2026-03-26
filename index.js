#!/usr/bin/env node

import { argv } from "node:process";
import { check } from "./src/check.js";
import { update } from "./src/update.js";

switch (argv[2]) {
    case "check":
        await check();
        break;
    case "update":
        await update();
        break;
    default:
        console.info("Command not found...");
        break;
}
