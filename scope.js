(() => {
  const permanent = [1, 2, 3, 4].flatMap(quadrant => Array.from({ length: 8 }, (_, index) => `${quadrant}${index + 1}`));
  const primary = [5, 6, 7, 8].flatMap(quadrant => Array.from({ length: 5 }, (_, index) => `${quadrant}${index + 1}`));
  const teeth = [...permanent, ...primary];
  const toothSet = new Set(teeth);
  const aliasQuadrants = { 右上: 1, 左上: 2, 左下: 3, 右下: 4 };

  function normalizeTooth(value) {
    const raw = String(value || "").trim();
    if (toothSet.has(raw)) return raw;
    const alias = raw.match(/^(右上|左上|左下|右下)([1-8])$/);
    if (alias) {
      const code = `${aliasQuadrants[alias[1]]}${alias[2]}`;
      return toothSet.has(code) ? code : null;
    }
    return null;
  }

  function parse(value) {
    if (value && typeof value === "object") {
      if (value.kind === "teeth" && Array.isArray(value.teeth)) {
        const codes = [...new Set(value.teeth.map(normalizeTooth))];
        return codes.length && !codes.includes(null) ? { kind: "teeth", teeth: codes.sort() } : null;
      }
      if (value.kind === "quadrant" && [1, 2, 3, 4].includes(Number(value.quadrant))) return { kind: "quadrant", quadrant: Number(value.quadrant) };
      if (value.kind === "jaw" && ["upper", "lower"].includes(value.jaw)) return { kind: "jaw", jaw: value.jaw };
      if (value.kind === "full") return { kind: "full" };
      if (value.kind === "site" && typeof value.id === "string" && value.id.trim()) return { kind: "site", id: value.id.trim() };
      return null;
    }
    const raw = String(value || "").trim();
    if (!raw) return null;
    if (raw === "全口") return { kind: "full" };
    if (["上颌", "下颌"].includes(raw)) return { kind: "jaw", jaw: raw === "上颌" ? "upper" : "lower" };
    const quadrant = raw.match(/^(右上|左上|左下|右下)象限$/);
    if (quadrant) return { kind: "quadrant", quadrant: aliasQuadrants[quadrant[1]] };
    const codes = raw.split(/[,，、\s]+/).map(normalizeTooth);
    return codes.length && !codes.includes(null) ? { kind: "teeth", teeth: [...new Set(codes)].sort() } : null;
  }

  function coveredTeeth(scope) {
    if (scope.kind === "teeth") return scope.teeth;
    if (scope.kind === "quadrant") return teeth.filter(code => Number(code[0]) % 4 === scope.quadrant % 4);
    if (scope.kind === "jaw") return teeth.filter(code => scope.jaw === "upper" ? [1, 2, 5, 6].includes(Number(code[0])) : [3, 4, 7, 8].includes(Number(code[0])));
    return teeth;
  }

  function overlaps(first, second) {
    const a = parse(first);
    const b = parse(second);
    if (!a || !b) return true;
    if (a.kind === "site" || b.kind === "site") return a.kind === "site" && b.kind === "site" ? a.id === b.id : true;
    const secondTeeth = new Set(coveredTeeth(b));
    return coveredTeeth(a).some(code => secondTeeth.has(code));
  }

  function same(first, second) {
    const a = parse(first);
    const b = parse(second);
    return Boolean(a && b && JSON.stringify(a) === JSON.stringify(b));
  }

  function label(value) {
    const scope = parse(value);
    if (!scope) return "未指定";
    if (scope.kind === "teeth") return scope.teeth.join("、");
    if (scope.kind === "quadrant") return `${Object.keys(aliasQuadrants).find(key => aliasQuadrants[key] === scope.quadrant)}象限`;
    if (scope.kind === "jaw") return scope.jaw === "upper" ? "上颌" : "下颌";
    if (scope.kind === "site") return `病灶 ${scope.id}`;
    return "全口";
  }

  window.FJ_SCOPE = { teeth, parse, overlaps, same, label };
})();
