# 跨角色協同工作規範 (Multi-Agent Protocol)

## 1. 核心溝通鏈結 (Pipeline)
所有開發任務必須嚴格遵循以下接棒順序：
PM (需求) -> SA (架構與規格) -> PG (程式碼實作) -> QA (測試驗證)

## 2. 接棒與交付標準 (DoD - Definition of Done)
- **PM 到 SA**：PM 必須產出用戶故事（User Story）與業務邏輯，未經 PM 確認前，SA 不得開始設計。
- **SA 到 PG**：SA 必須產出資料模型、API 規格與流程圖（Sequence Diagram），PG 不得自行更改架構。
- **PG 到 QA**：PG 必須通過本地單元測試並提交 Pull Request，QA 始得進行功能測試。

## 3. 行為約束
- 代理之間不得越權。PG 絕對不可直接修改 SA 定義的 API 欄位名稱。
- 所有對話與產出物（Artifacts）一律使用繁體中文（zh-TW）。
