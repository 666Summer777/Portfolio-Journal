# AGENTS.md

# 项目名称：Portfolio Journal

Portfolio Journal 是一个个人投资记录 App。

这个 App 的核心目标是：帮助用户长期记录自己到底往不同投资品类里投入了多少钱。

它不是交易 App，不是投资建议 App，也不是实时资产估值 App。

这个项目的重点不是复杂金融分析，而是稳定、清晰、长期可维护地记录投资投入金额。

---

## 1. 最重要的长期原则

- App 界面必须保持英文。
- 项目说明、开发备注、AGENTS.md 可以使用中文。
- App 优先服务于 iPhone / iOS Safari / PWA 使用场景。
- 用户后续可能会把 App 添加到 iPhone 主屏幕，像独立 App 一样使用。
- 第一阶段主要使用 localStorage 保存数据。
- 修改任何数据结构前，必须优先考虑旧数据兼容。
- 不要轻易清空 localStorage。
- 不要轻易修改 localStorage key。
- 如果必须修改数据结构，需要提供 migration 逻辑。
- 不要从零重写整个项目，除非用户明确要求。
- 每次修改都应该小步、安全、可回退。
- 不要为了炫技引入复杂架构。
- 不要把项目做成桌面后台系统。
- 不要把 App 做成交易所风格。
- 不要加入用户没有要求的复杂功能。

---

## 2. App 名称

App 名称固定为：

Portfolio Journal

这个名称需要统一用于：

- App title
- 页面标题
- 浏览器标题
- PWA 名称
- 项目文档

除非用户明确要求，否则不要随意更改 App 名称。

---

## 3. 当前核心页面结构

当前主要页面包括：

- Dashboard
- Stocks & Funds
- Crypto
- Settings / Backup

未来可能增加：

- A-Shares
- HK Stocks
- Gold
- Other Assets
- Notes / Journal
- Analysis

因此，不要把代码结构写死成只能支持两个投资页面。

---

## 4. Dashboard 长期规则

Dashboard 的核心职责是让用户快速看到：

How much money have I invested in total?

Dashboard 第一版只需要重点显示：

- Total Capital In

Total Capital In 表示整个 App 中所有投资类别的累计投入金额。

第一版如果只有 Stocks & Funds 有数据，则：

Total Capital In = Stocks & Funds Total

未来当 Crypto、A 股、港股、黄金等模块完成后，Total Capital In 应该来自所有资产类别的合计。

Dashboard 暂时不要加入：

- Profit / Loss
- Return rate
- Live prices
- Market charts
- Asset allocation charts
- Complex financial dashboard
- Fake data
- Unverified investment performance

Dashboard 应该保持极简、清晰、耐看。

---

## 5. Stocks & Funds 页面长期规则

页面名称必须是：

Stocks & Funds

不要命名为：

US Funds

原因：用户未来不仅可能投资美股基金，也可能投资 A 股、港股、ETF、QDII 基金和其他基金。

Stocks & Funds 页面用于记录股票、ETF、基金相关投资。

该页面应该显示该类别自己的累计投入金额：

- Stocks & Funds Total

Stocks & Funds Total 的计算逻辑：

- 读取所有 stocksAndFunds records
- 累加每条记录的 Amount
- 显示总金额

Stocks & Funds 表单字段推荐顺序：

1. Date
2. Category
3. Amount
4. Note

Category 必须放在 Amount 上面。

当前 Category 推荐选项：

- S&P 500 Fund
- Nasdaq Fund
- Other

当用户选择 Other 时，需要显示额外输入框：

Label:

Custom Category

Placeholder:

Enter fund name

保存规则：

- 如果 Category 是 S&P 500 Fund 或 Nasdaq Fund，就直接保存该值。
- 如果 Category 是 Other，就保存 Custom Category 输入框中的内容作为真正 category。
- 如果用户填写了 Custom Category，不要把 Other 这个词保存为 category。
- 如果用户选择 Other 但没有填写 Custom Category，需要阻止保存，并显示简单英文提示。

未来可以扩展的 category 包括：

- A-Shares
- HK Stocks
- QDII Fund
- ETF
- Bond Fund
- Other Funds

不要把 category 写死到难以修改的结构里。

---

## 6. Crypto 页面长期规则

Crypto 页面当前可以先做占位。

占位文案可以使用：

Crypto tracking is not configured yet.

未来 Crypto 页面可能需要记录：

- USDT deposits
- Buy records
- Sell records
- Asset quantity
- Trade value
- Fees or losses
- Platform
- Notes

Crypto 记录不应该和 Stocks & Funds 记录混在同一个混乱数组里。

推荐把 Crypto 数据分开：

- deposits
- trades

未来 Crypto 页面可能比 Stocks & Funds 更复杂，因此代码结构需要预留扩展空间。

第一阶段不要急着加入：

- Live crypto prices
- Exchange API
- Wallet connection
- On-chain data
- Auto-sync
- Trading functions
- Complex charts

---

## 7. Settings / Backup 长期规则

Settings / Backup 页面非常重要。

因为这个 App 主要依赖 iPhone / iOS Safari / PWA 里的 localStorage 保存数据，所以必须长期保留备份功能。

必须保留或预留：

- Export JSON
- Import JSON
- Export CSV

除非用户明确要求，否则不要删除备份入口。

如果未来修改导入导出功能，必须保证：

- Export JSON 仍然可用
- Import JSON 仍然可用
- Export CSV 仍然可用
- 旧版本导出的 JSON 尽量仍然可以导入
- 不要因为版本更新导致用户无法恢复数据

未来可以考虑：

- Import 前自动备份当前数据
- 导出文件名带日期
- 数据版本号
- 数据迁移提示

---

## 8. 数据存储长期规则

第一阶段使用 localStorage。

推荐数据结构：

```js
{
  version: 1,
  stocksAndFunds: [],
  crypto: {
    deposits: [],
    trades: []
  },
  settings: {}
}