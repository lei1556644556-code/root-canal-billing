const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const sandbox = { window: {} };
vm.createContext(sandbox);
for (const file of ["catalog.js", "scope.js", "treatment-rules.js"]) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, file), "utf8"), sandbox, { filename: file });
}

const { FJ_CATALOG: catalog, FJ_VARIANTS: variants, FJ_SCOPE: scope, FJ_TREATMENTS: treatments } = sandbox.window;
assert.equal(catalog.length, 114);
assert.equal(variants.length, 83);
assert.equal(new Set(catalog.map(item => item.code)).size, 114);
assert.equal(new Set(variants.map(item => item.code)).size, 83);
const extraction = catalog.find(item => item.code === "013306020050000");
assert.equal(extraction.a, 80);
assert.equal(extraction.conditionalPrices[0].a, 11);
assert.equal(extraction.conditionalPrices[0].code, extraction.code);
assert.ok(extraction.conditionalPrices[0].excludes.includes("013306020050001"));
assert.match(variants.find(item => item.code === "013105170060001").name, /即刻修复/);
for (const code of ["013105010050000", "013105010060000", "013105010070000", "013105010060100"]) {
  const item = [...catalog, ...variants].find(row => row.code === code);
  assert.equal(item.unit, "根管", `${code} must bill per root canal`);
  assert.equal(item.rootLinked, true, `${code} must follow actual root count`);
}
assert.equal(scope.label(scope.parse("左下6")), "36");
assert.equal(scope.overlaps("11,12", "12"), true);
assert.equal(scope.overlaps("11", "36"), false);
assert.equal(scope.overlaps("左下象限", "36"), true);
assert.equal(scope.overlaps("上颌", "36"), false);
assert.equal(scope.overlaps("全口", "36"), true);
assert.equal(treatments.length, 13); // 12 clinical entry points + cross-treatment index
assert.equal(treatments.filter(item => item.status === "目录分类").length, 12);
const coveredCodes = new Set(sandbox.window.FJ_TREATMENT_COVERAGE.coveredCodes);
assert.ok(catalog.every(item => coveredCodes.has(item.code)));
assert.equal(sandbox.window.FJ_TREATMENT_COVERAGE.unassignedCodes.length, 0);
const routine = treatments.find(item => item.id === "root-canal").branches.find(item => item.id === "routine");
assert.equal(routine.phases.length, 1);
assert.ok(["013105010050000", "013105010060000", "013105010070000"].every(code => routine.phases[0].items.some(item => item.code === code)));
const branchCodes = (treatmentId, branchId) => Array.from(treatments.find(item => item.id === treatmentId).branches.find(item => item.id === branchId).phases[0].items, row => row.code);
assert.deepEqual(branchCodes("periodontal-basic", "root-planing"), ["013306020270000"]);
assert.deepEqual(branchCodes("mucosal-salivary", "salivary-exam"), ["012406000090000"]);
assert.deepEqual(branchCodes("cross-treatment", "no-reflux"), ["013105010220000"]);
assert.deepEqual(branchCodes("occlusal-function", "occlusal-splint"), ["013105010230000"]);
assert.deepEqual(branchCodes("occlusal-function", "occlusal-adjust"), ["013105010320000"]);
assert.deepEqual(branchCodes("occlusal-function", "root-traction"), ["013105010330000"]);
assert.deepEqual(branchCodes("root-canal", "apical-induction"), ["013306020020000"]);
assert.deepEqual(branchCodes("root-canal", "apical-barrier"), ["013306020030000"]);
assert.equal(treatments.find(item => item.id === "root-canal").branches.find(item => item.id === "apical-induction").status, "目录分类");
assert.deepEqual(branchCodes("extraction", "impacted-extraction"), ["013306020060000"]);
assert.deepEqual(branchCodes("extraction", "socket-curettage"), ["013306020090000"]);
assert.ok(!/\.filter\(item\s*=>\s*\//.test(fs.readFileSync(path.join(__dirname, "treatment-rules.js"), "utf8")));
console.log("Rule smoke tests passed: catalog counts, 12 clinical entry points, explicit routes, root-canal units and scoped classifications.");
