import { cwd } from "node:process";
import { join } from "node:path";
import { promises } from "node:fs";
import { compareVersions, getPackageData } from "./utils.js";
import { PACKAGE_LOCK_JSON } from "./const.js";
import { ensure } from "./ensure.js";
import CliTable3 from "cli-table3";

export async function check() {
    try {
        await ensure();
    } catch (error) {
        console.error(error.message);
        return;
    }

    const pkgGroups = await getPackageGroups();
    printResult(pkgGroups);
}

export async function getPackageGroups() {
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
            };
            if (dataResult[i].versions[localVersion].deprecated) {
                pkgInfo.message = dataResult[i].versions[localVersion].deprecated;
                pkgGroups.deprecated.push(pkgInfo);

            } else {
                switch (compareVersions(localVersion, dataResult[i]["dist-tags"].latest)) {
                    case "MAJOR": // HIGH RISK
                        pkgGroups.major.push(pkgInfo);
                        break;
                    case "MINOR": // MEDIUM RISK
                        pkgGroups.minor.push(pkgInfo);
                        break;
                    case "PATCH": // LOW RISK
                        pkgGroups.patch.push(pkgInfo);
                        break;
                    default: // UP TO DATE
                        pkgGroups.upToDate.push(pkgInfo);
                        break;
                }
            }
        }
    }
    return pkgGroups;
}

function printResult(groups) {
    let table = new CliTable3({ head: ["Semver", "Name", "Local Version", "LTS Version", "Comment"], colWidths: [12, 20, 10, 10, 50], style: { 'padding-left': 0, 'padding-right': 0, head: [], border: [] }, wordWrap: true });
    if (groups.deprecated) {
        groups.deprecated.forEach((val) => {
            table.push([`\x1b[31mDEPRECATED\x1b[0m`, val.name, val.localVersion, val.ltsVersion, val.message]);
        });
    }

    if (groups.major) {
        groups.major.forEach((val) => {
            table.push([`\x1b[31mMAJOR\x1b[0m`, val.name, val.localVersion, val.ltsVersion, "\x1b[31mHIGH RISK\x1b[0m"]);
        });
    }

    if (groups.minor) {
        groups.minor.forEach((val) => {
            table.push([`\x1b[33mMINOR\x1b[0m`, val.name, val.localVersion, val.ltsVersion, "\x1b[33mMEDIUM RISK\x1b[0m"]);
        });
    }

    if (groups.patch) {
        groups.patch.forEach((val) => {
            table.push([`\x1b[32mPATCH\x1b[0m`, val.name, val.localVersion, val.ltsVersion, "\x1b[32mLOW RISK\x1b[0m"]);
        });
    }

    if (groups.upToDate) {
        groups.upToDate.forEach((val) => {
            table.push([`\x1b[34mUP TO DATE\x1b[0m`, val.name, val.localVersion, val.ltsVersion, "\x1b[34mNO ACTION NEEDED\x1b[0m"]);
        });   
    }
    console.info(table.toString());
    console.info(`\x1b[31m${groups.deprecated.length}\x1b[0m deprecated | \x1b[31m${groups.major.length}\x1b[0m major | \x1b[33m${groups.minor.length}\x1b[0m minor | \x1b[32m${groups.patch.length}\x1b[0m patch | \x1b[34m${groups.upToDate.length}\x1b[0m up to date`);
}