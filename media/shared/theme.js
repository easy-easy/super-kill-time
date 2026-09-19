// @ts-check
(function () {
  'use strict';

  window.SKT = window.SKT || {};

  // VS Code のテーマ変数から色を拾う
  window.SKT.themeColors = function () {
    const s = getComputedStyle(document.body);
    const fg = s.getPropertyValue('--vscode-editor-foreground').trim() || '#cccccc';
    const accent =
      s.getPropertyValue('--vscode-textLink-foreground').trim() ||
      s.getPropertyValue('--vscode-focusBorder').trim() ||
      '#4daafc';
    return { fg, accent };
  };
})();
