window.FJ_TREATMENTS = [
  {
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
        note: "按本次实际完成的阶段开单；未实施的检查、预备、冲洗、封药或充填不得提前加入。",
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
        phases: [
          {
            id: "acute-care",
            name: "本次急症处置",
            hint: "仅选择实际实施项目",
            items: [
              { code: "012406000010000", reason: "实际完成牙髓活力检查时选择", evidence: "福建附件主项目" },
              { code: "013105010020000", required: true, reason: "仅牙髓急症开髓引流", evidence: "福建附件主项目" },
              { code: "013105010020001", variant: true, when: { patient: "child" }, reason: "儿童开髓引流加收", evidence: "福建附件加收项" }
            ]
          }
        ]
      },
      {
        id: "retreat",
        name: "根管再治疗",
        note: "作为独立治疗分支选择；不自动叠加常规根管预备、冲洗或充填。",
        phases: [
          {
            id: "retreatment",
            name: "本次根管再治疗",
            hint: "选择实际实施项目",
            items: [
              { code: "012406000010000", reason: "实际完成牙髓活力检查时选择", evidence: "福建附件主项目" },
              { code: "013105010080000", required: true, reason: "按实际根管数计量", evidence: "福建附件主项目" }
            ]
          }
        ]
      },
      {
        id: "foreign",
        name: "根管内异物取出",
        note: "异物取出单独成支；根尖段异物加收必须依附根管内异物取出主项目。",
        phases: [
          {
            id: "foreign-removal",
            name: "本次异物取出",
            hint: "选择实际实施项目",
            items: [
              { code: "012406000010000", reason: "实际完成牙髓活力检查时选择", evidence: "福建附件主项目" },
              { code: "013105010090000", required: true, reason: "按实际根管数计量", evidence: "福建附件主项目" },
              { code: "013105010090001", variant: true, reason: "仅根尖段异物取出时加收", evidence: "福建附件加收项" }
            ]
          }
        ]
      }
    ]
  }
];
