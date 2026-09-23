(() => {
  const catalog = Array.isArray(window.FJ_CATALOG) ? window.FJ_CATALOG : [];
  const byNumber = new Map(catalog.map(item => [item.n, item]));
  const definitions = numbers => numbers.map(number => {
    const item = byNumber.get(number);
    if (!item) throw new Error(`福建附件主项目第 ${number} 项未录入目录`);
    return {
      code: item.code,
      reason: "此处仅为治疗用途索引，临床适用性待院方确认",
      evidence: `福建附件主项目第 ${number} 项；临床归类待确认`,
      priceEvidenceLevel: "A",
      clinicalEvidenceLevel: "C"
    };
  });
  const phase = (id, name, numbers, hint = "仅供查阅，不可直接开单") => ({
    id,
    name,
    hint,
    items: definitions(numbers)
  });
  const branch = (id, name, numbers, note) => ({
    id,
    name,
    status: "目录分类",
    note: note || "本路径是待审的治疗用途索引，不代表这些项目在同次就诊可同时收费。",
    phases: [phase(`${id}-items`, "相关价格项目（不可开单）", numbers)]
  });
  const treatment = (id, name, branches) => ({
    id,
    name,
    version: 4,
    status: "目录分类",
    source: "《闽医保〔2026〕45号》附件一确定项目名称与价格；治疗路径归类为待审模板，不自动生成收费候选",
    conditions: [],
    branches
  });

  const rootCanal = {
    id: "root-canal",
    name: "牙髓与根尖治疗（含根管）",
    version: 4,
    status: "临床流程待确认",
    source: "《闽医保〔2026〕45号》附件一；医院后台旧套餐仅作操作示例，不作为新政策计量依据",
    conditions: [
      { id: "age", label: "实际周岁", type: "integer", min: 0, max: 120 },
      { id: "tooth", label: "牙体类型", type: "select", options: [{ value: "permanent", label: "恒牙" }, { value: "primary", label: "乳牙" }] },
      { id: "anomaly", label: "根管异常", type: "boolean" },
      { id: "medication", label: "本次实际实施根管封药", type: "boolean" },
      { id: "foreignLocation", label: "异物位置", type: "select", options: [{ value: "other", label: "非根尖段" }, { value: "apical", label: "根尖段" }] }
    ],
    branches: [
      {
        id: "routine",
        name: "常规根管治疗",
        note: "医生确认本次实际实施的操作及各项实际处理根管数。冲洗与封药均按附件的“根管”单位计量；封药扩展项替代冲洗主项，不重复开立。临床路径仍待院方复核。",
        phases: [
          {
            id: "current-visit",
            name: "本次实际实施操作",
            hint: "逐项填写本次实际根管数量",
            items: [
              { code: "012406000010000", reason: "实际完成牙髓活力检查时选择", evidence: "福建附件主项目" },
              { code: "013105010010000", reason: "实际使用橡皮障时选择", evidence: "福建附件主项目" },
              { code: "013105010030000", reason: "实际实施牙髓失活时选择", evidence: "福建附件主项目" },
              { code: "013105010030001", variant: true, when: { ageMax: 6 }, reason: "6周岁及以下儿童牙髓失活加收；须确认实际适用", evidence: "福建附件加收项" },
              { code: "013105010050000", reason: "按本次实际预备的根管数计量", evidence: "福建附件主项目" },
              { code: "013105010050001", variant: true, when: { ageMax: 6 }, reason: "6周岁及以下儿童根管预备加收；须确认实际适用", evidence: "福建附件加收项" },
              { code: "013105010050011", variant: true, when: { anomaly: true }, reason: "仅按实际异常的根管数加收", evidence: "福建附件加收项" },
              { code: "013105010060000", reason: "按本次实际冲洗的根管数计量", evidence: "福建附件主项目第15项，计价单位为根管" },
              { code: "013105010060100", variant: true, when: { medication: true }, reason: "实际实施封药时替代冲洗项目，按根管计量", evidence: "福建附件扩展项，计价单位为根管" },
              { code: "013105010070000", reason: "按本次实际充填的根管数计量", evidence: "福建附件主项目" },
              { code: "013105010070001", variant: true, when: { ageMax: 6 }, reason: "6周岁及以下儿童根管充填加收；须确认实际适用", evidence: "福建附件加收项" },
              { code: "013105010070011", variant: true, when: { anomaly: true }, reason: "仅按实际异常的根管数加收", evidence: "福建附件加收项" },
              { code: "013105010070100", variant: true, when: { tooth: "primary" }, reason: "乳牙根管充填扩展项", evidence: "福建附件扩展项" }
            ]
          }
        ]
      },
      {
        id: "acute",
        name: "牙髓急症开髓引流",
        note: "仅用于牙髓急症的应急处置；与同一牙位的常规根管预备、冲洗和充填互斥。",
        phases: [{
          id: "acute-care",
          name: "急症处置项目",
          hint: "仅选择实际实施项目",
          items: [
            { code: "012406000010000", reason: "实际完成牙髓活力检查时选择", evidence: "福建附件主项目" },
            { code: "013105010020000", required: true, reason: "仅牙髓急症开髓引流", evidence: "福建附件主项目" },
            { code: "013105010020001", variant: true, when: { ageMax: 6 }, reason: "6周岁及以下儿童开髓引流加收；须确认实际适用", evidence: "福建附件加收项" }
          ]
        }]
      },
      {
        id: "retreat",
        name: "根管再治疗",
        note: "再治疗主项不自动带入预备、冲洗或充填；后续这些项目能否另计，待福建医院牙体牙髓科及医保物价人员确认，并非系统认定一律禁止。",
        phases: [{
          id: "retreatment",
          name: "根管再治疗项目",
          hint: "选择实际实施项目",
          items: [
            { code: "013105010080000", required: true, reason: "按实际根管数计量", evidence: "福建附件主项目" }
          ]
        }]
      },
      {
        id: "foreign",
        name: "根管内异物取出",
        note: "异物取出是独立治疗类型；根尖段异物加收必须依附根管内异物取出主项目。",
        phases: [{
          id: "foreign-removal",
          name: "异物取出项目",
          hint: "选择实际实施项目",
          items: [
            { code: "013105010090000", required: true, reason: "按实际根管数计量", evidence: "福建附件主项目" },
            { code: "013105010090001", variant: true, when: { foreignLocation: "apical" }, reason: "仅根尖段异物取出时加收", evidence: "福建附件加收项" }
          ]
        }]
      },
      branch("apical-induction", "根尖诱导成形", [81], "非根尖外科手术；治疗适用条件待院方确认。"),
      branch("apical-barrier", "根尖屏障", [82], "扩展项为髓腔穿孔修补，应进入独立临床路径；当前仅目录查阅。"),
      branch("perforation-repair", "髓腔穿孔修补", [82], "同一价格项目家族的另一临床路径；扩展项替代主项，待院方确认。"),
      branch("apical-surgery", "根尖外科手术", [83]),
      branch("pulp-preservation", "活髓保存 / 盖髓", [19]),
      branch("pulp-regeneration", "牙髓再生", [20]),
      branch("dry-pulp", "干髓治疗", [13])
    ]
  };

  const examinationTreatment = treatment("examination", "检查与评估", [
    branch("pulp-exam", "牙髓检查", [1]),
    branch("periodontal-exam", "牙周检查", [3, 4, 5], "全口系统检查与探诊、指数检查的并收限制须按附件及诊次核验。"),
    branch("function-exam", "咬合 / 下颌功能检查", [2, 6, 7, 8])
  ]);

  const restorativeTreatment = treatment("restorative", "牙体保存、充填与预防", [
    branch("direct-restoration", "牙体缺损直接粘接修复", [21]),
    branch("anterior-shape", "前牙形态修复", [22]),
    branch("preformed-crown", "预成冠修复", [28]),
    branch("prevention", "防龋", [23, 24]),
    branch("desensitization", "牙脱敏", [25]),
    branch("whitening", "牙齿漂白 / 脱色", [26, 27])
  ]);

  const periodontalBasic = treatment("periodontal-basic", "牙周基础治疗", [
    branch("scaling", "龈上洁治", [35]),
    branch("polishing", "牙面抛光", [36]),
    branch("sandblasting", "牙面喷砂", [37]),
    branch("subgingival", "龈下刮治", [38]),
    branch("root-planing", "根面平整（非手术）", [106], "与同牙本次牙周翻瓣、龈下刮治及同部位牙周冲洗上药存在附件限制。"),
    branch("periodontal-irrigation", "牙周冲洗上药", [33]),
    branch("periodontal-dressing", "牙周塞治 / 局部止血", [34]),
    branch("splinting", "松牙固定 / 拆除", [39, 40])
  ]);
  const periodontalSurgery = treatment("periodontal-surgery", "牙周手术", [
    branch("flap", "牙周翻瓣", [107]),
    branch("gingival-contour", "牙龈成形", [108]),
    branch("gingival-graft", "游离龈移植", [109]),
    branch("guided-regeneration", "引导性牙周组织再生", [110]),
    branch("fiberotomy", "牙周纤维环状切断", [111], "可作为正畸辅助操作交叉引用，实际适应证待院方确认。")
  ]);

  const extractionTreatment = treatment("extraction", "拔牙、阻生牙与拔牙创处置", [
    branch("simple-extraction", "普通牙拔除", [84], "乳牙同编码条件价11元；同部位不得再收儿童加收，当前仅查阅。"),
    branch("impacted-extraction", "阻生牙拔除", [85]),
    branch("impacted-eruption", "阻生牙开窗助萌（保留牙）", [86], "不是阻生牙拔除的附加项目；正畸路径可交叉引用。"),
    branch("coronectomy", "阻生牙牙冠切除", [87]),
    branch("socket-curettage", "拔牙创搔刮", [88], "仅限拔牙创愈合不良，不是当次拔牙默认候选。"),
    branch("operculum", "阻生牙龈瓣修整", [89], "与同部位阻生牙拔除明确互斥。"),
    branch("socket-seal", "预防性拔牙窝组织封闭", [90]),
    branch("transplant", "牙移植 / 再植", [91])
  ]);

  const oralSurgeryTreatment = treatment("oral-surgery", "其他口腔外科", [
    branch("benign-lesion", "口腔良性肿物切除", [92]),
    branch("frenum", "口腔系带修整", [93]),
    branch("jaw-lesion", "颌骨病变刮切", [94, 95]),
    branch("jaw-cyst", "颌骨囊肿减压", [96]),
    branch("traction-pins", "牵引钉植入 / 取出", [97, 98]),
    branch("bone-contour", "口腔骨突修整", [99]),
    branch("alveolar-fracture", "牙槽突骨折复位固定", [100]),
    branch("mucosal-drainage", "黏膜切开引流", [101, 102]),
    branch("nerve-exploration", "下牙槽神经探查解剖", [103]),
    branch("oroantral-fistula", "口腔上颌窦瘘修补", [104]),
    branch("free-soft-tissue", "口内游离软组织移植", [105]),
    branch("jaw-fixation", "颌间结扎 / 拆除", [29, 30]),
    branch("corticotomy", "皮质骨切开", [112])
  ]);

  const fixedRestorationTreatment = treatment("fixed-restoration", "固定修复", [
    branch("temporary-fixed", "临时固定修复", [68]),
    branch("fixed-build", "修复体固定修复", [69]),
    branch("post-core", "桩核修复", [70]),
    branch("attachment", "附着体修复", [71]),
    branch("removal", "修复体拆除", [78], "25%/50%/100%计价条件待结构化，不可按普通数量乘价开单。"),
    branch("maintenance", "修复体维护", [79])
  ]);

  const removableRestorationTreatment = treatment("removable-restoration", "活动修复与赝复", [
    branch("full-denture", "全口义齿", [72]),
    branch("acrylic-denture", "胶连可摘局部义齿", [73]),
    branch("cast-denture", "铸造支架可摘局部义齿", [74]),
    branch("jaw-prosthesis", "颌骨 / 腭部缺损赝复体", [75, 76], "常规与复杂是不同条件类型，不能默认并收。"),
    branch("face-prosthesis", "面部缺损赝复体", [77])
  ]);

  const orthodonticTreatment = treatment("orthodontics", "正畸治疗", [
    branch("primary-ortho", "乳牙期主疗程（常规 / 复杂）", [45, 46]),
    branch("mixed-i", "替牙期 I 类（常规 / 复杂）", [47, 48]),
    branch("mixed-ii", "替牙期 II 类（常规 / 复杂）", [49, 50]),
    branch("mixed-iii", "替牙期 III 类（常规 / 复杂）", [51, 52]),
    branch("permanent-i", "恒牙期 I 类（常规 / 复杂）", [53, 54]),
    branch("permanent-ii", "恒牙期 II 类（常规 / 复杂）", [55, 56]),
    branch("permanent-iii", "恒牙期 III 类（常规 / 复杂）", [57, 58]),
    branch("functional-ortho", "错合畸形功能治疗", [59, 60, 61]),
    branch("cleft-infant", "新生儿唇腭裂术前治疗", [62]),
    branch("sleep-apnea", "睡眠呼吸暂停口腔正畸辅助", [63]),
    branch("local-ortho", "局部正畸", [64], "按象限·疗程；累计金额不得超过全口价，封顶规则待实现。"),
    branch("retainer", "固定保持器安装 / 拆除", [65, 66]),
    branch("design", "错合畸形治疗设计", [67]),
    branch("ortho-surgery", "正畸手术辅助（仅实际实施）", [80, 86, 97, 98, 111, 112], "这些是交叉索引，不是正畸疗程自动附加项目。")
  ]);

  const mucosalTreatment = treatment("mucosal-salivary", "黏膜与唾液腺治疗", [
    branch("mucosal-care", "口腔黏膜病局部药物治疗", [44]),
    branch("salivary-infusion", "唾液腺药物 / 非药物灌注", [43]),
    branch("salivary-stone", "唾液腺导管取石", [113]),
    branch("salivary-duct", "唾液腺导管治疗", [114]),
    branch("salivary-exam", "唾液腺功能评估", [9])
  ]);

  const occlusalTreatment = treatment("occlusal-function", "咬合与口腔功能治疗", [
    branch("occlusal-splint", "咬合板治疗", [32]),
    branch("occlusal-adjust", "独立调合治疗", [41], "充填或修复中已包含的调合不得另收。")
  ]);
  const crossTreatment = treatment("cross-treatment", "跨治疗辅助项目", [
    branch("rubber-dam", "橡皮障隔离", [10], "仅真实使用时适用；跨路径收费口径待院方确认。"),
    branch("no-reflux", "口腔无回吸辅助治疗", [31], "可配合牙齿治疗或口腔外科手术，不属于牙周专有治疗。"),
    branch("root-traction", "患牙保留辅助：牙根牵引", [42], "适应证和后续治疗组合待院方临床确认；不归入咬合功能治疗。")
  ]);

  window.FJ_TREATMENTS = [
    examinationTreatment,
    rootCanal,
    restorativeTreatment,
    periodontalBasic,
    periodontalSurgery,
    extractionTreatment,
    oralSurgeryTreatment,
    fixedRestorationTreatment,
    removableRestorationTreatment,
    orthodonticTreatment,
    occlusalTreatment,
    mucosalTreatment,
    crossTreatment
  ];

  for (const treatmentItem of window.FJ_TREATMENTS) {
    for (const route of treatmentItem.branches) {
      for (const step of route.phases) {
        for (const definition of step.items) {
          definition.priceEvidenceLevel ||= "A";
          definition.clinicalEvidenceLevel ||= "C";
          definition.needsHospitalConfirmation = true;
        }
      }
    }
  }
  const coveredCodes = new Set(window.FJ_TREATMENTS.flatMap(item => item.branches.flatMap(type => type.phases.flatMap(step => step.items.map(definition => definition.code)))));
  window.FJ_TREATMENT_COVERAGE = {
    coveredCodes: [...coveredCodes],
    unassignedCodes: catalog.filter(item => !coveredCodes.has(item.code)).map(item => item.code),
    previewBillableBranches: ["root-canal/routine", "root-canal/acute", "root-canal/retreat", "root-canal/foreign"]
  };
})();
