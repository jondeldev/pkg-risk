#!/usr/bin/env node

import { argv, cwd } from "node:process";
import { join } from "node:path";
import { promises } from "node:fs";
import constants from "node:constants";

const PACKAGE_JSON = "package.json";
const NODE_MODULES = "node_modules";
const PACKAGE_LOCK_JSON = "package-lock.json"
const REGISTRY_URL = "https://registry.npmjs.org/";

switch (argv[2]) {
    case "check":
        await check();
        break;
    default:
        console.info("Command not found...");
        break;
}

async function ensure() {
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

async function check() {
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

function printResult(grupos) {
    console.info("--- DEPRECATED ---");
    grupos.deprecated.forEach((val) => {
        console.info(`\x1b[31m${val.name}\x1b[0m | ${val.localVersion} / ${val.ltsVersion}`);
        console.info(`\x1b[31m${val.message}\x1b[0m`);
    });

    console.info("\n--- MAJOR ---");
    grupos.major.forEach((val) => {
        console.info(`\x1b[31m${val.name}\x1b[0m | ${val.localVersion} / ${val.ltsVersion}`);
    });

    console.info("\n--- MINOR ---");
    grupos.minor.forEach((val) => {
        console.info(`\x1b[33m${val.name}\x1b[0m | ${val.localVersion} / ${val.ltsVersion}`);
    });

    console.info("\n--- PATCH ---");
    grupos.patch.forEach((val) => {
        console.info(`\x1b[32m${val.name}\x1b[0m | ${val.localVersion} / ${val.ltsVersion}`);
    });

    console.info("\n--- UP TO DATE ---");
    grupos.upToDate.forEach((val) => {
        console.info(`\x1b[34m${val.name}\x1b[0m | ${val.localVersion} / ${val.ltsVersion}`);
    });

    console.info("\n--- RESUME ---");
    console.info(`\x1b[31m${grupos.deprecated.length}\x1b[0m deprecated | \x1b[31m${grupos.major.length}\x1b[0m major | \x1b[33m${grupos.minor.length}\x1b[0m minor | \x1b[32m${grupos.patch.length}\x1b[0m patch | \x1b[34m${grupos.upToDate.length}\x1b[0m up to date`);
}

function compareVersions(local, latest) {
    let localVersion = String(local).split(".").map((val) => Number(val));
    let latestVersion = String(latest).split(".").map((val) => Number(val));

    if (localVersion[0] < latestVersion[0])
        return "MAJOR";
    else if (localVersion[1] < latestVersion[1])
        return "MINOR";
    else if (localVersion[2] < latestVersion[2])
        return "PATCH";
    else
        return "UP_TO_DATE";
}

async function getPackageData(pckg) {
    let url = new URL(REGISTRY_URL.concat(pckg));
    let response = await fetch(url);
    return response.json();
}