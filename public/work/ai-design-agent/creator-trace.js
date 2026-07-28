(() => {
const TIMING_MODEL = Object.freeze({
  minimumStage: 6000,
  finalHold: 700,
  userLine: 700,
  phaseLine: 650,
  successLine: 650,
  checkpoint: 2300,
  artifactBase: 1250,
  artifactRow: 210,
  artifactCharacter: 0.7,
  codeBase: 1200,
  codeLine: 210,
  codeCharacter: 0.55,
});

const tone = (text, value) => ({ text, tone: value });
const table = (title, headers, rows, at) => ({ type: "artifact", title, headers, rows, at });
const formMap = (title, zones) => ({ type: "form-map", title, zones });
const codeBlock = (title, lines) => ({ type: "code-block", title, lines });
const checkpoint = (suggestions, at) => ({
  type: "checkpoint",
  at,
  html: `
    <div class="checkpoint-heading"><span aria-hidden="true">●</span><strong>User answered Claude's questions:</strong></div>
    <div class="checkpoint-flow">
      <span class="checkpoint-branch" aria-hidden="true">└─</span>
      <div class="checkpoint-content">
        <div class="checkpoint-question">· 需要修改吗？（输入修改意见，或直接选确认继续） <span class="checkpoint-answer">→ 确认，继续</span></div>
        <div class="checkpoint-suggestion">· 修改建议：${suggestions}</div>
      </div>
    </div>
  `,
});

const stageContent = [
  {
    copy: "The original request becomes a complete requirement model, then retrieves exact components, fallback patterns, and relevant trading references.",
    result: "Requirement + reuse model",
  },
  {
    copy: "Page architecture, mock data, implicit relationships, interaction states, design rules, and source mappings form one complete framework.",
    result: "Complete interaction framework",
  },
  {
    copy: "The trace writes the component system and Figma output, then runs six checks across completeness, layout, interaction coverage, and compliance.",
    result: "Generated + audited handoff",
  },
];

const traceSegments = [
  [
    { type: "user", html: "› 帮我生成一个港股-腾讯的交易下单页面" },
  ],
  [
    { type: "phase", html: '<span class="dot">●</span>Phase 1 · 结构化需求' },
    { type: "subsection", html: "1. 需求解读" },
    {
      type: "paragraph",
      html: "用户需要一个 <strong>港股腾讯控股（00700.HK）</strong> 的交易下单页面。这是一个移动端全页面交易表单，用户可以在此完成从查看行情到提交买卖订单的完整流程。",
    },
    table(
      "2. 核心信息结构",
      ["层级", "内容", "理由"],
      [
        ["一级（一眼可见）", "股票代码/名称、最新价、涨跌幅、买卖方向", "第一时间确认标的和方向"],
        ["二级（辅助决策）", "盘口深度、订单类型、限价、数量、估算金额、最大可买", "完成价格和数量决策所需的核心信息"],
        ["三级（按需查看）", "交易时段、快捷下单量、持仓/当日订单列表", "高级选项和上下文参考，非每次必看"],
      ],
      300,
    ),
    { type: "subsection", html: "3. 用户逻辑流" },
    { html: "1. <strong>目标：</strong>提交一笔腾讯港股买入 / 卖出订单" },
    { html: "2. <strong>步骤：</strong>" },
    { type: "muted", html: '<span class="tree">├─</span>确认股票标的 → 查看最新价和涨跌 → 查看盘口深度' },
    { type: "muted", html: '<span class="tree">├─</span>选择交易方向（买入 / 卖出）' },
    { type: "muted", html: '<span class="tree">├─</span>选择订单类型（限价单等）' },
    { type: "muted", html: '<span class="tree">├─</span>输入 / 调整限价 → 输入 / 调整数量' },
    { type: "muted", html: '<span class="tree">├─</span>参考最大可买、估算金额' },
    { type: "muted", html: '<span class="tree">├─</span>可选：使用快捷数量按钮、切换交易时段' },
    { type: "muted", html: '<span class="tree">└─</span>提交订单' },
    { html: "3. <strong>决策点：</strong>买还是卖？什么价格？买多少？" },
    { type: "subsection", html: "4. 设计范围" },
    { html: '<span class="tree">├─</span>交易下单主页面（买入状态，含完整表单）' },
    { type: "muted", html: '<span class="tree">└─</span>单一页面，不含确认弹窗或结果页' },
    table(
      "5. 所需组件类型",
      ["组件类型", "层级", "用途"],
      [
        [tone("nav-bar", "highlight"), "Level 2 (composite)", "顶部导航栏"],
        [tone("toggle", "highlight"), "Level 1 (atomic)", "买入/卖出切换"],
        [tone("input", "highlight"), "Level 1 (atomic)", "限价、数量输入 + 步进器"],
        [tone("select", "highlight"), "Level 1 (atomic)", "订单类型、交易时段下拉"],
        [tone("data-table", "highlight"), "Level 2 (composite)", "盘口深度展示"],
        [tone("chip", "highlight"), "Level 1 (atomic)", "快捷数量按钮"],
        [tone("tag", "highlight"), "Level 1 (atomic)", "买卖标签"],
        [tone("button", "highlight"), "Level 1 (atomic)", "买入/卖出提交按钮"],
        [tone("tab-bar", "highlight"), "Level 2 (composite)", "底部持仓/订单切换"],
        [tone("action-bar", "highlight"), "Level 2 (composite)", "底部固定操作区"],
      ],
      850,
    ),
    { type: "subsection", html: "6. 页面参考查询" },
    { html: '<span class="tree">├─</span><strong>businessDomain:</strong> <span class="path">trading</span>' },
    { html: '<span class="tree">├─</span><strong>pageType:</strong> <span class="path">form</span>' },
    { type: "muted", html: '<span class="tree">└─</span><strong>tags:</strong> order-entry, regular-trade, buy-order' },
    checkpoint("需求解读 · 信息层级 · 用户路径 · 设计范围 · 组件类型 · 查询条件", 1510),
  ],
  [
    { type: "phase", html: '<span class="dot">●</span>Phase 1.5 · Skill(<span class="path">lookup-component-reference</span>)' },
    { type: "muted", html: '<span class="tree">├─</span><span class="path">component-index.json</span> already loaded · Read <span class="path">components.json</span> + structure files', at: 260 },
    { type: "subsection", html: "1a. Component Retrieval" },
    { html: '<span class="tree">├─</span><strong>exact:</strong> <span class="value">14 components / 9 requested types</span>' },
    {
      type: "paragraph",
      html: '<span class="tree">│</span>TopBar, NavBar, BuySellSwitch, Toggle, TradeInput, SearchMenu, OrderBook, Table, DropdownItem, TableHeaderItem, Button, TabFilter, Tag, ActionBar',
    },
    { html: '<span class="tree">├─</span><strong>childOf:</strong> TableRowItem' },
    { html: '<span class="tree">├─</span><strong>styleReference:</strong> select → OrderTypeMenu' },
    { type: "muted", html: '<span class="tree">└─</span><strong>noMatch:</strong> []' },
    table(
      "1b. Page Reference Retrieval",
      ["Page", "Tags", "相关性"],
      [
        [tone("regular-order-default", "path"), "order-entry · regular-trade · form", "完全匹配 · 买入状态全页下单"],
        [tone("regular-order-sell", "path"), "sell-order · regular-trade", "高 · 卖出方向变体"],
        [tone("order-book-5level", "path"), "order-book · market-depth · 5-level", "中 · 盘口展开态参考"],
      ],
      980,
    ),
    { type: "subsection", html: "1c. Cross-reference overlap" },
    {
      type: "paragraph",
      html: "Component overlap: <span class=\"value\">12 components</span> in matched pages also found in component retrieval.",
    },
    { type: "subsection", html: "Summary" },
    { html: '<span class="tree">├─</span>Exact matches: 14 components for 9 requested types' },
    { html: '<span class="tree">├─</span>Child expansions: 1 additional component (TableRowItem)' },
    { html: '<span class="tree">├─</span>Style references: 1 fallback reference (select → OrderTypeMenu)' },
    { type: "muted", html: '<span class="tree">└─</span>No matches: 0 types' },
  ],
  [
    { type: "phase", html: '<span class="dot">●</span>Phase 2 · 交互设计' },
    { type: "muted", html: '<span class="tree">├─</span>Step 2a · Paradigm Matching: <span class="path">Stock_Trading</span> — Trading Order Flow' },
    formMap("1. 页面信息架构 · Order form visualization", [
      { label: "StatusBar", lines: ["54px · OS chrome"], meta: "SYSTEM" },
      { label: "TopBar", lines: ["← 交易下单       [refresh] [setting]"], meta: "STICKY · 始终可见" },
      {
        label: "StockHeader",
        lines: ["00700 腾讯控股  ⇄", "388.600  ↗ +5.200 (+1.36%)   盘中 14:32"],
        meta: "一级 · 一眼确认标的",
      },
      {
        label: "OrderBook · 1档",
        lines: ["买盘  [1] 185  388.400  │  388.800  92 [1]  卖盘"],
        meta: "二级 · 辅助价格决策 · SCROLLABLE START",
      },
      {
        label: "OrderForm",
        lines: [
          "交易方向   [买入 │ 卖出]",
          "订单类型   [限价单  ▾]",
          "限价       [− 388.600 +]",
          "数量       [− 最大可买5股 +]",
          "最大可买 5股    估算金额 0.00 HKD",
          "[全仓][1/4][1/3][1/2][1K][5K]   交易时段 [盘中 ▾]",
        ],
        meta: "二级 · 核心下单 / 三级 · 快捷操作",
      },
      { label: "ActionBar", lines: ["[              买入 (disabled)              ]"], meta: "STICKY BOTTOM" },
      {
        label: "Holdings / Orders",
        lines: ["证券持仓(0)   当日订单(2/3)  ▾", "（持仓列表 / 订单列表）"],
        meta: "三级 · 按需查看",
      },
    ]),
    table(
      "2. 核心数据区 · Mock Data",
      ["字段", "值", "格式", "对齐"],
      [
        ["股票代码", tone("00700", "white"), "5 位数字", "左对齐"],
        ["股票名称", tone("腾讯控股", "white"), "CJK 文本", "左对齐"],
        ["最新价", tone("388.600", "white"), "3 位小数", "左对齐"],
        ["涨跌额", tone("+5.200", "white"), "带符号 3 位小数", "左对齐"],
        ["涨跌幅", tone("+1.36%", "white"), "带符号 2 位小数 %", "左对齐"],
        ["盘口买价", tone("388.400", "white"), "3 位小数", "sentimentUp 色"],
        ["盘口卖价", tone("388.800", "white"), "3 位小数", "sentimentDown 色"],
        ["买量", tone("185", "white"), "整数", "左对齐"],
        ["卖量", tone("92", "white"), "整数", "右对齐"],
        ["限价", tone("388.600", "white"), "3 位小数", "居中"],
        ["最大可买", tone("5 股", "white"), "整数 + 单位", "左对齐"],
        ["估算金额", tone("0.00 HKD", "white"), "2 位小数 + 币种", "右对齐"],
      ],
      230,
    ),
    table(
      "3. 隐含关系表达",
      ["关系", "视觉表达", "理由"],
      [
        ["买入方向 → 粉红色", "sentimentUp (#ef3e76) 贯穿买入按钮、买盘价、涨跌色", "港 / 中市场惯例"],
        ["卖出方向 → 青绿色", "sentimentDown (#00b6ac) 用于卖出按钮、卖盘价", "港 / 中市场惯例"],
        ["买卖力量对比", "深度条宽度比例（买185 : 卖92 ≈ 67% : 33%）", "直觉展示多空力量"],
        ["价格 → 输入", "限价默认填充最新价 388.600", "减少用户输入成本"],
        ["数量未填 → 按钮禁用", "按钮使用 disabled 色 + disableTrade 文字色", "防止误操作"],
      ],
      500,
    ),
    table(
      "4. 交互行为决策",
      ["交互", "决定的行为", "理由"],
      [
        ["买入 / 卖出切换", tone("点击切换，整个表单主色跟随改变（按钮色、标签色）", "white"), "方向是最关键决策，需要视觉强化"],
        ["订单类型下拉", tone("点击弹出 OrderTypeMenu 浮层", "white"), "参考设计中的下拉面板模式"],
        ["价格步进器", tone("±0.200（港股最小变动单位）", "white"), "遵循港股价位表规则"],
        ["数量步进器", tone("±100（港股每手100股）", "white"), "港股交易以“手”为单位"],
        ["快捷数量按钮", tone("点击立即填入对应数量", "white"), "降低输入门槛"],
        ["买入按钮", tone("数量 > 0 时激活，显示“买入 X 股 00700 @388.600 限价单”", "white"), "确认前完整展示订单摘要"],
        ["持仓 / 订单 tab", tone("点击切换，可折叠", "white"), "非核心信息，按需展开"],
      ],
      650,
    ),
    table(
      "5. 状态清单",
      ["状态", "触发条件", "视觉行为"],
      [
        ["买入模式 (default)", "页面加载 / 点击买入 tab", "BuySellSwitch 买入激活（粉红），Button 使用 sentimentUp"],
        ["卖出模式", "点击卖出 tab", "BuySellSwitch 卖出激活（青绿），Button 使用 sentimentDown"],
        ["按钮禁用", "数量为空或 0", "Button disabled 变体，colors.disabled 背景"],
        ["按钮激活", "数量 > 0", "Button buy / sell 变体，显示完整订单摘要文案"],
        ["价格已修改", "用户调整限价", "价格数字颜色保持 primary"],
        ["持仓折叠", "默认", "仅显示 tab header"],
        ["持仓展开", "点击展开", "显示 Table（holdings 变体）"],
      ],
      1040,
    ),
    table(
      "6. 应用的设计规则",
      ["规则", "优先级", "影响"],
      [
        ["sentimentUp 用于买入 / 上涨", tone("critical", "value"), "买入按钮、买盘价、涨跌色"],
        ["sentimentDown 用于卖出 / 下跌", tone("critical", "value"), "卖出按钮、卖盘价"],
        ["CJK 字体用于中文，Latin 字体用于数字", tone("critical", "value"), "分别使用对应字体族"],
        ["数值输入必须有步进器", "high", "价格和数量输入两侧有 ± 按钮"],
        ["主按钮满宽 + 方向色", "high", "Button 全宽 + sentimentUp / Down 背景"],
        ["竖向堆叠布局", "high", "StatusBar → TopBar → Content → ActionBar"],
        ["screenMargin 16px", "high", "所有内容区左右 padding 16px"],
      ],
      1220,
    ),
    table(
      "7. Component Source Mapping Table",
      ["页面区域", "库组件", "匹配场景", "说明"],
      [
        ["状态栏", "StatusBar", "A (exact)", "直接使用，无需修改"],
        ["导航栏", "TopBar", "A (exact)", 'title="交易下单"，右侧 refresh + setting 图标'],
        ["股票信息头", "—", "C (no match)", "从 tokens 构建：代码 + 名称 + 最新价 + 涨跌"],
        ["盘口深度", "OrderBook", "A (exact)", "1-level 变体"],
        ["买卖切换", "BuySellSwitch", "A (exact)", "buy-active 变体"],
        ["订单类型选择", "OrderTypeMenu", "B2 (extension)", "样式锚点：同 spacing / font / color 模式，触发器为行内下拉"],
        ["限价输入", "TradeInput", "A (exact)", "price 变体"],
        ["数量输入", "TradeInput", "A (exact)", "quantity 变体"],
        ["最大可买 / 估算", "—", "C (no match)", "从 tokens 构建：sentimentUp 色文字行"],
        ["快捷数量按钮组", "TabFilter", "B1 (variant missing)", "保持骨架，仅填充不同文案（全仓 / 1/4 等）"],
        ["交易时段选择", "OrderTypeMenu", "B2 (extension)", "同订单类型选择器模式"],
        ["买入提交按钮", "ActionBar > Button", "A (exact)", "disabled 变体（默认无数量），含 Button 子组件"],
        ["分隔区域", "—", "C (no match)", "8px surface.gap 色矩形"],
        ["持仓 / 订单 tabs", "TabFilter", "B1 (variant missing)", "下划线指示器样式，tab 文案不同"],
        ["持仓 / 订单列表", "Table", "A (exact)", "holdings 变体"],
      ],
      1360,
    ),
    checkpoint("Mock Data · 交互规则 · 状态与组件映射", 1660),
  ],
  [
    { type: "phase", html: '<span class="dot">●</span>Phase 3 · 设计实现' },
    { type: "paragraph", html: "好的，进入 Phase 3 设计实现。先读取代码模板参考。" },
    { type: "muted", html: '<span class="tree">├─</span>Read 1 file' },
    {
      type: "paragraph",
      html: "Now let me generate all the output files for Phase 3. I'll create the directory structure and write all files.",
    },
    { type: "muted", html: '<span class="tree">├─</span>Bash(mkdir -p <span class="path">output/tencent-hk-order/components</span> <span class="path">output/tencent-hk-order/figma</span>)' },
    codeBlock("Write(output/tencent-hk-order/tokens.css)", [
      ":root {",
      "  --color-primary: #1a1b1c;",
      "  --color-secondary: #3a3b3e;",
      "  --color-tertiary: #6e7073;",
      "  --color-brand: #0059ff;",
      "}",
    ]),
    codeBlock("Write · foundation components", [
      "components/StatusBar.tsx",
      "export default function StatusBar() {",
      '  return <div className="flex flex-row items-center justify-between" />;',
      "}",
      "components/TopBar.tsx · components/StockHeader.tsx",
      "components/OrderBook.tsx",
    ]),
    codeBlock("Write · order form components", [
      "components/BuySellSwitch.tsx",
      'type Direction = "buy" | "sell";',
      "components/TradeInput.tsx",
      "interface TradeInputProps { label: string; value: string; }",
      "components/OrderTypeSelect.tsx",
      "interface OrderTypeSelectProps { label: string; value: string; }",
    ]),
    codeBlock("Write · action components", [
      "components/QuickAmountBar.tsx",
      "interface QuickAmountBarProps { items: string[]; selectedIndex?: number; }",
      "components/ActionBar.tsx",
      "interface ActionBarProps { direction: Direction; disabled: boolean; label: string; }",
      "components/HoldingsTab.tsx",
      'activeTab: "holdings" | "orders";',
    ]),
    codeBlock("Write(output/tencent-hk-order/components/TencentOrderPage.tsx)", [
      'import StatusBar from "./StatusBar";',
      'import TopBar from "./TopBar";',
      'import StockHeader from "./StockHeader";',
      'import OrderBook from "./OrderBook";',
      'import BuySellSwitch from "./BuySellSwitch";',
      'import OrderTypeSelect from "./OrderTypeSelect";',
      'import TradeInput from "./TradeInput";',
      'import ActionBar from "./ActionBar";',
    ]),
    { type: "paragraph", html: "Now let me write the Figma script and README." },
    codeBlock("Write(output/tencent-hk-order/figma/create-design.js)", [
      "(async () => {",
      '  await figma.loadFontAsync({ family: "Inter", style: "Regular" });',
      '  await figma.loadFontAsync({ family: "PingFang HK", style: "Regular" });',
      "  // Tokens · auto-layout frames · component sections",
      "})();",
    ]),
    codeBlock("Write(output/tencent-hk-order/README.md)", [
      "# Tencent HK Order（港股腾讯交易下单）",
      "",
      "A mobile trading order page for Tencent Holdings (00700.HK).",
    ]),
    { type: "paragraph", html: "All files generated. Now let me run the self-check." },
    codeBlock("Generated files", [
      "output/tencent-hk-order/",
      "├─ README.md",
      "├─ tokens.css",
      "├─ components/",
      "│  ├─ StatusBar.tsx",
      "│  ├─ TopBar.tsx",
      "│  ├─ StockHeader.tsx",
      "│  ├─ OrderBook.tsx",
      "│  ├─ BuySellSwitch.tsx",
      "│  ├─ OrderTypeSelect.tsx",
      "│  ├─ TradeInput.tsx",
      "│  ├─ QuickAmountBar.tsx",
      "│  ├─ ActionBar.tsx",
      "│  ├─ HoldingsTab.tsx",
      "│  └─ TencentOrderPage.tsx",
      "└─ figma/",
      "   └─ create-design.js",
    ]),
    { type: "success", html: '<span class="tree">└─</span><span class="check">✓</span> <span class="path">output/tencent-hk-order/</span> ready' },
  ],
  [
    { type: "phase", html: '<span class="dot">●</span>Phase 3 · Self-check' },
    table(
      "Self-check results",
      ["Check", "Result"],
      [
        ["Phase 2 对应", tone("✓ zones、mock data、交互、状态、隐含关系均已实现", "success")],
        ["文件完整性", tone("✓ 每个组件有 .tsx + Figma 脚本对应 section", "success")],
        ["布局合规", tone("✓ React 全 flex；Figma 全 auto-layout Frame", "success")],
        ["Figma 脚本", tone("✓ async IIFE；fonts loaded first；layoutMode on every frame", "success")],
        ["UDC 合规", tone("✓ 最小字号 10px；间距 ≥ 8px；触控 ≥ 44px", "success")],
        ["页面参考验证", tone("✓ 结构、间距、变体与 regular-order-default 一致", "success")],
      ],
      300,
    ),
    table(
      "Component matching compliance",
      ["场景", "实施"],
      [
        ["A · exact", "StatusBar · TopBar · OrderBook · BuySellSwitch · TradeInput · Button · ActionBar — 遵循库组件结构"],
        ["B1 · variant missing", "QuickAmountBar（TabFilter 骨架 + 不同文案）；HoldingsTab（TabFilter 下划线样式）"],
        ["B2 · extension", "OrderTypeSelect（OrderTypeMenu 样式锚点，行内下拉触发器）"],
        ["C · no match", "StockHeader · InfoRow · Divider — 仅使用 design-tokens"],
      ],
      850,
    ),
    { type: "subsection", html: "5. 页面参考利用报告" },
    {
      type: "paragraph",
      html: '参考了 <span class="path">regular-order-default</span> 和 <span class="path">regular-order-sell</span> 页面截图：视觉节奏（间距密度）、组件变体选择、auto-layout sizing 模式均与参考页面保持一致。',
    },
    { type: "subsection", html: "6. 受协 / 偏差" },
    { html: '<span class="tree">├─</span>港股价位表步进值简化为固定 0.200 HKD（实际应根据价格区间动态调整）' },
    { type: "muted", html: '<span class="tree">└─</span>快捷数量按钮的金额计算逻辑做了简化' },
    checkpoint("自检结论 · 受协偏差 · 最终交付内容", 1510),
    { type: "success", html: '<span class="tree">└─</span>Done · <strong>output/tencent-hk-order/</strong> · Worked for <span class="value">7m 10s</span>', at: 1730 },
  ],
];

const traceStages = [
  traceSegments.slice(0, 3).flat(),
  traceSegments[3],
  traceSegments.slice(4).flat(),
];

function eventText(line) {
  if (line.type === "artifact") {
    const cells = [...line.headers, ...line.rows.flat()].map((cell) =>
      typeof cell === "object" ? cell.text : cell,
    );
    return [line.title, ...cells].join(" ");
  }
  if (line.type === "form-map") {
    return [line.title, ...line.zones.flatMap((zone) => [zone.label, zone.meta, ...zone.lines])].join(" ");
  }
  if (line.type === "code-block") return [line.title, ...line.lines].join(" ");
  return (line.html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function eventDwell(line) {
  if (line.type === "artifact") {
    const duration =
      TIMING_MODEL.artifactBase +
      line.rows.length * TIMING_MODEL.artifactRow +
      eventText(line).length * TIMING_MODEL.artifactCharacter;
    return Math.min(6800, Math.max(2100, duration));
  }
  if (line.type === "form-map") {
    const duration = 1600 + line.zones.length * 320 + eventText(line).length;
    return Math.min(6500, Math.max(3200, duration));
  }
  if (line.type === "code-block") {
    const duration =
      TIMING_MODEL.codeBase +
      line.lines.length * TIMING_MODEL.codeLine +
      eventText(line).length * TIMING_MODEL.codeCharacter;
    return Math.min(5200, Math.max(2300, duration));
  }
  if (line.type === "checkpoint") return TIMING_MODEL.checkpoint;
  if (line.type === "user") return TIMING_MODEL.userLine;
  if (line.type === "phase") return TIMING_MODEL.phaseLine;
  if (line.type === "success") return TIMING_MODEL.successLine;
  if (line.type === "subsection") return Math.min(820, Math.max(600, 520 + eventText(line).length * 4));
  if (line.type === "paragraph") return Math.min(1200, Math.max(850, 680 + eventText(line).length * 4.5));
  if (line.type === "muted") return Math.min(820, Math.max(480, 420 + eventText(line).length * 4));
  return Math.min(900, Math.max(520, 450 + eventText(line).length * 4.5));
}

const stageTimings = traceStages.map((stage) => {
  let cursor = 0;
  const offsets = stage.map((line) => {
    const offset = cursor;
    cursor += eventDwell(line);
    return offset;
  });
  const minimumDuration = stage.length === 1 ? 3000 : TIMING_MODEL.minimumStage;
  const duration = Math.max(minimumDuration, cursor + TIMING_MODEL.finalHold);
  return { offsets, duration: Math.ceil(duration / 100) * 100 };
});

const stageStartTimes = stageTimings.map((_, index) =>
  stageTimings.slice(0, index).reduce((total, timing) => total + timing.duration, 0),
);
const TRACE_DURATION = stageTimings.reduce((total, timing) => total + timing.duration, 0);

const story = document.querySelector("[data-creator-trace]");
if (!story) return;
const stageList = story.querySelector(".stage-list");
const stageButtons = [...story.querySelectorAll(".stage-button")];
const traceCanvas = story.querySelector(".trace-canvas");
const terminalViewport = story.querySelector(".terminal-viewport");
const terminalLog = story.querySelector(".terminal-log");
const count = story.querySelector(".terminal-count");
const replayClock = story.querySelector(".replay-clock");
const replayLabel = story.querySelector(".replay-state");
const traceDurationMeta = story.querySelector(".trace-duration-meta");
const explanation = story.querySelector(".explanation-copy");
const result = story.querySelector(".explanation-result strong");
const playToggle = story.querySelector(".play-toggle");
const playIcon = story.querySelector(".play-icon");
const playState = story.querySelector(".play-state");
const rawDialog = story.querySelector(".raw-dialog");
const rawTrigger = story.querySelector(".raw-trigger");
const rawClose = story.querySelector(".raw-close");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let activeIndex = 0;
let nextLineIndex = 0;
let stageStartedAt = 0;
let pausedElapsed = 0;
let animationFrame = 0;
let scrollAnimationFrame = 0;
let scrollTarget = 0;
let isPaused = reducedMotion.matches;
let isVisible = true;
let inspectionMode = false;
let wasPlayingBeforeDialog = false;

if (traceDurationMeta) traceDurationMeta.textContent = `${Math.round(TRACE_DURATION / 1000)} seconds`;

function currentStageDuration() {
  return stageTimings[activeIndex].duration;
}

function restartAnimation(element, className) {
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
}

function updateStage(index) {
  activeIndex = (index + stageContent.length) % stageContent.length;
  story.style.setProperty("--step-duration", `${currentStageDuration()}ms`);
  stageButtons.forEach((button, buttonIndex) => {
    const isActive = buttonIndex === activeIndex;
    button.setAttribute("aria-selected", String(isActive));
    button.tabIndex = isActive ? 0 : -1;
    button.classList.toggle("is-active", isActive);
  });

  const currentButton = stageButtons[activeIndex];
  restartAnimation(currentButton, "is-active");
  currentButton.setAttribute("aria-selected", "true");
  traceCanvas.setAttribute("aria-labelledby", currentButton.id);
  count.textContent = `${String(activeIndex + 1).padStart(2, "0")} / ${String(stageContent.length).padStart(2, "0")}`;
  if (explanation) explanation.textContent = stageContent[activeIndex].copy;
  if (result) result.textContent = stageContent[activeIndex].result;

  if (window.innerWidth <= 980) {
    const centeredLeft = currentButton.offsetLeft - (stageList.clientWidth - currentButton.clientWidth) / 2;
    stageList.scrollTo({ left: centeredLeft, behavior: isPaused ? "auto" : "smooth" });
  }
}

function renderArtifact(element, artifact) {
  const title = document.createElement("h3");
  title.className = "artifact-title";
  title.textContent = artifact.title;

  const wrap = document.createElement("div");
  wrap.className = "trace-table-wrap";
  const renderedTable = document.createElement("table");
  renderedTable.className = "trace-table";
  renderedTable.dataset.columns = String(artifact.headers.length);
  renderedTable.setAttribute("aria-label", artifact.title);

  const head = renderedTable.createTHead();
  const headRow = head.insertRow();
  artifact.headers.forEach((header) => {
    const th = document.createElement("th");
    th.scope = "col";
    th.textContent = header;
    headRow.append(th);
  });

  const body = renderedTable.createTBody();
  artifact.rows.forEach((row, rowIndex) => {
    const tr = body.insertRow();
    tr.style.setProperty("--row-index", rowIndex);
    row.forEach((rawCell) => {
      const data = typeof rawCell === "object" ? rawCell : { text: rawCell };
      const td = tr.insertCell();
      td.textContent = data.text;
      if (data.tone) td.classList.add(`cell--${data.tone}`);
    });
  });

  wrap.append(renderedTable);
  element.append(title, wrap);
}

function renderFormMap(element, map) {
  const title = document.createElement("h3");
  title.className = "artifact-title";
  title.textContent = map.title;

  const scroll = document.createElement("div");
  scroll.className = "form-map-scroll";
  const layout = document.createElement("div");
  layout.className = "form-map";
  layout.setAttribute("role", "img");
  layout.setAttribute("aria-label", "Tencent trading order page information architecture");

  map.zones.forEach((zone, zoneIndex) => {
    const section = document.createElement("section");
    section.className = "form-map-zone";
    section.style.setProperty("--zone-index", zoneIndex);

    const content = document.createElement("div");
    content.className = "form-map-content";
    const heading = document.createElement("strong");
    heading.textContent = zone.label;
    content.append(heading);
    zone.lines.forEach((line) => {
      const detail = document.createElement("span");
      detail.textContent = line;
      content.append(detail);
    });

    const meta = document.createElement("span");
    meta.className = "form-map-meta";
    meta.textContent = `← ${zone.meta}`;
    section.append(content, meta);
    layout.append(section);
  });

  scroll.append(layout);
  element.append(title, scroll);
}

function renderCodeBlock(element, block) {
  const heading = document.createElement("div");
  heading.className = "trace-code-heading";
  heading.textContent = block.title;

  const pre = document.createElement("pre");
  const code = document.createElement("code");
  code.textContent = block.lines.join("\n");
  pre.append(code);

  const wrap = document.createElement("div");
  wrap.className = "trace-code";
  wrap.append(heading, pre);
  element.append(wrap);
}

function stopTerminalScroll() {
  window.cancelAnimationFrame(scrollAnimationFrame);
  scrollAnimationFrame = 0;
  scrollTarget = terminalViewport.scrollTop;
}

function animateTerminalScroll() {
  const maximum = Math.max(0, terminalViewport.scrollHeight - terminalViewport.clientHeight);
  const target = Math.min(scrollTarget, maximum);
  const distance = target - terminalViewport.scrollTop;

  if (Math.abs(distance) < 0.5) {
    terminalViewport.scrollTop = target;
    scrollAnimationFrame = 0;
    return;
  }

  terminalViewport.scrollTop += distance * 0.16;
  scrollAnimationFrame = window.requestAnimationFrame(animateTerminalScroll);
}

function queueTerminalScroll(top, immediate = false) {
  const maximum = Math.max(0, terminalViewport.scrollHeight - terminalViewport.clientHeight);
  scrollTarget = Math.max(0, Math.min(top, maximum));

  if (immediate || reducedMotion.matches) {
    window.cancelAnimationFrame(scrollAnimationFrame);
    scrollAnimationFrame = 0;
    terminalViewport.scrollTop = scrollTarget;
    return;
  }

  if (!scrollAnimationFrame) scrollAnimationFrame = window.requestAnimationFrame(animateTerminalScroll);
}

function appendLine(line, stageIndex, animate = true) {
  const isStructured = line.type === "artifact" || line.type === "form-map" || line.type === "code-block";
  const element = document.createElement(isStructured ? "section" : "div");
  element.className = `terminal-line${line.type ? ` terminal-line--${line.type}` : ""}${animate ? "" : " is-static"}`;
  element.dataset.stage = String(stageIndex);

  if (line.type === "artifact") renderArtifact(element, line);
  else if (line.type === "form-map") renderFormMap(element, line);
  else if (line.type === "code-block") renderCodeBlock(element, line);
  else element.innerHTML = line.html;

  terminalLog.append(element);
  if (animate) {
    const top = isStructured ? Math.max(0, element.offsetTop - 14) : terminalViewport.scrollHeight;
    queueTerminalScroll(top);
  }
  return element;
}

function lineOffset(index) {
  return stageTimings[activeIndex].offsets[index];
}

function renderDueLines(elapsed) {
  const lines = traceStages[activeIndex];
  while (nextLineIndex < lines.length && lineOffset(nextLineIndex) <= elapsed) {
    appendLine(lines[nextLineIndex], activeIndex);
    nextLineIndex += 1;
  }
}

function formatClock(milliseconds) {
  const clamped = Math.max(0, Math.min(milliseconds, TRACE_DURATION));
  const totalSeconds = Math.floor(clamped / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const tenth = Math.floor((clamped % 1000) / 100);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${tenth}`;
}

function updateClock(stageElapsed) {
  replayClock.textContent = formatClock(stageStartTimes[activeIndex] + stageElapsed);
}

function canPlay() {
  return !isPaused && isVisible && !document.hidden && !reducedMotion.matches;
}

function tick(now) {
  if (!canPlay()) return;
  const duration = currentStageDuration();
  const elapsed = Math.min(now - stageStartedAt, duration);
  pausedElapsed = elapsed;
  renderDueLines(elapsed);
  updateClock(elapsed);

  if (elapsed >= duration) {
    const nextStage = (activeIndex + 1) % traceStages.length;
    startStage(nextStage, { clear: nextStage === 0 });
    return;
  }
  animationFrame = window.requestAnimationFrame(tick);
}

function startStage(index, { clear = false } = {}) {
  window.cancelAnimationFrame(animationFrame);
  if (clear) {
    stopTerminalScroll();
    terminalLog.replaceChildren();
    terminalViewport.scrollTop = 0;
  }
  inspectionMode = false;
  pausedElapsed = 0;
  nextLineIndex = 0;
  stageStartedAt = performance.now();
  updateStage(index);
  renderDueLines(0);
  updateClock(0);
  if (canPlay()) animationFrame = window.requestAnimationFrame(tick);
}

function renderReducedTrace(selectedStage = 0) {
  window.cancelAnimationFrame(animationFrame);
  stopTerminalScroll();
  terminalLog.replaceChildren();
  traceStages.forEach((stage, stageIndex) => stage.forEach((line) => appendLine(line, stageIndex, false)));
  updateStage(selectedStage);
  replayClock.textContent = formatClock(TRACE_DURATION);
  const target = terminalLog.querySelector(`[data-stage="${selectedStage}"]`);
  if (target) terminalViewport.scrollTop = Math.max(0, target.offsetTop - 24);
}

function updatePlaybackUI() {
  story.classList.toggle("is-paused", isPaused);
  playToggle.setAttribute(
    "aria-label",
    isPaused ? (inspectionMode ? "Replay current terminal stage" : "Resume terminal replay") : "Pause terminal replay",
  );
  playIcon.textContent = isPaused ? "▶" : "Ⅱ";
  playState.textContent = reducedMotion.matches
    ? "Motion off"
    : isPaused
      ? inspectionMode
        ? "Replay stage"
        : "Paused"
      : "Playing";
  replayLabel.lastChild.textContent = reducedMotion.matches
    ? " trace ready"
    : isPaused
      ? inspectionMode
        ? " inspecting stage"
        : " replay paused"
      : " replaying trace";
  playToggle.disabled = reducedMotion.matches;
}

function setPaused(nextPaused) {
  if (reducedMotion.matches) {
    isPaused = true;
    updatePlaybackUI();
    return;
  }
  if (nextPaused === isPaused) return;
  if (nextPaused) {
    pausedElapsed = Math.min(performance.now() - stageStartedAt, currentStageDuration());
    window.cancelAnimationFrame(animationFrame);
    stopTerminalScroll();
  } else {
    stageStartedAt = performance.now() - pausedElapsed;
  }
  isPaused = nextPaused;
  updatePlaybackUI();
  if (canPlay()) animationFrame = window.requestAnimationFrame(tick);
}

function inspectStage(index, moveFocus = false) {
  if (reducedMotion.matches) {
    renderReducedTrace(index);
  } else {
    window.cancelAnimationFrame(animationFrame);
    stopTerminalScroll();
    inspectionMode = true;
    isPaused = true;
    terminalLog.replaceChildren();
    updateStage(index);
    traceStages[activeIndex].forEach((line) => appendLine(line, activeIndex, false));
    pausedElapsed = currentStageDuration();
    nextLineIndex = traceStages[activeIndex].length;
    updateClock(currentStageDuration());
    terminalViewport.scrollTop = 0;
    updatePlaybackUI();
  }
  if (moveFocus) stageButtons[activeIndex].focus();
}

stageButtons.forEach((button) => {
  button.addEventListener("click", () => inspectStage(Number(button.dataset.step)));
  button.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    inspectStage(activeIndex + (event.key === "ArrowRight" ? 1 : -1), true);
  });
});

function togglePlayback() {
  if (isPaused && inspectionMode && !reducedMotion.matches) {
    isPaused = false;
    updatePlaybackUI();
    startStage(activeIndex, { clear: true });
    return;
  }
  setPaused(!isPaused);
}

playToggle.addEventListener("click", (event) => {
  event.stopPropagation();
  togglePlayback();
});

traceCanvas.addEventListener("click", () => {
  togglePlayback();
});

traceCanvas.addEventListener("keydown", (event) => {
  if (event.target !== traceCanvas) return;
  if (event.key === " " || event.key === "Enter") {
    event.preventDefault();
    togglePlayback();
    return;
  }
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  event.preventDefault();
  inspectStage(activeIndex + (event.key === "ArrowRight" ? 1 : -1));
});

function preserveElapsedTime() {
  if (!isPaused && !reducedMotion.matches && animationFrame) {
    pausedElapsed = Math.min(performance.now() - stageStartedAt, currentStageDuration());
    window.cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    stopTerminalScroll();
  }
}

function resumeIfPossible() {
  if (!canPlay()) return;
  stageStartedAt = performance.now() - pausedElapsed;
  animationFrame = window.requestAnimationFrame(tick);
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) preserveElapsedTime();
  else resumeIfPossible();
});

if ("IntersectionObserver" in window) {
  const visibilityObserver = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) preserveElapsedTime();
      isVisible = entry.isIntersecting;
      if (isVisible) resumeIfPossible();
    },
    { threshold: 0.3 },
  );
  visibilityObserver.observe(story);
}

function handleReducedMotionChange() {
  isPaused = reducedMotion.matches;
  inspectionMode = false;
  updatePlaybackUI();
  if (reducedMotion.matches) renderReducedTrace(activeIndex);
  else startStage(activeIndex, { clear: true });
}

if (reducedMotion.addEventListener) reducedMotion.addEventListener("change", handleReducedMotionChange);
else reducedMotion.addListener(handleReducedMotionChange);

if (rawTrigger && rawDialog && rawClose) {
function loadRawImages() {
  story.querySelectorAll(".raw-gallery img[data-src]").forEach((image) => {
    image.src = image.dataset.src;
    image.removeAttribute("data-src");
    image.decoding = "async";
  });
}

rawTrigger.addEventListener("click", () => {
  loadRawImages();
  wasPlayingBeforeDialog = !isPaused;
  if (wasPlayingBeforeDialog) setPaused(true);
  rawDialog.showModal();
  document.body.style.overflow = "hidden";
});

function restoreAfterDialog() {
  document.body.style.overflow = "";
  if (wasPlayingBeforeDialog) setPaused(false);
  wasPlayingBeforeDialog = false;
}

function closeRawDialog() {
  rawDialog.close();
  restoreAfterDialog();
  rawTrigger.focus();
}

rawClose.addEventListener("click", closeRawDialog);
rawDialog.addEventListener("cancel", restoreAfterDialog);
rawDialog.addEventListener("click", (event) => {
  if (event.target === rawDialog) closeRawDialog();
});
}


updatePlaybackUI();
if (reducedMotion.matches) renderReducedTrace(0);
else startStage(0, { clear: true });
})();
