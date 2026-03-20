import { REGISTRY_URL } from "./const.js";

export function compareVersions(local, latest) {
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

export async function getPackageData(pckg) {
    let url = new URL(REGISTRY_URL.concat(pckg));
    let response = await fetch(url);
    return response.json();
}