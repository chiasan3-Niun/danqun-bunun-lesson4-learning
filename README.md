# 丹群布農語第一階第四課學習站

## 本機開啟

這是 buildless、無外部依賴的原生 HTML/CSS/JavaScript 網站，不需要安裝套件、不需要 build，也不需要登入。

直接開啟：在檔案總管開啟以下資料夾，雙擊 `index.html`：

`C:\Users\user\Downloads\網頁測試\丹群布農語第一階第四課學習站`

PowerShell 也可以執行：

```powershell
Set-Location -LiteralPath 'C:\Users\user\Downloads\網頁測試\丹群布農語第一階第四課學習站'
Start-Process -FilePath .\index.html
```

若瀏覽器限制 `file:` 音檔播放，可在同一資料夾用既有 Python 開本機靜態伺服器，再開啟 `http://localhost:8000`；這不會新增專案依賴：

```powershell
python -m http.server 8000
```

網站包含四個自學模組、四個依序解鎖的闖關、答題即時回饋、知識點診斷、再學習與只重測薄弱知識點；進度與答題紀錄只保存在瀏覽器 `localStorage`。

## 檢查指令

從網站資料夾執行：

```powershell
powershell -NoProfile -ExecutionPolicy RemoteSigned -File .\tests\static-check.ps1
powershell -NoProfile -ExecutionPolicy RemoteSigned -File .\tests\study-check.ps1
node .\tests\level-check.cjs
node .\tests\comprehensive-check.cjs
node .\tests\task-5-asset-check.cjs
node .\tests\task-6-final-check.cjs
```

上述檢查不需要 npm、套件或建置流程。

## 功能範圍與教材來源

本網站只處理第一階第四課「Simaq aas? 你是誰？」的自學與評量：詞語卡、句型卡、聽讀卡、問候倫理、詞語打地鼠、聽音找句、句子拼拼看、問候情境挑戰，以及答題回饋和診斷補強。未加入教材以外的新教學內容，也不使用瀏覽器語音辨識評分。

教材內容集中在 `data/lesson4.js`。詞語、句子、文化說明和題目以 `sourceId`、`sourceNote` 記錄出處。來源只限以下兩份 Google Docs 原稿：

- [1-4-1丹群簡報原始檔](https://docs.google.com/document/d/1icz4LzAoSYGtjLN4wcv_--1zD2jcBJbIu-6rDh0rWFE)
- [1-4-2丹群簡報原始檔](https://docs.google.com/document/d/18s3FB_48l7qd1FEvRCPxeONLFUu-wb8juJdkr2_TDFE)

## 頻道署名

本網站的頻道署名為 **Niun的族語教學多媒體應用**：[YouTube 頻道](https://www.youtube.com/@chiasan3)。

## 版權與文本來源

網站著作權聲明：© 2026 Niun的族語教學多媒體應用｜著作權所有，未經授權不得重製、改作或公開傳輸。

語料授權：Copyright © 2026 財團法人原住民族語言研究發展基金會 版權所有。

文本來源：網站中12階教材內容，以國立政治大學原住民族研究中心提供之教材為依據。  
發行單位：教育部、原住民族委員會。  
編輯單位：國立政治大學原住民族研究中心。  
教材內容出處：[https://ebook-alcd.k12ea.gov.tw](https://ebook-alcd.k12ea.gov.tw)
