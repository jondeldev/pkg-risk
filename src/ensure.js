import { cwd } from "node:process";
import { join } from "node:path";
import { promises } from "node:fs";
import constants from "node:constants";

import { NODE_MODULES, PACKAGE_JSON } from "./const.js";

export async function ensure() {
    let pathToPackage = join(cwd(), PACKAGE_JSON);
    let pathToModules = join(cwd(), NODE_MODULES);

    try {
        await promises.access(pathToPackage, constants.F_OK);
    } catch {
        throw new Error("No Node project has been detected.");
    }

    try {
        await promises.access(pathToModules, constants.F_OK);
    } catch {
        throw new Error("'package.json' found, run 'npm install' to install the packages.");
    }
}