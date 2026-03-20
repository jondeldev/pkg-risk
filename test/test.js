import { compareVersions } from "../src/utils.js";
import { test } from "node:test";
import assert from "node:assert";

test("should return MAJOR when major version is different", () => {
    assert.strictEqual(compareVersions("1.0.0", "2.0.0"), "MAJOR");
});

test("should return MINOR when minor version is different", () => {
    assert.strictEqual(compareVersions("1.1.0", "1.2.0"), "MINOR");
});

test("should return PATCH when patch version is different", () => {
    assert.strictEqual(compareVersions("1.1.1", "1.1.2"), "PATCH");
});

test("should return UP_TO_DATE when version is equal", () => {
    assert.strictEqual(compareVersions("1.1.1", "1.1.1"), "UP_TO_DATE");
});