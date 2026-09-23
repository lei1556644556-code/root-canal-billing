(() => {
  const catalog = Array.isArray(window.FJ_CATALOG) ? window.FJ_CATALOG : [];
  const variants = Array.isArray(window.FJ_VARIANTS) ? window.FJ_VARIANTS : [];
  const treatments = Array.isArray(window.FJ_TREATMENTS) ? window.FJ_TREATMENTS : [];
  const scope = window.FJ_SCOPE;
  const orderKey = "fujian-oral-itemized-billing-v6";
  const packageKey = "fujian-oral-itemized-packages-v1";
  const ruleVersion = "fj-2026-45-preview-v5";

  const el = {
    catalog: document.querySelector("#catalog"),
    catalogCount: document.querySelector("#catalog-count"),
    catalogSearch: document.querySelector("#catalog-search"),
    catalogStatus: document.querySelector("#catalog-status"),
    categoryList: document.querySelector("#category-list"),
    lineArea: document.querySelector("#line-area"),
    lineCount: document.querySelector("#line-count"),
    rootCount: document.querySelector("#root-count"),
    priceTier: document.querySelector("#price-tier"),
    total: document.querySelector("#total-price"),
    breakdown: document.querySelector("#total-breakdown"),
    toast: document.querySelector("#toast"),
    print: document.querySelector("#print-order"),
    clear: document.querySelector("#clear-order"),
    fresh: document.querySelector("#new-order"),
    date: document.querySelector("#bill-date"),
    patient: document.querySelector("#patient"),
    medicalNo: document.querySelector("#medical-no"),
    doctor: document.querySelector("#doctor"),
    note: document.querySelector("#note"),
    tooth: document.querySelector("#tooth"),
    diagnosis: document.querySelector("#diagnosis"),
    printContext: document.querySelector("#print-context"),
    consumableForm: document.querySelector("#consumable-form"),
    consumableName: document.querySelector("#consumable-name"),
    consumablePrice: document.querySelector("#consumable-price"),
    consumableQty: document.querySelector("#consumable-qty"),
    treatmentSelect: document.querySelector("#treatment-select"),
    branchSelect: document.querySelector("#root-branch"),
    phaseSelect: document.querySelector("#root-phase"),
    branchField: document.querySelector("#branch-field"),
    phaseField: document.querySelector("#phase-field"),
    toothTypeField: document.querySelector("#tooth-type-field"),
    patientTypeField: document.querySelector("#patient-type-field"),
    rootConditions: document.querySelector("#root-conditions"),
    rootCountField: document.querySelector("#root-count-field"),
    rootLinkNote: document.querySelector("#root-link-note"),
    rootToothType: document.querySelector("#root-tooth-type"),
    rootPatientType: document.querySelector("#root-patient-type"),
    rootAnomaly: document.querySelector("#root-anomaly"),
    rootMedication: document.querySelector("#root-medication"),
    workflowTitle: document.querySelector("#workflow-title"),
    workflowBadge: document.querySelector("#workflow-badge"),
    workflowNote: document.querySelector("#workflow-note"),
    workflowOptions: document.querySelector("#workflow-options"),
    workflowSource: document.querySelector("#workflow-source"),
    packageName: document.querySelector("#package-name"),
    savePackage: document.querySelector("#save-package"),
    packageCount: document.querySelector("#package-count"),
    packageList: document.querySelector("#package-list")
  };

  let activeCategory = "all";
  let searchQuery = "";
  const orderState = loadOrderState();
  let entries = orderState?.entries || [];
  let visitId = orderState?.visitId || newVisitId();
  let lockedContext = orderState?.context || null;
  let savedPackages = loadJson(packageKey, []).filter(item => item && typeof item === "object" && Array.isArray(item.items) && typeof item.name === "string");
  let toastTimer;

  el.date.value = orderState?.header?.date || localDate();
  el.priceTier.value = orderState?.priceTier === "b" ? "b" : "a";
  el.patient.value = orderState?.header?.patient || "";
  el.medicalNo.value = orderState?.header?.medicalNo || "";
  el.doctor.value = orderState?.header?.doctor || "";
  el.note.value = orderState?.header?.note || "";
  const diagnosisInput = document.createElement("input");
  diagnosisInput.id = "diagnosis";
  diagnosisInput.placeholder = "按本次临床诊断填写（选填）";
  el.diagnosis.replaceWith(diagnosisInput);
  el.diagnosis = diagnosisInput;
  el.diagnosis.value = orderState?.header?.diagnosis || "";
  el.rootCount.value = String(orderState?.rootCount || 3);

  const oldToothInput = el.tooth;
  const toothSelect = document.createElement("select");
  toothSelect.id = "tooth";
  toothSelect.setAttribute("aria-label", "当前治疗牙位");
  toothSelect.innerHTML = `<option value="">请选择牙位</option>${scope.teeth.map(code => `<option value="${code}">${code}</option>`).join("")}`;
  oldToothInput.replaceWith(toothSelect);
  el.tooth = toothSelect;
  el.tooth.value = orderState?.tooth || "";
  document.querySelector("#root-link-note").textContent = "上方是本牙参考根管总数；每项操作按本次实际处理的根管数分别填写，不自动全按总数收费。";
  document.querySelector(".quick-plan p").textContent = "12个临床入口按治疗目的显式索引，跨治疗辅助项另列；除根管第一版路径外均仅供查阅。";
  document.querySelector(".package-head p").textContent = "当前仅支持同一牙位、同一治疗路径的技术服务套餐。";
  document.querySelector("#root-count-field span").textContent = "本牙总根管数";
  document.querySelector(".note-card p").textContent = "每条收费行绑定标准牙位；完整目录仅供查阅。保存套餐与打印前会重新校验全部明细。";

  function localDate() {
    const date = new Date();
    return new Date(date - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }

  function loadJson(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return Array.isArray(value) ? value : fallback;
    } catch {
      return fallback;
    }
  }

  function loadOrderState() {
    try {
      const value = JSON.parse(localStorage.getItem(orderKey));
      return value?.ruleVersion === ruleVersion && Array.isArray(value.entries) && value.entries.every(entry => entry && typeof entry === "object") ? value : null;
    } catch {
      return null;
    }
  }

  function newVisitId() {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function storeJson(key, value, failureMessage) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      showToast(failureMessage);
      return false;
    }
  }

  function saveEntries() {
    const header = {
      patient: el.patient.value.trim(), medicalNo: el.medicalNo.value.trim(),
      doctor: el.doctor.value.trim(), note: el.note.value.trim(),
      diagnosis: el.diagnosis.value.trim(), date: el.date.value
    };
    storeJson(orderKey, {
      ruleVersion, entries, visitId, context: lockedContext,
      priceTier: el.priceTier.value, tooth: el.tooth.value,
      rootCount: currentRoots(), header
    }, "当前浏览器无法保存记录，请勿依赖此清单。");
  }

  function savePackages() {
    storeJson(packageKey, savedPackages, "当前浏览器无法保存套餐。");
  }

  function money(value) {
    const amount = Number(value) || 0;
    return `¥${new Intl.NumberFormat("zh-CN", {
      minimumFractionDigits: amount % 1 ? 2 : 0,
      maximumFractionDigits: 2
    }).format(amount)}`;
  }

  function safe(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    el.toast.textContent = message;
    el.toast.classList.add("is-visible");
    toastTimer = setTimeout(() => el.toast.classList.remove("is-visible"), 2800);
  }

  function currentRoots() {
    const roots = Number(el.rootCount.value);
    return Number.isSafeInteger(roots) && roots >= 1 ? roots : 1;
  }

  function activePrice(item) {
    return item?.[el.priceTier.value];
  }

  function findItem(code) {
    return catalog.find(item => item.code === code) || variants.find(item => item.code === code);
  }

  function priceCap(item) {
    if (item?.type === "extend") return activePrice(catalog.find(parent => parent.code === item.parent));
    return activePrice(item);
  }

  function currentTreatment() {
    return treatments.find(item => item.id === el.treatmentSelect.value) || treatments[0];
  }

  function currentBranch() {
    const treatment = currentTreatment();
    return treatment?.branches.find(item => item.id === el.branchSelect.value) || treatment?.branches[0];
  }

  function currentPhase() {
    const branch = currentBranch();
    return branch?.phases.find(item => item.id === el.phaseSelect.value) || branch?.phases[0];
  }

  function isBillableBranch() {
    return currentTreatment()?.id === "root-canal" && currentBranch()?.status !== "目录分类";
  }

  function currentWorkflowContext() {
    return {
      treatmentId: currentTreatment()?.id || "",
      branchId: currentBranch()?.id || "",
      phaseId: currentPhase()?.id || "",
      patient: el.rootPatientType.value,
      toothType: el.rootToothType.value,
      anomaly: el.rootAnomaly.checked,
      medication: el.rootMedication.checked,
      rootCount: currentRoots(),
      priceTier: el.priceTier.value
    };
  }

  function routeContext() {
    const context = currentWorkflowContext();
    return {
      treatmentId: context.treatmentId, branchId: context.branchId, phaseId: context.phaseId,
      patient: context.patient, toothType: context.toothType,
      anomaly: context.anomaly, medication: context.medication
    };
  }

  function sameRoute(first, second) {
    return Boolean(first && second && Object.keys(routeContext()).every(key => first[key] === second[key]));
  }

  function restoreLockedControls() {
    if (!lockedContext) return;
    syncTreatmentOptions(lockedContext.treatmentId);
    syncBranchOptions(lockedContext.branchId);
    syncPhaseOptions(lockedContext.phaseId);
    el.rootPatientType.value = lockedContext.patient;
    el.rootToothType.value = lockedContext.toothType;
    el.rootAnomaly.checked = lockedContext.anomaly;
    el.rootMedication.checked = lockedContext.medication;
    renderWorkflow();
  }

  function guardRouteChange() {
    if (entries.length && lockedContext && !sameRoute(routeContext(), lockedContext)) {
      const current = routeContext();
      const routeChanged = ["treatmentId", "branchId", "phaseId"].some(key => current[key] !== lockedContext[key]);
      const error = routeChanged ? "本次明细已绑定治疗路径；请先清空明细再切换。" : validateOrder();
      if (error) {
        restoreLockedControls();
        showToast(error);
        return false;
      }
      lockedContext = current;
    }
    renderWorkflow();
    saveEntries();
    return true;
  }

  function contextLabels(context = currentWorkflowContext()) {
    const treatment = treatments.find(item => item.id === context.treatmentId);
    const branch = treatment?.branches.find(item => item.id === context.branchId);
    const phase = branch?.phases.find(item => item.id === context.phaseId);
    const labels = [treatment?.name];
    if ((treatment?.branches.length || 0) > 1) labels.push(branch?.name);
    if ((branch?.phases.length || 0) > 1) labels.push(phase?.name);
    return labels.filter(Boolean).join(" · ");
  }

  function setOptions(select, items, selectedValue) {
    select.innerHTML = items.map(item => `<option value="${safe(item.id)}">${safe(item.name)}</option>`).join("");
    if (items.some(item => item.id === selectedValue)) select.value = selectedValue;
  }

  function syncTreatmentOptions(selectedValue) {
    setOptions(el.treatmentSelect, treatments, selectedValue || el.treatmentSelect.value);
  }

  function syncBranchOptions(selectedValue) {
    const treatment = currentTreatment();
    setOptions(el.branchSelect, treatment?.branches || [], selectedValue || el.branchSelect.value);
  }

  function syncPhaseOptions(selectedValue) {
    const branch = currentBranch();
    setOptions(el.phaseSelect, branch?.phases || [], selectedValue || el.phaseSelect.value);
  }

  function updateWorkflowControlVisibility() {
    const treatment = currentTreatment();
    const branch = currentBranch();
    const isRootCanal = isBillableBranch();
    el.branchField.classList.toggle("is-hidden", (treatment?.branches.length || 0) <= 1);
    el.phaseField.classList.toggle("is-hidden", (branch?.phases.length || 0) <= 1);
    el.toothTypeField.classList.toggle("is-hidden", !isRootCanal);
    el.patientTypeField.classList.toggle("is-hidden", !isRootCanal);
    el.rootConditions.classList.toggle("is-hidden", !isRootCanal);
    el.rootCountField.classList.toggle("is-hidden", !isRootCanal);
    el.rootLinkNote.classList.toggle("is-hidden", !isRootCanal);
  }

  function matchesWhen(when = {}) {
    const context = {
      patient: el.rootPatientType.value,
      tooth: el.rootToothType.value,
      anomaly: el.rootAnomaly.checked,
      medication: el.rootMedication.checked
    };
    return Object.entries(when).every(([key, value]) => context[key] === value);
  }

  function renderPrintContext() {
    const isRootCanal = isBillableBranch();
    const fields = [
      `患者：${el.patient.value.trim() || "未填写"}`,
      `病历号：${el.medicalNo.value.trim() || "未填写"}`,
      `治疗：${contextLabels() || "未选择"}`,
      `牙位：${scope.label(currentScope())}`,
      isRootCanal ? `本牙参考根管总数：${currentRoots()} 根` : "",
      `档位：${el.priceTier.options[el.priceTier.selectedIndex].text}`,
      `诊断：${el.diagnosis.value.trim() || "未填写"}`,
      `开单医生：${el.doctor.value.trim() || "未填写"}`,
      `日期：${el.date.value || "未填写"}`
    ].filter(Boolean);
    el.printContext.textContent = fields.join("　｜　");
  }

  function categories() {
    return ["all", ...new Set(catalog.map(item => item.cat))];
  }

  function visibleCatalog() {
    const term = searchQuery.trim().toLowerCase();
    return catalog.filter(item =>
      (activeCategory === "all" || item.cat === activeCategory) &&
      (!term || `${item.name} ${item.code}`.toLowerCase().includes(term))
    );
  }

  function renderCategories() {
    el.categoryList.innerHTML = categories().map(category => {
      const count = category === "all" ? catalog.length : catalog.filter(item => item.cat === category).length;
      const selected = category === activeCategory;
      return `<button class="category${selected ? " is-active" : ""}" type="button" data-category="${safe(category)}" role="tab" aria-selected="${selected}"><span>${category === "all" ? "全部项目" : safe(category)}</span><small>${count}</small></button>`;
    }).join("");
  }

  function priceLabel(item) {
    const price = priceCap(item);
    return Number.isFinite(price) ? money(price) : "自主定价";
  }

  function workflowAdded(code, scope = currentScope()) {
    return entries.some(entry => entry.kind === "service" && entryCodes(entry).includes(code) && scopesOverlap(scope, entry.scope));
  }

  function renderCatalog() {
    const items = visibleCatalog();
    el.catalogCount.textContent = `${items.length} / ${catalog.length} 项`;
    el.catalogStatus.textContent = searchQuery
      ? `搜索到 ${items.length} 个福建主项目`
      : activeCategory === "all"
        ? "可按分类浏览福建 114 个主项目"
        : `当前分类：${activeCategory}（${items.length} 项）`;

    el.catalog.innerHTML = items.length ? items.map(item => {
      const tags = [`第 ${item.n} 项`, item.ins, item.limit]
        .filter(Boolean)
        .map(tag => `<span class="catalog-tag${tag === "医保" ? " insured" : tag === item.limit ? " limit" : ""}">${safe(tag)}</span>`)
        .join("");
      const childItems = variants.filter(variant => variant.parent === item.code);
      const specialHtml = item.conditionalPrices?.length ? `<div class="variant-wrap"><p>条件价格 · 与主项目同编码，不能按普通价计费</p><div class="variant-list">${item.conditionalPrices.map(price => `<div class="variant-item"><span>${safe(price.name)} · ${safe(price.code)} · ${price.when?.toothType === "primary" ? "乳牙适用" : "条件适用"}</span><b>${money(price[el.priceTier.value])}</b></div>`).join("")}</div></div>` : "";
      const variantHtml = childItems.length ? `<div class="variant-wrap"><p>附件分项 · 仅供政策查阅</p><div class="variant-list">${childItems.map(variant => {
        const behavior = variant.type === "add" ? "加收" : variant.type === "reduce" ? "替代为减收价" : "同价扩展替代";
        return `<div class="variant-item"><span>${safe(variant.name)} · ${behavior}</span><b>${priceLabel(variant)}</b></div>`;
      }).join("")}</div></div>` : "";
      return `<article class="catalog-item"><div><h3>${safe(item.name)}</h3><p>${item.code} · ${safe(item.unit)} · 附件第 ${item.page} 页</p><div class="catalog-tags">${tags}</div></div><div class="catalog-price"><span>${priceLabel(item)}</span><small>查阅</small></div>${specialHtml}${variantHtml}</article>`;
    }).join("") : `<div class="empty-lines">未找到匹配项目。<br /><b>可搜索项目名称或 15 位项目编码</b>。</div>`;
  }

  function requestCustomPrice(item) {
    const raw = window.prompt(`“${item.name}”为自主定价项目，请输入本机构单价（元）：`, "");
    if (raw === null) return null;
    const price = Number(raw);
    if (!Number.isFinite(price) || price < 0) {
      showToast("请输入大于或等于 0 的有效单价。");
      return null;
    }
    return price;
  }

  function actualRootsOrError(item, raw, maximum = currentRoots()) {
    const count = Number(raw);
    if (raw === "" || !Number.isSafeInteger(count) || count < 1 || count > maximum) {
      showToast(`请为“${item.name}”填写 1–${maximum} 的实际根管数；未加入该项目。`);
      return null;
    }
    return count;
  }

  function currentScope() {
    return scope.parse(el.tooth.value);
  }

  function needsScope(item) {
    return Boolean(item);
  }

  function newEntry(item, price = priceCap(item), isVariant = false, scope = currentScope()) {
    return {
      uid: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      kind: "service",
      catalogCode: item.code,
      code: item.code,
      name: item.name,
      unit: item.unit,
      price,
      cap: Number.isFinite(priceCap(item)) ? priceCap(item) : null,
      qty: item.rootLinked ? currentRoots() : 1,
      rootLinked: Boolean(item.rootLinked),
      tierLinked: !item.custom,
      variant: isVariant,
      variantType: item.type || null,
      parentCode: item.type === "add" ? item.parent || null : null,
      baseCode: item.parent || item.code,
      scope: scope ? structuredClone(scope) : null,
      treatmentId: currentTreatment()?.id,
      branchId: currentBranch()?.id,
      phaseId: currentPhase()?.id,
      visitId,
      rootCount: currentRoots()
    };
  }

  function selectedCodes(scope = currentScope()) {
    return [...new Set(entries.filter(entry => entry.kind === "service" && scopesOverlap(scope, entry.scope)).flatMap(entry => [
      entry.catalogCode || entry.code,
      entry.baseCode,
      entry.variantType && entry.variantType !== "add" ? entry.parentCode : null
    ].filter(Boolean)))];
  }

  function scopesOverlap(first, second) {
    return scope.overlaps(first, second);
  }

  function entryCodes(entry) {
    return [entry.catalogCode || entry.code, entry.baseCode].filter(Boolean);
  }

  function conflictsFor(item) {
    const parent = item?.parent ? catalog.find(candidate => candidate.code === item.parent) : null;
    return [...new Set([...(item?.conflicts || []), ...(parent?.conflicts || [])])];
  }

  function addValidation(item, scope = currentScope(), excludeUid = "") {
    const allItems = [...catalog, ...variants];
    const conflict = entries.find(entry => {
      if (entry.kind !== "service" || entry.uid === excludeUid || !scopesOverlap(scope, entry.scope)) return false;
      return entryCodes(entry).some(code => conflictsFor(item).includes(code)) || entryCodes(entry).some(code => {
        const other = allItems.find(candidate => candidate.code === code);
        return conflictsFor(other).includes(item.code) || conflictsFor(other).includes(item.parent);
      });
    });
    if (!conflict) return "";
    return `“${item.name}”与“${conflict.name}”在牙位/部位“${window.FJ_SCOPE.label(scope)}”不能同时收费。`;
  }

  function validateApplicability(item, toothScope = currentScope()) {
    if (!isBillableBranch()) return "该治疗路径尚未完成临床规则审核，目录项目目前仅供查阅。";
    const selectedTooth = scope.parse(toothScope);
    if (selectedTooth?.kind === "teeth") {
      const primary = Number(selectedTooth.teeth[0][0]) >= 5;
      if (primary !== (el.rootToothType.value === "primary")) return "牙体类型与所选标准牙位不一致，请先核对恒牙/乳牙。";
    }
    const definition = currentPhase()?.items.find(candidate => candidate.code === item?.code);
    if (!definition || !matchesWhen(definition.when)) return `“${item?.name || "该项目"}”不属于当前治疗路径、就诊环节或患者条件。`;
    if (item.limit === "未成年人" && el.rootPatientType.value !== "child") return `“${item.name}”仅适用于未成年人。`;
    if (item.parent) {
      const parent = catalog.find(candidate => candidate.code === item.parent);
      if (!parent) return "分项缺少目录主项目。";
    }
    return "";
  }

  function addService(code, rootQuantity = "") {
    const item = catalog.find(entry => entry.code === code);
    if (!item) return;
    const applicability = validateApplicability(item);
    if (applicability) return showToast(applicability);
    if (workflowAdded(code)) {
      showToast(`“${item.name}”已在本次明细中，可直接调整数量。`);
      return;
    }
    const scope = currentScope();
    if (needsScope(item) && !scope) {
      showToast(`请先选择“${item.name}”对应的标准牙位。`);
      el.tooth.focus();
      return;
    }
    const message = addValidation(item, scope);
    if (message) {
      showToast(message);
      return;
    }
    const price = item.custom ? requestCustomPrice(item) : activePrice(item);
    if (price === null) return;
    const actualRoots = item.rootLinked ? actualRootsOrError(item, rootQuantity) : 1;
    if (actualRoots === null) return;
    if (!entries.length) lockedContext = routeContext();
    const line = newEntry(item, price, false, scope);
    line.qty = actualRoots;
    entries.push(line);
    afterEntriesChanged();
    showToast(`已加入：${item.name}`);
  }

  function addVariant(code, rootQuantity = "") {
    const item = variants.find(entry => entry.code === code);
    if (!item) return;
    const applicability = validateApplicability(item);
    if (applicability) return showToast(applicability);
    if (workflowAdded(code)) {
      showToast(`“${item.name}”已在本次明细中。`);
      return;
    }
    if (!selectedCodes().includes(item.parent)) {
      const parentName = catalog.find(parent => parent.code === item.parent)?.name || "对应项目";
      showToast(`请先加入依附主项目“${parentName}”。`);
      return;
    }
    const parentEntry = entries.find(entry => entry.kind === "service" && (entry.catalogCode || entry.code) === item.parent && scope.same(currentScope(), entry.scope));
    if (!parentEntry) return showToast("请先在当前牙位加入对应主项目；替代项不能作为加收项依附主项。");
    const targetScope = parentEntry.scope;
    const message = addValidation(item, targetScope, parentEntry.uid);
    if (message) {
      showToast(message);
      return;
    }
    if (item.type === "add") {
      const price = item.custom ? requestCustomPrice(item) : priceCap(item);
      if (price === null) return;
      const actualRoots = item.rootLinked ? actualRootsOrError(item, rootQuantity, parentEntry.qty) : parentEntry.qty;
      if (actualRoots === null) return;
      const addition = newEntry(item, price, true, targetScope);
      addition.qty = actualRoots;
      addition.rootLinked = parentEntry.rootLinked && item.unit === parentEntry.unit;
      addition.rootCount = parentEntry.rootCount;
      entries.push(addition);
    } else {
      if (!parentEntry) {
        showToast("未找到需要替代的主项目，请重新加入主项目。");
        return;
      }
      const parentItem = catalog.find(parent => parent.code === item.parent);
      const replacementPrice = item.type === "extend"
        ? parentEntry.price
        : item.custom ? requestCustomPrice(item) : priceCap(item);
      if (replacementPrice === null) return;
      const replacement = newEntry(item, replacementPrice, true, targetScope);
      replacement.qty = parentEntry.qty;
      replacement.rootLinked = parentEntry.rootLinked;
      replacement.rootCount = parentEntry.rootCount;
      replacement.tierLinked = parentEntry.tierLinked;
      replacement.cap = Number.isFinite(item.type === "extend" ? activePrice(parentItem) : priceCap(item))
        ? (item.type === "extend" ? activePrice(parentItem) : priceCap(item))
        : null;
      replacement.parentCode = null;
      entries = entries.filter(entry => entry.uid !== parentEntry.uid && !(entry.kind === "service" && entry.baseCode === item.parent && scope.same(entry.scope, targetScope)));
      entries.push(replacement);
    }
    afterEntriesChanged();
    showToast(item.type === "add" ? `已加入加收项：${item.name}` : `已用“${item.name}”替代主项目计价。`);
  }

  function workflowOption(definition) {
    const item = (definition.variant ? variants : catalog).find(candidate => candidate.code === definition.code);
    if (!item) return "";
    const added = workflowAdded(item.code);
    const parentReady = !definition.variant || entries.some(entry => (entry.catalogCode || entry.code) === item.parent && scope.same(entry.scope, currentScope()));
    const parent = definition.variant && entries.find(entry => (entry.catalogCode || entry.code) === item.parent && scope.same(entry.scope, currentScope()));
    const billable = isBillableBranch();
    const status = !billable ? "待临床审核" : added ? "已加入" : parentReady ? "加入" : "先加主项";
    const quantity = billable && item.rootLinked && item.type !== "extend" ? `<input type="number" min="1" max="${item.type === "add" ? parent?.qty || currentRoots() : currentRoots()}" step="1" inputmode="numeric" placeholder="实际根数" aria-label="${safe(item.name)}实际根管数" data-workflow-qty="${item.code}" ${!parentReady || added ? "disabled" : ""} />` : "";
    return `<div class="workflow-option"><div><strong>${safe(item.name)}${definition.required ? ' <span class="rule-flag">流程参考主项</span>' : ""}</strong><small>${safe(item.code)} · ${safe(item.unit)} · ${safe(definition.reason || "按实际实施情况选择")} · 上限 ${priceLabel(item)}</small><small>项目/价格证据 A（福建附件）；路径适用性 C（待院方确认）。${safe(definition.evidence || "福建附件项目")}；${billable ? "仅内部规则预演" : "当前仅作目录索引，不代表临床可开"}</small></div><div class="workflow-action">${quantity}<button type="button" data-workflow-add="${item.code}" data-workflow-variant="${Boolean(definition.variant)}" ${!billable || added || !parentReady ? "disabled" : ""}>${status}</button></div></div>`;
  }

  function renderWorkflow() {
    const treatment = currentTreatment();
    const branch = currentBranch();
    const phase = currentPhase();
    if (!treatment || !branch || !phase) {
      el.workflowOptions.innerHTML = `<div class="workflow-empty">尚未加载治疗流程规则。</div>`;
      return;
    }
    updateWorkflowControlVisibility();
    const baseDefinitions = phase.items.filter(item => matchesWhen(item.when));
    const directoryOnly = !isBillableBranch();
    const definitions = directoryOnly
      ? baseDefinitions.flatMap(definition => [
          definition,
          ...variants
            .filter(item => item.parent === definition.code)
            .map(item => ({
              code: item.code,
              variant: true,
              reason: `附件${item.type === "add" ? "加收" : item.type === "reduce" ? "减收" : "扩展"}项，须依附主项目`,
              evidence: "福建附件分项"
            }))
        ])
      : baseDefinitions;
    el.workflowTitle.textContent = `${treatment.name}${directoryOnly ? "目录查阅" : "开单（待临床确认）"}`;
    el.workflowBadge.textContent = `${directoryOnly ? "临床规则待审" : treatment.status} · v${treatment.version}`;
    el.workflowNote.textContent = branch.note;
    el.workflowSource.textContent = `规则来源：${treatment.source}`;
    el.workflowOptions.innerHTML = `<section class="workflow-phase"><h4>${safe(phase.name)}<span>${safe(phase.hint)}</span></h4><div class="workflow-options">${definitions.map(workflowOption).join("") || '<div class="workflow-empty">当前条件没有可选项目。</div>'}</div></section>`;
    renderPrintContext();
  }

  function calculateTotal(items = entries) {
    return items.reduce((sum, entry) => sum + Number(entry.qty || 0) * Number(entry.price || 0), 0);
  }

  function updateTotalsSummary() {
    const tech = calculateTotal(entries.filter(entry => entry.kind === "service"));
    const consumables = calculateTotal(entries.filter(entry => entry.kind === "consumable"));
    el.lineCount.textContent = `${entries.length} 项`;
    el.total.textContent = money(tech + consumables);
    el.breakdown.innerHTML = `<span>技术费 <b>${money(tech)}</b></span><span>耗材费 <b>${money(consumables)}</b></span>`;
  }

  function quantityLimit(entry) {
    if (!entry.rootLinked) return Infinity;
    const parent = entry.parentCode && entries.find(candidate => (candidate.catalogCode || candidate.code) === entry.parentCode && scope.same(candidate.scope, entry.scope));
    return Math.min(entry.rootCount, parent?.qty ?? Infinity);
  }

  function setEntryQuantity(entry, quantity) {
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > quantityLimit(entry)) return false;
    entry.qty = quantity;
    entries.filter(candidate => candidate.parentCode === (entry.catalogCode || entry.code) && scope.same(candidate.scope, entry.scope))
      .forEach(candidate => { candidate.qty = Math.min(candidate.qty, quantity); });
    return true;
  }

  function renderLines() {
    updateTotalsSummary();
    [el.print, el.clear].forEach(button => { button.disabled = entries.length === 0; });
    el.fresh.disabled = false;
    el.savePackage.disabled = entries.length === 0;

    if (!entries.length) {
      el.lineArea.innerHTML = `<div class="empty-lines">尚未加入收费项目。<br /><b>从左侧治疗流程选择本次实施项目</b>；耗材需等待机构目录接入。</div>`;
      return;
    }

    el.lineArea.innerHTML = `<div class="table-scroll"><table class="item-table"><thead><tr><th>项目</th><th>编码 / 单位</th><th>牙位 / 部位</th><th>数量</th><th>单价（可下调）</th><th>小计</th><th>操作</th></tr></thead><tbody>${entries.map(entry => {
      const kind = entry.kind === "service"
        ? entry.variantType === "add" ? "加收" : entry.variantType === "reduce" ? "减收替代" : entry.variantType === "extend" ? "扩展替代" : "技术"
        : "旧耗材";
      const kindClass = entry.kind !== "service" ? " consume" : ["reduce", "extend"].includes(entry.variantType) ? " replace" : "";
      const code = entry.kind === "service" ? entry.code : "机构耗材目录";
      const cap = entry.kind === "service" && Number.isFinite(entry.cap) ? entry.cap : null;
      return `<tr><td class="name-cell"><div class="service-name"><span class="type-chip${kindClass}">${kind}</span>${safe(entry.name)}</div></td><td><span class="item-code">${safe(code)} · ${safe(entry.unit)}</span></td><td><span class="scope-label">${safe(scope.label(entry.scope))}</span></td><td><input class="qty-input" type="number" min="1" ${entry.rootLinked ? `max="${entry.rootCount}"` : ""} step="1" value="${entry.qty}" data-quantity="${entry.uid}" aria-label="${safe(entry.name)}数量" /></td><td class="money"><input class="price-input" type="number" min="0" max="${cap ?? ""}" step="0.01" value="${entry.price}" data-price="${entry.uid}" aria-label="${safe(entry.name)}单价" />${cap !== null ? `<span class="cap-note">上限 ${money(cap)}</span>` : ""}</td><td class="money">${money(entry.qty * entry.price)}</td><td><button class="remove" type="button" data-remove="${entry.uid}" aria-label="删除${safe(entry.name)}">×</button></td></tr>`;
    }).join("")}</tbody></table></div>`;
  }

  function afterEntriesChanged() {
    if (!entries.length) lockedContext = null;
    saveEntries();
    renderCatalog();
    renderWorkflow();
    renderLines();
  }

  function missingCoreItems(candidateEntries = entries) {
    const phase = currentPhase();
    const scopes = [...new Set(candidateEntries.map(entry => scope.label(entry.scope)))];
    const missing = scopes.flatMap(tooth => (phase?.items || [])
      .filter(definition => definition.required && matchesWhen(definition.when) && !candidateEntries.some(entry => scope.label(entry.scope) === tooth && entryCodes(entry).includes(definition.code)))
      .map(definition => `${tooth}：${findItem(definition.code)?.name || definition.code}`));
    if (currentBranch()?.id === "routine") {
      const coreCodes = new Set(["013105010030000", "013105010050000", "013105010060000", "013105010060100", "013105010070000", "013105010070100"]);
      scopes.forEach(tooth => {
        if (!candidateEntries.some(entry => scope.label(entry.scope) === tooth && entryCodes(entry).some(code => coreCodes.has(code)))) missing.push(`${tooth}：未选择根管治疗主操作（若本次仅检查，请人工确认）`);
      });
    }
    return missing;
  }

  function validateOrder(candidateEntries = entries) {
    if (!candidateEntries.length) return "本次没有可计价项目。";
    if (!isBillableBranch()) return "当前治疗路径仅供目录查阅，尚不能生成收费明细。";
    if (candidateEntries.some(entry => entry.kind !== "service")) return "旧版自由录入耗材未通过机构目录校验，不能保存或打印。";
    const keys = new Set();
    for (const entry of candidateEntries) {
      const item = findItem(entry.catalogCode || entry.code);
      if (!item) return `“${entry.name}”已不在当前福建目录中。`;
      const applicability = validateApplicability(item, entry.scope);
      if (applicability) return applicability;
      if (entry.treatmentId !== currentTreatment()?.id || entry.branchId !== currentBranch()?.id || entry.phaseId !== currentPhase()?.id || entry.visitId !== visitId) return `“${entry.name}”不属于本次就诊环节。`;
      const parsed = scope.parse(entry.scope);
      if (!parsed || parsed.kind !== "teeth" || parsed.teeth.length !== 1) return `“${entry.name}”需要有效的单牙标准牙位。`;
      if ((Number(parsed.teeth[0][0]) >= 5) !== (el.rootToothType.value === "primary")) return `“${entry.name}”牙位与恒牙/乳牙条件不符。`;
      const key = `${item.code}:${parsed.teeth[0]}`;
      if (keys.has(key)) return `“${entry.name}”在同一牙位重复开立。`;
      keys.add(key);
      const cap = priceCap(item);
      if (!Number.isFinite(Number(entry.price)) || Number(entry.price) < 0 || (Number.isFinite(cap) && Number(entry.price) > cap)) return `“${entry.name}”超过当前价格档位上限 ${money(cap)}或价格无效。`;
      if (!Number.isSafeInteger(Number(entry.qty)) || Number(entry.qty) < 1) return `“${entry.name}”数量必须是实际实施的正整数。`;
      if (item.rootLinked && (entry.rootLinked !== true || !Number.isSafeInteger(entry.rootCount) || entry.qty > entry.rootCount)) return `“${entry.name}”实际处理根管数不能超过本牙参考根管总数。`;
      if (item.type === "add") {
        const parent = candidateEntries.find(other => (other.catalogCode || other.code) === item.parent && scope.same(other.scope, entry.scope));
        if (!parent) return `加收项“${entry.name}”缺少同牙位主项目，替代项不能作为其主项。`;
        if (item.unit === "根管" && entry.qty > parent.qty) return `加收项“${entry.name}”根管数量不能超过主项目实际数量。`;
      }
    }
    for (let index = 0; index < candidateEntries.length; index += 1) {
      const first = candidateEntries[index];
      const firstItem = findItem(first.catalogCode || first.code);
      for (let cursor = index + 1; cursor < candidateEntries.length; cursor += 1) {
        const second = candidateEntries[cursor];
        const secondItem = findItem(second.catalogCode || second.code);
        if (!scope.overlaps(first.scope, second.scope)) continue;
        if (firstItem.type !== "add" && secondItem.type !== "add" && (firstItem.parent || firstItem.code) === (secondItem.parent || secondItem.code)) return `“${first.name}”与“${second.name}”不能在同一牙位作为两个主项计费。`;
        const conflict = entryCodes(second).some(code => conflictsFor(firstItem).includes(code)) || entryCodes(first).some(code => conflictsFor(secondItem).includes(code));
        if (conflict) return `“${first.name}”与“${second.name}”在同一牙位/部位互斥。`;
      }
    }
    return "";
  }

  function confirmSafety(actionLabel, candidateEntries = entries) {
    const error = validateOrder(candidateEntries);
    if (error) {
      showToast(`无法${actionLabel}：${error}`);
      return false;
    }
    const missing = missingCoreItems(candidateEntries);
    if (missing.length && !window.confirm(`当前阶段缺少临床流程参考主项：${missing.join("、")}。该流程归类尚待医院确认。\n仍要${actionLabel}吗？`)) return false;
    const hasIrrigation = candidateEntries.some(entry => ["013105010060000", "013105010060100"].includes(entry.catalogCode || entry.code));
    if (hasIrrigation && !window.confirm(`根管冲洗/封药的计价单位为“根管”，但同次多根管如何计次仍待福建医院医保物价部门确认。当前数量仅供内部模拟，不可据此正式收费。\n继续${actionLabel}吗？`)) return false;
    return true;
  }

  function packageSnapshot() {
    return entries
      .filter(entry => entry.kind === "service")
      .map(({ uid, ...entry }) => ({ ...entry, scope: null, tierLinked: false }));
  }

  function renderPackages() {
    el.packageCount.textContent = `${savedPackages.length} 个`;
    if (!savedPackages.length) {
      el.packageList.innerHTML = `<div class="package-empty">尚未保存套餐。<br />套餐只保存在当前浏览器。</div>`;
      return;
    }
    el.packageList.innerHTML = savedPackages.map(item => `<article class="package-item"><div class="package-item-main"><div><strong>${safe(item.name)}</strong><small>${safe(contextLabels(item.context) || "自定义项目组合")} · ${item.items.length} 项 · ${item.ruleVersion === ruleVersion ? "当前规则" : "旧规则，需重建"}</small></div><span class="package-amount">${money(item.total)}</span></div><div class="package-actions"><button type="button" data-package-action="apply" data-package-id="${safe(item.id)}" ${item.ruleVersion === ruleVersion ? "" : "disabled"}>使用</button><button type="button" data-package-action="update" data-package-id="${safe(item.id)}">用当前明细更新</button><button type="button" data-package-action="delete" data-package-id="${safe(item.id)}">删除</button></div></article>`).join("");
  }

  function createPackageRecord(name, id = `${Date.now()}-${Math.random().toString(16).slice(2)}`) {
    const items = packageSnapshot();
    return {
      id,
      name,
      context: currentWorkflowContext(),
      items,
      total: calculateTotal(items),
      ruleVersion,
      updatedAt: new Date().toISOString()
    };
  }

  function saveCurrentPackage() {
    const name = el.packageName.value.trim();
    if (!entries.length) {
      showToast("请先选择本次收费项目。");
      return;
    }
    if (!name) {
      showToast("请填写套餐名称，例如“磨牙3根管治疗（711）”。");
      el.packageName.focus();
      return;
    }
    if (savedPackages.some(item => item.name === name)) {
      showToast("已有同名套餐，请改名或使用“用当前明细更新”。");
      return;
    }
    if (!singleScopePackage()) return;
    if (!confirmSafety("保存套餐")) return;
    if (!packageSnapshot().length) {
      showToast("当前没有可保存的技术服务项目；手工耗材不会保存进套餐。");
      return;
    }
    savedPackages.unshift(createPackageRecord(name));
    savePackages();
    renderPackages();
    el.packageName.value = "";
    showToast(`已保存套餐：${name}`);
  }

  function singleScopePackage() {
    const scopes = new Set(entries.filter(entry => entry.kind === "service").map(entry => scope.label(entry.scope)));
    if (scopes.size === 1) return true;
    showToast("当前仅支持单牙位套餐；请分别保存每颗牙的套餐。");
    return false;
  }

  function applyPackage(item) {
    if (item.ruleVersion !== ruleVersion) {
      showToast("该套餐来自旧规则版本，请用当前明细重新核对并更新后再使用。");
      return;
    }
    if (item.context?.treatmentId !== currentTreatment()?.id || item.context?.branchId !== currentBranch()?.id || item.context?.phaseId !== currentPhase()?.id) {
      showToast("请先选择该套餐对应的治疗类型和本次就诊环节。");
      return;
    }
    const targetScope = currentScope();
    if (!targetScope || targetScope.kind !== "teeth" || targetScope.teeth.length !== 1) {
      showToast("请先选择本次治疗的标准牙位，再调用套餐。");
      el.tooth.focus();
      return;
    }
    if (!Array.isArray(item.items) || item.items.some(entry => entry.rootLinked && entry.rootCount !== currentRoots())) {
      showToast("套餐根管数与当前选择不一致，请调整根管数或重新制作套餐。");
      return;
    }
    const candidateEntries = item.items.filter(entry => entry.kind === "service").map(entry => {
      const source = findItem(entry.catalogCode || entry.code);
      const cap = Number.isFinite(priceCap(source)) ? priceCap(source) : entry.cap;
      return {
        ...entry,
        uid: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        cap,
        scope: structuredClone(targetScope),
        treatmentId: currentTreatment()?.id,
        branchId: currentBranch()?.id,
        phaseId: currentPhase()?.id,
        visitId,
        tierLinked: false
      };
    });
    if (!confirmSafety("使用套餐", candidateEntries)) return;
    if (entries.length && !window.confirm("使用套餐会替换当前收费明细，确定继续吗？")) return;
    lockedContext = routeContext();
    entries = candidateEntries;
    afterEntriesChanged();
    showToast(`已使用套餐：${item.name}`);
  }

  function updatePackage(item) {
    if (!entries.length) {
      showToast("当前没有可用于更新套餐的收费明细。");
      return;
    }
    if (!singleScopePackage()) return;
    if (!confirmSafety("更新套餐")) return;
    if (!packageSnapshot().length) {
      showToast("当前没有可用于更新套餐的技术服务项目。");
      return;
    }
    const replacement = createPackageRecord(item.name, item.id);
    savedPackages = savedPackages.map(candidate => candidate.id === item.id ? replacement : candidate);
    savePackages();
    renderPackages();
    showToast(`已更新套餐：${item.name}`);
  }

  function deletePackage(item) {
    if (!window.confirm(`确定删除套餐“${item.name}”吗？`)) return;
    savedPackages = savedPackages.filter(candidate => candidate.id !== item.id);
    savePackages();
    renderPackages();
    showToast("套餐已删除。");
  }

  el.categoryList.addEventListener("click", event => {
    const button = event.target.closest("[data-category]");
    if (!button) return;
    activeCategory = button.dataset.category;
    renderCategories();
    renderCatalog();
  });

  el.catalogSearch.addEventListener("input", event => {
    searchQuery = event.target.value;
    renderCatalog();
  });

  el.catalog.addEventListener("click", event => {
    const variantButton = event.target.closest("[data-add-variant]");
    if (variantButton) {
      addVariant(variantButton.dataset.addVariant);
      return;
    }
    const button = event.target.closest("[data-add-service]");
    if (button) addService(button.dataset.addService);
  });

  el.workflowOptions.addEventListener("click", event => {
    const button = event.target.closest("[data-workflow-add]");
    if (!button) return;
    const quantity = button.closest(".workflow-option")?.querySelector("[data-workflow-qty]")?.value || "";
    if (button.dataset.workflowVariant === "true") addVariant(button.dataset.workflowAdd, quantity);
    else addService(button.dataset.workflowAdd, quantity);
  });

  el.treatmentSelect.addEventListener("change", () => {
    syncBranchOptions();
    syncPhaseOptions();
    guardRouteChange();
  });

  el.branchSelect.addEventListener("change", () => {
    syncPhaseOptions();
    guardRouteChange();
  });

  [el.phaseSelect, el.rootToothType, el.rootPatientType, el.rootAnomaly, el.rootMedication]
    .forEach(node => node.addEventListener("change", guardRouteChange));

  el.rootCount.addEventListener("change", () => {
    const roots = currentRoots();
    const related = entries.filter(entry => scope.same(entry.scope, currentScope()));
    if (related.some(entry => entry.rootLinked && entry.qty > roots)) {
      el.rootCount.value = String(related[0].rootCount);
      showToast("参考根管总数不能小于已加入项目的实际处理数量。请先修改明细数量。");
      return;
    }
    el.rootCount.value = String(roots);
    related.forEach(entry => { entry.rootCount = roots; });
    saveEntries();
    renderLines();
    renderWorkflow();
    renderPrintContext();
    if (related.length) showToast(`已更新本牙参考根管总数为 ${roots}；各项目实际数量保持不变。`);
  });

  el.priceTier.addEventListener("change", () => {
    let changed = 0;
    let clamped = 0;
    entries.forEach(entry => {
      if (entry.kind !== "service") return;
      const item = findItem(entry.catalogCode || entry.code);
      const cap = priceCap(item);
      entry.cap = Number.isFinite(cap) ? cap : null;
      if (entry.tierLinked && Number.isFinite(cap)) {
        entry.price = cap;
        changed += 1;
      } else if (Number.isFinite(cap) && entry.price > cap) {
        entry.price = cap;
        clamped += 1;
      }
    });
    saveEntries();
    renderCatalog();
    renderWorkflow();
    renderLines();
    renderPrintContext();
    if (clamped) showToast(`有 ${clamped} 项手动价格超过新档位上限，已自动降至上限。`);
    else if (changed) showToast(`已按${el.priceTier.options[el.priceTier.selectedIndex].text}价格档位更新 ${changed} 项技术服务。`);
  });

  el.lineArea.addEventListener("input", event => {
    const priceInput = event.target.closest("[data-price]");
    if (priceInput) {
      const entry = entries.find(item => item.uid === priceInput.dataset.price);
      if (!entry || priceInput.value === "") return;
      const raw = Number(priceInput.value);
      if (!Number.isFinite(raw) || raw < 0) return;
      const cap = Number.isFinite(entry.cap) ? entry.cap : Infinity;
      if (raw > cap) {
        entry.price = cap;
        priceInput.value = String(cap);
        showToast(`单价不能超过文件上限 ${money(cap)}。`);
      } else {
        entry.price = raw;
      }
      entry.tierLinked = false;
      saveEntries();
      updateTotalsSummary();
      return;
    }

    const quantityInput = event.target.closest("[data-quantity]");
    if (!quantityInput || quantityInput.value === "") return;
    const entry = entries.find(item => item.uid === quantityInput.dataset.quantity);
    const quantity = Number(quantityInput.value);
    if (!entry || !setEntryQuantity(entry, quantity)) return;
    saveEntries();
    updateTotalsSummary();
  });

  el.lineArea.addEventListener("change", event => {
    const priceInput = event.target.closest("[data-price]");
    if (priceInput) {
      const entry = entries.find(item => item.uid === priceInput.dataset.price);
      if (!entry) return;
      const raw = Number(priceInput.value);
      const cap = Number.isFinite(entry.cap) ? entry.cap : Infinity;
      if (!Number.isFinite(raw) || raw < 0) {
        priceInput.value = entry.price;
        showToast("请输入有效的单价。");
        return;
      }
      if (raw > cap) {
        entry.price = cap;
        showToast(`单价不能超过文件上限 ${money(cap)}。`);
      } else {
        entry.price = raw;
      }
      entry.tierLinked = false;
      saveEntries();
      renderLines();
      renderWorkflow();
      return;
    }

    const quantityInput = event.target.closest("[data-quantity]");
    if (quantityInput) {
      const entry = entries.find(item => item.uid === quantityInput.dataset.quantity);
      if (!entry) return;
      if (!setEntryQuantity(entry, Number(quantityInput.value))) {
        quantityInput.value = String(entry.qty);
        showToast(`实际数量必须是 1–${quantityLimit(entry)} 的整数。`);
        return;
      }
      saveEntries();
      renderLines();
      renderWorkflow();
      return;
    }

    const scopeInput = event.target.closest("[data-scope]");
    if (!scopeInput) return;
    const entry = entries.find(item => item.uid === scopeInput.dataset.scope);
    const source = entry ? findItem(entry.catalogCode || entry.code) : null;
    if (!entry || !source) return;
    const nextScope = scopeInput.value.trim();
    if (needsScope(source) && !nextScope) {
      scopeInput.value = entry.scope || "";
      showToast("该项目必须填写牙位或治疗部位。");
      return;
    }
    const message = addValidation(source, nextScope, entry.uid);
    if (message) {
      scopeInput.value = entry.scope || "";
      showToast(message);
      return;
    }
    const oldScope = entry.scope;
    entry.scope = nextScope;
    entries.forEach(candidate => {
      if (candidate.parentCode === entry.baseCode && candidate.scope === oldScope) candidate.scope = nextScope;
    });
    saveEntries();
    renderPrintContext();
  });

  el.lineArea.addEventListener("click", event => {
    const button = event.target.closest("[data-remove]");
    if (!button) return;
    const removed = entries.find(entry => entry.uid === button.dataset.remove);
    if (!removed) return;
    const removedCode = removed.catalogCode || removed.code;
    const removedBase = removed.baseCode || removedCode;
    entries = removed.variantType === "add"
      ? entries.filter(entry => entry.uid !== removed.uid)
      : entries.filter(entry => entry.uid !== removed.uid && entry.parentCode !== removedCode && entry.parentCode !== removedBase);
    afterEntriesChanged();
    showToast("已删除该明细及其依附分项。");
  });

  el.consumableForm.addEventListener("submit", event => {
    event.preventDefault();
    showToast("耗材自由录入已停用，待接入医院耗材目录和实际采购价。");
  });

  el.savePackage.addEventListener("click", saveCurrentPackage);

  el.packageList.addEventListener("click", event => {
    const button = event.target.closest("[data-package-action]");
    if (!button) return;
    const item = savedPackages.find(candidate => candidate.id === button.dataset.packageId);
    if (!item) return;
    const action = button.dataset.packageAction;
    if (action === "apply") applyPackage(item);
    if (action === "update") updatePackage(item);
    if (action === "delete") deletePackage(item);
  });

  el.clear.addEventListener("click", () => {
    if (!entries.length || !window.confirm("确定清空本次所有收费明细吗？")) return;
    entries = [];
    lockedContext = null;
    visitId = newVisitId();
    afterEntriesChanged();
    showToast("本次明细已清空。");
  });

  el.fresh.addEventListener("click", () => {
    if ((entries.length || el.patient.value || el.medicalNo.value || el.note.value) && !window.confirm("确定新建空白单据吗？当前患者信息和收费明细将移除。")) return;
    entries = [];
    lockedContext = null;
    visitId = newVisitId();
    el.patient.value = "";
    el.medicalNo.value = "";
    el.tooth.value = "";
    el.diagnosis.value = "";
    el.note.value = "";
    el.date.value = localDate();
    afterEntriesChanged();
    renderCatalog();
    renderPrintContext();
    showToast("已新建空白单据。");
  });

  el.print.addEventListener("click", () => {
    if (!entries.length) return;
    if (!confirmSafety("打印内部体验清单")) return;
    renderPrintContext();
    window.print();
  });

  [el.patient, el.medicalNo, el.doctor, el.diagnosis, el.note, el.date]
    .forEach(node => node.addEventListener("input", () => { renderPrintContext(); saveEntries(); }));

  el.tooth.addEventListener("change", () => {
    const existing = entries.find(entry => scope.same(entry.scope, currentScope()));
    el.rootCount.value = String(existing?.rootCount || 3);
    renderCatalog();
    renderWorkflow();
    renderPrintContext();
    saveEntries();
  });

  if (!catalog.length) showToast("未加载福建项目目录，请检查 catalog.js 文件。");
  if (!treatments.length) showToast("未加载治疗流程规则，请检查 treatment-rules.js 文件。");
  syncTreatmentOptions(lockedContext?.treatmentId || "root-canal");
  syncBranchOptions(lockedContext?.branchId);
  syncPhaseOptions(lockedContext?.phaseId);
  if (lockedContext) {
    el.rootPatientType.value = lockedContext.patient;
    el.rootToothType.value = lockedContext.toothType;
    el.rootAnomaly.checked = lockedContext.anomaly;
    el.rootMedication.checked = lockedContext.medication;
  }
  if (entries.length && validateOrder()) {
    entries = [];
    lockedContext = null;
    visitId = newVisitId();
    showToast("本地旧明细未通过当前规则校验，已从本次单据移除；请重新核对开单。");
    saveEntries();
  }
  renderCategories();
  renderCatalog();
  renderWorkflow();
  renderLines();
  renderPackages();
  renderPrintContext();
})();
