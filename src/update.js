import readline from 'node:readline/promises';
import { stdin as input, stdout as output, exit } from 'node:process';
import { parseArgs } from "node:util";
import { execFile } from "node:child_process";
import { getPackageGroups } from './check.js';
import { ensure } from "./ensure.js";

export async function update() {
    try {
        await ensure();
    } catch (error) {
        console.error(error.message);
        return;
    }

    const options = {
        major: { type: "boolean", short: "f" },
        minor: { type: "boolean", short: "m" },
        patch: { type: "boolean", short: "p" },
    }

    const rl = readline.createInterface({ input, output });

    try {
        const { values } = parseArgs({ options: options, allowPositionals: true });
        if (values.major) {
            const answer = await rl.question("You are about to update MAJOR packages. This may introduce breaking changes and cause high risk to your application. Continue? (y/n)");
            if (answer.toLocaleLowerCase() === "y") {
                const pkgGroups = await getPackageGroups();
                console.log(pkgGroups);
                
                execFile("npm", ["install", `${pkgGroups.major.name}@${pkgGroups.major.ltsVersion}`]);
            } else {
                exit(0);
            }

        } else if (values.minor) {
            console.log(values.minor);
        } else if (values.patch) {
            console.log(values.patch);
        }
    } catch (error) {
        console.error(error.message);
    }

    rl.close();
}
