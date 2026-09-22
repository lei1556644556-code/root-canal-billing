(() => {
  const catalog = Array.isArray(window.FJ_CATALOG) ? window.FJ_CATALOG : [];
  const variants = Array.isArray(window.FJ_VARIANTS) ? window.FJ_VARIANTS : [];
  const treatments = Array.isArray(window.FJ_TREATMENTS) ? window.FJ_TREATMENTS : [];
  const orderKey = "fujian-oral-itemized-billing-v4";
  const packageKey = "fujian-oral-itemized-packages-v1";

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
  let entries = loadJson(orderKey, loadJson("fujian-oral-itemized-billing-v3", []));
  let savedPackages = loadJson(packageKey, []);
  let toastTimer;

  el.date.value = localDate();

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
    storeJson(orderKey, entries, "当前浏览器无法保存记录，但本次清单仍可打印。");
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
    return Number(el.rootCount.value);
  }

  function activePrice(item) {
    return item?.[el.priceTier.value];
  }

  function findItem(code) {
    return catalog.find(item => item.code === code) || variants.find(item => item.code === code);
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
    const isRootCanal = treatment?.id === "root-canal";
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
    const isRootCanal = currentTreatment()?.id === "root-canal";
    const fields = [
      `患者：${el.patient.value.trim() || "未填写"}`,
      `病历号：${el.medicalNo.value.trim() || "未填写"}`,
      `治疗：${contextLabels() || "未选择"}`,
      `牙位：${el.tooth.value.trim() || "未填写"}`,
      isRootCanal ? `根管数：${currentRoots()} 根` : "",
      `诊断：${el.diagnosis.value}`,
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
    const price = activePrice(item);
    return Number.isFinite(price) ? money(price) : "自主定价";
  }

  function workflowAdded(code) {
    return entries.some(entry => entry.kind === "service" && (entry.catalogCode || entry.code) === code);
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
      const parentAdded = workflowAdded(item.code);
      const childItems = parentAdded ? variants.filter(variant => variant.parent === item.code) : [];
      const variantHtml = childItems.length ? `<div class="variant-wrap"><p>已加入主项目，可选分项</p><div class="variant-list">${childItems.map(variant => `<div class="variant-item"><span>${safe(variant.name)}</span><b>${priceLabel(variant)}</b><button class="variant-add" type="button" data-add-variant="${variant.code}" aria-label="加入${safe(variant.name)}">+</button></div>`).join("")}</div></div>` : "";
      return `<article class="catalog-item"><div><h3>${safe(item.name)}</h3><p>${item.code} · ${safe(item.unit)} · 附件第 ${item.page} 页</p><div class="catalog-tags">${tags}</div></div><div class="catalog-price"><span>${priceLabel(item)}</span><button class="add-mini" type="button" data-add-service="${item.code}" aria-label="加入${safe(item.name)}">+</button></div>${variantHtml}</article>`;
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

  function newEntry(item, price = activePrice(item), isVariant = false) {
    return {
      uid: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      kind: "service",
      catalogCode: item.code,
      code: item.code,
      name: item.name,
      unit: item.unit,
      price,
      cap: Number.isFinite(activePrice(item)) ? activePrice(item) : null,
      qty: item.rootLinked ? currentRoots() : 1,
      rootLinked: Boolean(item.rootLinked),
      tierLinked: !item.custom,
      variant: isVariant,
      parentCode: item.parent || null
    };
  }

  function selectedCodes() {
    return entries.filter(entry => entry.kind === "service").map(entry => entry.catalogCode || entry.code);
  }

  function addValidation(item) {
    const selected = selectedCodes();
    const allItems = [...catalog, ...variants];
    const direct = (item.conflicts || []).find(code => selected.includes(code));
    const reverse = allItems.find(other => selected.includes(other.code) && (other.conflicts || []).includes(item.code));
    const conflictCode = direct || reverse?.code;
    if (!conflictCode) return "";
    const conflictName = allItems.find(other => other.code === conflictCode)?.name || "已选项目";
    return `“${item.name}”与“${conflictName}”在同一治疗部位不能同时收费。`;
  }

  function addService(code) {
    const item = catalog.find(entry => entry.code === code);
    if (!item) return;
    if (workflowAdded(code)) {
      showToast(`“${item.name}”已在本次明细中，可直接调整数量。`);
      return;
    }
    const message = addValidation(item);
    if (message) {
      showToast(message);
      return;
    }
    const price = item.custom ? requestCustomPrice(item) : activePrice(item);
    if (price === null) return;
    entries.push(newEntry(item, price));
    afterEntriesChanged();
    showToast(`已加入：${item.name}`);
  }

  function addVariant(code) {
    const item = variants.find(entry => entry.code === code);
    if (!item) return;
    if (workflowAdded(code)) {
      showToast(`“${item.name}”已在本次明细中。`);
      return;
    }
    if (!selectedCodes().includes(item.parent)) {
      const parentName = catalog.find(parent => parent.code === item.parent)?.name || "对应项目";
      showToast(`请先加入依附主项目“${parentName}”。`);
      return;
    }
    const message = addValidation(item);
    if (message) {
      showToast(message);
      return;
    }
    const price = item.custom ? requestCustomPrice(item) : activePrice(item);
    if (price === null) return;
    entries.push(newEntry(item, price, true));
    afterEntriesChanged();
    showToast(`已加入分项：${item.name}`);
  }

  function workflowOption(definition) {
    const item = (definition.variant ? variants : catalog).find(candidate => candidate.code === definition.code);
    if (!item) return "";
    const added = workflowAdded(item.code);
    const parentReady = !definition.variant || workflowAdded(item.parent);
    const status = added ? "已加入" : parentReady ? "加入" : "先加主项";
    return `<div class="workflow-option"><div><strong>${safe(item.name)}${definition.required ? ' <span class="rule-flag">流程主项</span>' : ""}</strong><small>${safe(item.code)} · ${safe(item.unit)} · ${safe(definition.reason || "按实际实施情况选择")} · 上限 ${priceLabel(item)}</small><small>依据：${safe(definition.evidence || "福建附件项目")}</small></div><button type="button" data-workflow-add="${item.code}" data-workflow-variant="${Boolean(definition.variant)}" ${added || !parentReady ? "disabled" : ""}>${status}</button></div>`;
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
    const definitions = treatment.status === "目录分类"
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
    el.workflowTitle.textContent = `${treatment.name}开单`;
    el.workflowBadge.textContent = `${treatment.status} · v${treatment.version}`;
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

  function renderLines() {
    updateTotalsSummary();
    [el.print, el.clear, el.fresh].forEach(button => { button.disabled = entries.length === 0; });
    el.savePackage.disabled = entries.length === 0;

    if (!entries.length) {
      el.lineArea.innerHTML = `<div class="empty-lines">尚未加入收费项目。<br /><b>从左侧治疗流程选择本次实施项目</b>，或在下方录入实际使用的耗材。</div>`;
      return;
    }

    el.lineArea.innerHTML = `<div class="table-scroll"><table class="item-table"><thead><tr><th>项目</th><th>编码 / 单位</th><th>数量</th><th>单价（可下调）</th><th>小计</th><th>操作</th></tr></thead><tbody>${entries.map(entry => {
      const kind = entry.kind === "service" ? (entry.variant ? "分项" : "技术") : "耗材";
      const kindClass = entry.kind === "service" ? "" : " consume";
      const code = entry.kind === "service" ? entry.code : "机构耗材目录";
      const cap = entry.kind === "service" && Number.isFinite(entry.cap) ? entry.cap : null;
      return `<tr><td class="name-cell"><div class="service-name"><span class="type-chip${kindClass}">${kind}</span>${safe(entry.name)}</div></td><td><span class="item-code">${safe(code)} · ${safe(entry.unit)}</span></td><td><input class="qty-input" type="number" min="1" step="1" value="${entry.qty}" data-quantity="${entry.uid}" aria-label="${safe(entry.name)}数量" /></td><td class="money">${entry.kind === "service" ? `<input class="price-input" type="number" min="0" max="${cap ?? ""}" step="0.01" value="${entry.price}" data-price="${entry.uid}" aria-label="${safe(entry.name)}单价" />${cap !== null ? `<span class="cap-note">上限 ${money(cap)}</span>` : ""}` : money(entry.price)}</td><td class="money">${money(entry.qty * entry.price)}</td><td><button class="remove" type="button" data-remove="${entry.uid}" aria-label="删除${safe(entry.name)}">×</button></td></tr>`;
    }).join("")}</tbody></table></div>`;
  }

  function afterEntriesChanged() {
    saveEntries();
    renderCatalog();
    renderWorkflow();
    renderLines();
  }

  function packageSnapshot() {
    return entries.map(({ uid, ...entry }) => ({ ...entry, rootLinked: false, tierLinked: false }));
  }

  function renderPackages() {
    el.packageCount.textContent = `${savedPackages.length} 个`;
    if (!savedPackages.length) {
      el.packageList.innerHTML = `<div class="package-empty">尚未保存套餐。<br />套餐只保存在当前浏览器。</div>`;
      return;
    }
    el.packageList.innerHTML = savedPackages.map(item => `<article class="package-item"><div class="package-item-main"><div><strong>${safe(item.name)}</strong><small>${safe(contextLabels(item.context) || "自定义项目组合")} · ${item.items.length} 项</small></div><span class="package-amount">${money(item.total)}</span></div><div class="package-actions"><button type="button" data-package-action="apply" data-package-id="${item.id}">使用</button><button type="button" data-package-action="update" data-package-id="${item.id}">用当前明细更新</button><button type="button" data-package-action="delete" data-package-id="${item.id}">删除</button></div></article>`).join("");
  }

  function createPackageRecord(name, id = `${Date.now()}-${Math.random().toString(16).slice(2)}`) {
    const items = packageSnapshot();
    return {
      id,
      name,
      context: currentWorkflowContext(),
      items,
      total: calculateTotal(items),
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
    savedPackages.unshift(createPackageRecord(name));
    savePackages();
    renderPackages();
    el.packageName.value = "";
    showToast(`已保存套餐：${name}`);
  }

  function restoreWorkflowContext(context = {}) {
    syncTreatmentOptions(context.treatmentId);
    syncBranchOptions(context.branchId);
    syncPhaseOptions(context.phaseId);
    if (["adult", "child"].includes(context.patient)) el.rootPatientType.value = context.patient;
    if (["permanent", "primary"].includes(context.toothType)) el.rootToothType.value = context.toothType;
    el.rootAnomaly.checked = Boolean(context.anomaly);
    el.rootMedication.checked = Boolean(context.medication);
    if ([1, 2, 3, 4].includes(Number(context.rootCount))) el.rootCount.value = String(context.rootCount);
    if (["a", "b"].includes(context.priceTier)) el.priceTier.value = context.priceTier;
  }

  function applyPackage(item) {
    if (entries.length && !window.confirm("使用套餐会替换当前收费明细，确定继续吗？")) return;
    restoreWorkflowContext(item.context);
    const invalid = item.items.find(entry => {
      if (entry.kind !== "service") return false;
      const source = findItem(entry.catalogCode || entry.code);
      const cap = activePrice(source);
      return Number.isFinite(cap) && Number(entry.price) > cap;
    });
    if (invalid) {
      showToast(`套餐中的“${invalid.name}”超过当前价格档位上限，无法使用。`);
      return;
    }
    entries = item.items.map(entry => {
      const source = entry.kind === "service" ? findItem(entry.catalogCode || entry.code) : null;
      const cap = Number.isFinite(activePrice(source)) ? activePrice(source) : entry.cap;
      return {
        ...entry,
        uid: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        cap,
        rootLinked: false,
        tierLinked: false
      };
    });
    afterEntriesChanged();
    showToast(`已使用套餐：${item.name}`);
  }

  function updatePackage(item) {
    if (!entries.length) {
      showToast("当前没有可用于更新套餐的收费明细。");
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
    if (button.dataset.workflowVariant === "true") addVariant(button.dataset.workflowAdd);
    else addService(button.dataset.workflowAdd);
  });

  el.treatmentSelect.addEventListener("change", () => {
    syncBranchOptions();
    syncPhaseOptions();
    renderWorkflow();
  });

  el.branchSelect.addEventListener("change", () => {
    syncPhaseOptions();
    renderWorkflow();
  });

  [el.phaseSelect, el.rootToothType, el.rootPatientType, el.rootAnomaly, el.rootMedication]
    .forEach(node => node.addEventListener("change", renderWorkflow));

  el.rootCount.addEventListener("change", () => {
    const roots = currentRoots();
    let changed = 0;
    entries.forEach(entry => {
      if (entry.rootLinked) {
        entry.qty = roots;
        changed += 1;
      }
    });
    saveEntries();
    renderLines();
    renderPrintContext();
    if (changed) showToast(`已同步 ${changed} 项根管计价项目为 ${roots} 根。`);
  });

  el.priceTier.addEventListener("change", () => {
    let changed = 0;
    let clamped = 0;
    entries.forEach(entry => {
      if (entry.kind !== "service") return;
      const item = findItem(entry.catalogCode || entry.code);
      const cap = activePrice(item);
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
    const quantity = Math.floor(Number(quantityInput.value));
    if (!entry || !Number.isFinite(quantity) || quantity < 1) return;
    entry.qty = quantity;
    entry.rootLinked = false;
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
      return;
    }

    const quantityInput = event.target.closest("[data-quantity]");
    if (!quantityInput) return;
    const entry = entries.find(item => item.uid === quantityInput.dataset.quantity);
    if (!entry) return;
    entry.qty = Math.max(1, Math.floor(Number(quantityInput.value) || 1));
    entry.rootLinked = false;
    saveEntries();
    renderLines();
  });

  el.lineArea.addEventListener("click", event => {
    const button = event.target.closest("[data-remove]");
    if (!button) return;
    const removed = entries.find(entry => entry.uid === button.dataset.remove);
    if (!removed) return;
    const removedCode = removed.catalogCode || removed.code;
    entries = entries.filter(entry => entry.uid !== removed.uid && entry.parentCode !== removedCode);
    afterEntriesChanged();
    showToast("已删除该明细及其依附分项。");
  });

  el.consumableForm.addEventListener("submit", event => {
    event.preventDefault();
    const name = el.consumableName.value.trim();
    const price = Number(el.consumablePrice.value);
    const qty = Math.max(1, Math.floor(Number(el.consumableQty.value) || 1));
    if (!name) {
      showToast("请填写耗材或药品名称。");
      el.consumableName.focus();
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      showToast("请填写有效的耗材单价。");
      el.consumablePrice.focus();
      return;
    }
    entries.push({
      uid: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      kind: "consumable",
      code: "机构耗材目录",
      name,
      unit: "件",
      price,
      qty,
      rootLinked: false,
      tierLinked: false
    });
    saveEntries();
    renderLines();
    el.consumableForm.reset();
    el.consumableQty.value = "1";
    showToast(`已加入耗材：${name}`);
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
    afterEntriesChanged();
    showToast("本次明细已清空。");
  });

  el.fresh.addEventListener("click", () => {
    if (!entries.length || !window.confirm("确定新建空白单据吗？当前收费明细将移除。")) return;
    entries = [];
    afterEntriesChanged();
    showToast("已新建空白单据。");
  });

  el.print.addEventListener("click", () => {
    if (!entries.length) return;
    renderPrintContext();
    window.print();
  });

  [el.patient, el.medicalNo, el.doctor, el.tooth, el.diagnosis, el.date]
    .forEach(node => node.addEventListener("input", renderPrintContext));

  if (!catalog.length) showToast("未加载福建项目目录，请检查 catalog.js 文件。");
  if (!treatments.length) showToast("未加载治疗流程规则，请检查 treatment-rules.js 文件。");
  syncTreatmentOptions();
  syncBranchOptions();
  syncPhaseOptions();
  renderCategories();
  renderCatalog();
  renderWorkflow();
  renderLines();
  renderPackages();
  renderPrintContext();
})();
