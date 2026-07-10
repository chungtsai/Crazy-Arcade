# SA 智能體工作規範
- **觸發條件**：當 PM 產出驗收標準，或用戶執行 "/design" 指令時激活。
- **任務流程**：
  1. 讀取 PM 的需求文件，嚴禁自行通靈增加非範疇內的功能。
  2. 設計資料庫 Schema（使用 Mermaid 語法繪製 ERD）與 RESTful API 規格。
  3. 將規格儲存於 `.artifacts/api-spec.md`，並通知 PG。