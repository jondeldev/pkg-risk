import { cwd } from "node:process";
import { join } from "node:path";
import { promises } from "node:fs";
import { compareVersions, getPackageData } from "./utils.js";
import { PACKAGE_LOCK_JSON } from "./const.js";
import { ensure } from "./ensure.js";

export async function check() {
    try {
        await ensure();
    } catch (error) {
        console.error(error.message);
        return;
    }

    let pathToPackageLock = join(cwd(), PACKAGE_LOCK_JSON);
    let packageJson = JSON.parse(await promises.readFile(pathToPackageLock, { encoding: "utf-8" }));
    let installedPackages = Object.keys(packageJson.packages).filter((pckg) => pckg !== "")
        .map(value => ({ name: value.slice("node_modules/".length), localVersion: packageJson.packages[value].version }));

    const dataResult = await Promise.all(installedPackages.map(value => getPackageData(value.name)));
    const pkgGroups = {
        deprecated: [],
        major: [],
        minor: [],
        patch: [],
        upToDate: []
    };

    for (let i = 0; i < installedPackages.length; i++) {
        if (dataResult[i]["dist-tags"]) {
            let localVersion = installedPackages[i].localVersion;
            const pkgInfo = {
                name: installedPackages[i].name,
                localVersion: installedPackages[i].localVersion,
                ltsVersion: dataResult[i]["dist-tags"].latest,
                message: ""
            }
            if (dataResult[i].versions[localVersion].deprecated) {
                pkgInfo.message = dataResult[i].versions[localVersion].deprecated;
                pkgGroups.deprecated.push(pkgInfo);

            } else {
                switch (compareVersions(localVersion, dataResult[i]["dist-tags"].latest)) {
                    case "MAJOR":   // HIGH RISK
                        pkgGroups.major.push(pkgInfo);
                        break;
                    case "MINOR":   // MEDIUM RISK
                        pkgGroups.minor.push(pkgInfo);
                        break;
                    case "PATCH":   // LOW RISK
                        pkgGroups.patch.push(pkgInfo);
                        break;
                    default:        // UP TO DATE
                        pkgGroups.upToDate.push(pkgInfo);
                        break;
                }
            }
        }
    }

    printResult(pkgGroups);
}

function printResult(groups) {
    console.info("--- DEPRECATED ---");
    groups.deprecated.forEach((val) => {
        console.info(`\x1b[31m${val.name}\x1b[0m | ${val.localVersion} / ${val.ltsVersion}`);
        console.info(`\x1b[31m${val.message}\x1b[0m`);
    });

    console.info("\n--- MAJOR ---");
    groups.major.forEach((val) => {
        console.info(`\x1b[31m${val.name}\x1b[0m | ${val.localVersion} / ${val.ltsVersion}`);
    });

    console.info("\n--- MINOR ---");
    groups.minor.forEach((val) => {
        console.info(`\x1b[33m${val.name}\x1b[0m | ${val.localVersion} / ${val.ltsVersion}`);
    });

    console.info("\n--- PATCH ---");
    groups.patch.forEach((val) => {
        console.info(`\x1b[32m${val.name}\x1b[0m | ${val.localVersion} / ${val.ltsVersion}`);
    });

    console.info("\n--- UP TO DATE ---");
    groups.upToDate.forEach((val) => {
        console.info(`\x1b[34m${val.name}\x1b[0m | ${val.localVersion} / ${val.ltsVersion}`);
    });

    console.info("\n--- RESUME ---");
    console.info(`\x1b[31m${groups.deprecated.length}\x1b[0m deprecated | \x1b[31m${groups.major.length}\x1b[0m major | \x1b[33m${groups.minor.length}\x1b[0m minor | \x1b[32m${groups.patch.length}\x1b[0m patch | \x1b[34m${groups.upToDate.length}\x1b[0m up to date`);
}