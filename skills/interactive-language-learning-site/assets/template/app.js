/* Replace this starter with interactions built only from the supplied lesson data. */
const lesson = window.lesson || {};
document.querySelector('#course-label').textContent = lesson.courseLabel || '請填入課程名稱';
document.querySelector('#course-title').textContent = lesson.title || '互動語言學習站';
document.querySelector('#study-content').textContent = '請依教材建立自學卡與音檔控制。';
document.querySelector('#game-content').textContent = '請依教材建立解鎖式闖關。';
document.querySelector('#result-content').textContent = '請加入答題統計與再學習建議。';
document.querySelector('#site-footer').textContent = lesson.footer || '';
