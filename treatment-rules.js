(() => {
  const catalog = Array.isArray(window.FJ_CATALOG) ? window.FJ_CATALOG : [];
  const definitions = items => items.map(item => ({
    code: item.code,
    reason: "按本次实际实施情况选择",
    evidence: `福建附件主项目第 ${item.n} 项`
  }));
  const phase = (id, name, items, hint = "仅选择本次实际实施项目") => ({
    id,
    name,
    hint,
    items: definitions(items)
  });
  const branch = (id, name, items, note) => ({
    id,
    name,
    note: note || "本分类只缩小可选项目范围，不会自动加入；请按本次真实实施情况选择。",
    phases: [phase(`${id}-items`, "可选收费项目", items)]
  });
  const treatment = (id, name, branches) => ({
    id,
    name,
    version: 1,
    status: "目录分类",
    source: "《闽医保〔2026〕45号》附件一；仅按治疗用途归类，不代表项目可以同时开立",
    conditions: [],
    branches
  });

  const rootCanal = {
    id: "root-canal",
    name: "根管治疗",
    version: 1,
    status: "已整理",
    source: "《闽医保〔2026〕45号》附件一；医院后台根管套餐仅用于核验项目和计量方式",
    conditions: [
      { id: "patient", label: "患者条件", type: "select", options: [{ value: "adult", label: "成人" }, { value: "child", label: "儿童（≤6周岁）" }] },
      { id: "tooth", label: "牙体类型", type: "select", options: [{ value: "permanent", label: "恒牙" }, { value: "primary", label: "乳牙" }] },
      { id: "anomaly", label: "根管异常", type: "boolean" },
      { id: "medication", label: "本次需要根管封药", type: "boolean" }
    ],
    branches: [
      {
        id: "routine",
        name: "常规根管治疗",
        note: "按本次实际完成的就诊环节开单；未实施的检查、预备、冲洗、封药或充填不得提前加入。",
        phases: [
          {
            id: "assessment",
            name: "检查与术前",
            hint: "仅选择实际完成的检查",
            items: [
              { code: "012406000010000", reason: "实际完成牙髓活力检查时选择", evidence: "福建附件主项目" }
            ]
          },
          {
            id: "stage-1",
            name: "第1期：预备、冲洗与封药",
            hint: "选择本次实际实施项目",
            items: [
              { code: "013105010010000", reason: "实际使用橡皮障时选择", evidence: "福建附件主项目" },
              { code: "013105010030000", reason: "实际实施牙髓失活时选择", evidence: "福建附件主项目" },
              { code: "013105010030001", variant: true, when: { patient: "child" }, reason: "儿童牙髓失活加收", evidence: "福建附件加收项" },
              { code: "013105010050000", required: true, reason: "按实际根管数计量", evidence: "福建附件主项目" },
              { code: "013105010050001", variant: true, when: { patient: "child" }, reason: "儿童根管预备加收", evidence: "福建附件加收项" },
              { code: "013105010050011", variant: true, when: { anomaly: true }, reason: "根管异常加收", evidence: "福建附件加收项" },
              { code: "013105010060000", required: true, reason: "按实际治疗次计量", evidence: "福建附件主项目；医院后台计量核验" },
              { code: "013105010060100", variant: true, when: { medication: true }, reason: "实际实施根管封药时选择", evidence: "福建附件扩展项" }
            ]
          },
          {
            id: "stage-2",
            name: "第2期：根管充填",
            hint: "选择本次实际实施项目",
            items: [
              { code: "013105010070000", required: true, reason: "按实际根管数计量", evidence: "福建附件主项目" },
              { code: "013105010070001", variant: true, when: { patient: "child" }, reason: "儿童根管充填加收", evidence: "福建附件加收项" },
              { code: "013105010070011", variant: true, when: { anomaly: true }, reason: "根管异常加收", evidence: "福建附件加收项" },
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
            { code: "013105010020001", variant: true, when: { patient: "child" }, reason: "儿童开髓引流加收", evidence: "福建附件加收项" }
          ]
        }]
      },
      {
        id: "retreat",
        name: "根管再治疗",
        note: "独立治疗类型；不自动叠加常规根管预备、冲洗或充填。",
        phases: [{
          id: "retreatment",
          name: "根管再治疗项目",
          hint: "选择实际实施项目",
          items: [
            { code: "012406000010000", reason: "实际完成牙髓活力检查时选择", evidence: "福建附件主项目" },
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
            { code: "012406000010000", reason: "实际完成牙髓活力检查时选择", evidence: "福建附件主项目" },
            { code: "013105010090000", required: true, reason: "按实际根管数计量", evidence: "福建附件主项目" },
            { code: "013105010090001", variant: true, reason: "仅根尖段异物取出时加收", evidence: "福建附件加收项" }
          ]
        }]
      }
    ]
  };

  const diagnosis = catalog.filter(item => item.cat === "诊查");
  const dentalPulp = catalog.filter(item => item.cat === "牙体牙髓");
  const periodontalAll = catalog.filter(item => item.cat === "牙周");
  const orthodonticAll = catalog.filter(item => item.cat === "正畸");
  const restorationAll = catalog.filter(item => item.cat === "修复");
  const surgeryAll = catalog.filter(item => item.cat === "外科");

  const mucosalNames = new Set(["唾液腺药物灌注费", "口腔黏膜病局部药物治疗费", "唾液腺导管取石费", "唾液腺导管治疗费"]);
  const periodontalSurgeryNames = new Set(["根面平整费", "牙周翻瓣费", "牙龈成形费", "游离龈移植费", "引导性牙周组织再生费"]);
  const orthodonticSurgeryNames = new Set(["正畸支抗钉植入费", "阻生牙开窗助萌费", "口腔牵引钉植入费", "口腔牵引钉取出费", "牙周纤维环状切断费", "皮质骨切开费"]);
  const extractionNames = new Set(["牙拔除费", "阻生牙拔除费", "阻生牙牙冠切除费", "拔牙创搔刮费", "阻生牙龈瓣修整费", "预防性拔牙窝组织封闭费", "牙移植费"]);
  const removablePattern = /全口义齿|可摘局部义齿|赝复体/;

  const examinationTreatment = treatment("examination", "检查与评估", [
    branch("pulp-exam", "牙髓与一般检查", diagnosis.filter(item => /牙髓|唾液腺/.test(item.name))),
    branch("periodontal-exam", "牙周检查", diagnosis.filter(item => /牙周/.test(item.name))),
    branch("function-exam", "咬合与功能检查", diagnosis.filter(item => !/牙髓|唾液腺|牙周/.test(item.name)))
  ]);

  const restorativeTreatment = treatment("restorative", "补牙与牙体保存", [
    branch("pulp-preservation", "牙髓保存与再生", dentalPulp.filter(item => /干髓|活髓保存|牙髓再生/.test(item.name))),
    branch("filling", "充填与形态修复", dentalPulp.filter(item => /缺损直接粘接|前牙形态|预成冠/.test(item.name))),
    branch("prevention", "防龋与脱敏", dentalPulp.filter(item => /窝沟封闭|氟防龋|牙脱敏/.test(item.name))),
    branch("whitening", "牙齿漂白", dentalPulp.filter(item => /漂白/.test(item.name)))
  ]);

  const periodontalTreatment = treatment("periodontal", "洁牙与牙周治疗", [
    branch("cleaning", "洁牙与基础治疗", periodontalAll.filter(item => /洁治|抛光|喷砂|龈下刮治/.test(item.name))),
    branch("supportive", "牙周辅助处置", periodontalAll.filter(item => !/洁治|抛光|喷砂|龈下刮治/.test(item.name) && !mucosalNames.has(item.name))),
    branch("periodontal-surgery", "牙周手术", surgeryAll.filter(item => periodontalSurgeryNames.has(item.name)))
  ]);

  const extractionTreatment = treatment("extraction", "拔牙与拔牙创处理", [
    branch("simple-extraction", "普通拔牙", surgeryAll.filter(item => item.name === "牙拔除费")),
    branch("impacted-extraction", "阻生牙与拔牙创处理", surgeryAll.filter(item => extractionNames.has(item.name) && !["牙拔除费", "牙移植费"].includes(item.name))),
    branch("tooth-transplant", "牙移植", surgeryAll.filter(item => item.name === "牙移植费"))
  ]);

  const oralSurgeryTreatment = treatment("oral-surgery", "口腔外科与囊肿", [
    branch("apical-surgery", "根尖与根周手术", surgeryAll.filter(item => /根尖/.test(item.name))),
    branch("lesion-cyst", "肿物、颌骨病变与囊肿", surgeryAll.filter(item => /肿物|颌骨病变|囊肿/.test(item.name))),
    branch("soft-tissue", "软组织与引流", surgeryAll.filter(item => /系带|黏膜切开引流|口腔骨突/.test(item.name))),
    branch("trauma-reconstruction", "创伤与修复性外科", [
      ...dentalPulp.filter(item => /颌间结扎/.test(item.name)),
      ...surgeryAll.filter(item => !extractionNames.has(item.name) && !periodontalSurgeryNames.has(item.name) && !orthodonticSurgeryNames.has(item.name) && !mucosalNames.has(item.name) && !/根尖|肿物|颌骨病变|囊肿|系带|黏膜切开引流|口腔骨突/.test(item.name))
    ])
  ]);

  const fixedRestorationTreatment = treatment("fixed-restoration", "固定修复与冠桥", [
    branch("fixed-build", "固定修复制作", restorationAll.filter(item => !removablePattern.test(item.name) && !/拆除|维护/.test(item.name))),
    branch("fixed-maintenance", "修复体拆除与维护", restorationAll.filter(item => /拆除|维护/.test(item.name)))
  ]);

  const removableRestorationTreatment = treatment("removable-restoration", "活动修复与义齿", [
    branch("denture", "全口与局部义齿", restorationAll.filter(item => /全口义齿|可摘局部义齿/.test(item.name))),
    branch("prosthesis", "颌面缺损赝复", restorationAll.filter(item => /赝复体/.test(item.name)))
  ]);

  const orthodonticTreatment = treatment("orthodontics", "正畸治疗", [
    branch("primary-ortho", "乳牙期矫治", orthodonticAll.filter(item => item.name.startsWith("乳牙期"))),
    branch("mixed-ortho", "替牙期矫治", orthodonticAll.filter(item => item.name.startsWith("替牙期"))),
    branch("permanent-ortho", "恒牙期矫治", orthodonticAll.filter(item => item.name.startsWith("恒牙期"))),
    branch("special-ortho", "特殊正畸与保持", [
      ...orthodonticAll.filter(item => !/^(乳牙期|替牙期|恒牙期)/.test(item.name)),
      ...surgeryAll.filter(item => orthodonticSurgeryNames.has(item.name))
    ])
  ]);

  const mucosalTreatment = treatment("mucosal-salivary", "黏膜与唾液腺治疗", [
    branch("mucosal-care", "口腔黏膜治疗", periodontalAll.filter(item => item.name === "口腔黏膜病局部药物治疗费")),
    branch("salivary-care", "唾液腺治疗", [
      ...periodontalAll.filter(item => item.name === "唾液腺药物灌注费"),
      ...surgeryAll.filter(item => /唾液腺导管/.test(item.name))
    ])
  ]);

  window.FJ_TREATMENTS = [
    rootCanal,
    examinationTreatment,
    restorativeTreatment,
    periodontalTreatment,
    extractionTreatment,
    oralSurgeryTreatment,
    fixedRestorationTreatment,
    removableRestorationTreatment,
    orthodonticTreatment,
    mucosalTreatment
  ];

  window.FJ_TREATMENT_COVERAGE = {
    coveredCodes: [...new Set(window.FJ_TREATMENTS.flatMap(item => item.branches.flatMap(type => type.phases.flatMap(step => step.items.map(definition => definition.code)))))]
  };
})();
