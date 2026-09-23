const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const sandbox = { window: {} };
vm.createContext(sandbox);
for (const file of ["catalog.js", "treatment-rules.js"]) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, file), "utf8"), sandbox, { filename: file });
}

const { FJ_CATALOG: catalog, FJ_VARIANTS: variants, FJ_TREATMENTS: treatments } = sandbox.window;
const locations = new Map();
for (const treatment of treatments) {
  for (const branch of treatment.branches) {
    for (const phase of branch.phases) {
      for (const definition of phase.items) {
        const values = locations.get(definition.code) || [];
        values.push({ treatmentId: treatment.id, treatment: treatment.name, branch: branch.name, phase: phase.name, status: branch.status || treatment.status, when: definition.when || {}, priceEvidenceLevel: definition.priceEvidenceLevel, clinicalEvidenceLevel: definition.clinicalEvidenceLevel });
        locations.set(definition.code, values);
      }
    }
  }
}

const headers = ["rowType", "code", "name", "parentCode", "unit", "priceA", "priceB", "directoryCategory", "navigation", "branch", "operation", "patientOrToothCondition", "quantityRule", "exclusion", "priceEvidenceLevel", "clinicalEvidenceLevel", "hospitalConfirmation", "clinicalStatus", "sourcePage"];
const rows = [];
for (const item of [...catalog, ...variants]) {
  const parent = variants.includes(item) ? catalog.find(candidate => candidate.code === item.parent) : null;
  const paths = locations.get(item.code) || locations.get(item.parent) || [];
  const root = paths.find(location => location.treatmentId === "root-canal" && location.status !== "目录分类");
  const navigation = paths.filter(location => location.status === "目录分类").map(location => location.treatment).join(" / ");
  rows.push({
    rowType: item.type || "main", code: item.code, name: item.name, parentCode: item.parent || "", unit: item.unit,
    priceA: item.a ?? "自主定价", priceB: item.b ?? "自主定价", directoryCategory: parent?.cat || item.cat || "",
    navigation, branch: root?.branch || "", operation: root?.phase || "",
    patientOrToothCondition: JSON.stringify(root?.when || (item.limit ? { limit: item.limit } : {})),
    quantityRule: item.rootLinked ? "填写本次实际处理根管数；不得超过本牙参考总数" : `按${item.unit}及实际实施数量`,
    exclusion: (item.conflicts || parent?.conflicts || []).join(" / "),
    priceEvidenceLevel: "A", clinicalEvidenceLevel: "C", hospitalConfirmation: "是",
    clinicalStatus: root ? "根管候选；需临床与医保物价复核" : "仅目录；临床规则未审，不可开单",
    sourcePage: item.page
  });
  for (const special of item.conditionalPrices || []) {
    rows.push({
      rowType: "conditionalPrice", code: special.code, name: special.name, parentCode: item.code, unit: item.unit,
      priceA: special.a, priceB: special.b, directoryCategory: item.cat, navigation,
      branch: "", operation: "", patientOrToothCondition: JSON.stringify(special.when),
      quantityRule: `按${item.unit}及实际实施数量`, exclusion: special.excludes.join(" / "),
      priceEvidenceLevel: "A", clinicalEvidenceLevel: "C", hospitalConfirmation: "是",
      clinicalStatus: "PDF条件价已核；临床路径未审，不可开单", sourcePage: item.page
    });
  }
}

const csv = [headers.join(","), ...rows.map(row => headers.map(key => `"${String(row[key] ?? "").replaceAll('"', '""')}"`).join(","))].join("\r\n") + "\r\n";
fs.writeFileSync(path.join(__dirname, "RULE_MATRIX.csv"), "\uFEFF" + csv, "utf8");
console.log(`Wrote ${rows.length} source-backed rows: ${catalog.length} mains + ${variants.length} variants + ${rows.length - catalog.length - variants.length} conditional prices.`);
