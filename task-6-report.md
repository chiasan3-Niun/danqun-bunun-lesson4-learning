# Task 6 收尾報告

日期：2026-11-17

## 完成項目

- 只修改獨立網站 `丹群布農語第一階第四課學習站`；根網站未修改。
- 加入跳到主要內容連結、可見鍵盤焦點、語意 CSS token、最小 `2.75rem` 觸控尺寸、可換行選項與 `42rem` 窄版規則。
- 窄版改用非固定背景，遊戲選項可換行，按鈕與卡片內容允許斷行，降低手機與放大文字時的水平溢出風險。
- README 補上精確本機開啟路徑、直接開啟與可選靜態伺服器方式、完整檢查指令、功能範圍、兩份教材來源、音檔來源與「單群／丹群」待核對 caveat。
- 新增 `DESIGN_SYSTEM.md`、`UI_UX_REVIEW.md` 與 Task 6 最小靜態收尾檢查 `tests/task-6-final-check.cjs`。

## 已通過測試

以下指令均在網站資料夾內執行，退出碼皆為 0：

- `node .\tests\task-6-final-check.cjs`：PASS（responsive、keyboard、accessibility、documentation、final static contracts）
- `powershell -NoProfile -ExecutionPolicy RemoteSigned -File .\tests\static-check.ps1`：PASS
- `powershell -NoProfile -ExecutionPolicy RemoteSigned -File .\tests\study-check.ps1`：PASS
- `node .\tests\level-check.cjs`：17/17 PASS
- `node .\tests\task-5-asset-check.cjs`：PASS

## 根網站保護

根目錄三個既有檔案的 SHA-256 與修改前基線一致：

- `index.html`: `1A07498B54FBDA6002F049E8018481C44C9EDB6E93D1F004798F013F1E0E96B0`
- `app.js`: `9772E2D9ED90E84183EC78703E9069E56FC752F038058C280E8C822F23DAD722`
- `styles.css`: `D58919AFAE3BEF58BEB7ADECE752C39A33D6CFB6D9AEDBD2C91772FBC953A684`

## 未執行項目

依使用者本次指示，未啟動本機靜態服務，也未再進行瀏覽器 smoke check；因此本報告只記錄靜態與既有 Node/PowerShell 檢查結果。音檔仍維持「布農_丹群_男聲」產生、`available-pending-confirmation`，正式教學前仍需由熟悉指定方言的教師或語言知識持有者核對。

## 頻道署名

**Niun的族語教學多媒體應用**：[YouTube 頻道](https://www.youtube.com/@chiasan3)

## 版權與文本來源

文本來源：網站中12階教材內容，以國立政治大學原住民族研究中心提供之教材為依據。  
發行單位：教育部、原住民族委員會。  
編輯單位：國立政治大學原住民族研究中心。  
教材內容出處：[https://ebook-alcd.k12ea.gov.tw](https://ebook-alcd.k12ea.gov.tw)
