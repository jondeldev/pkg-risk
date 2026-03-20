#!/usr/bin/env node

import { argv } from "node:process";
import { check } from "./src/check.js";

switch (argv[2]) {
    case "check":
        await check();
        break;
    default:
        console.info("Command not found...");
        break;
}
