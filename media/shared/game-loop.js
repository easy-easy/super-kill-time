// @ts-check
(function () {
  'use strict';

  window.SKT = window.SKT || {};

  /** @param {{update: (dt: number) => void, draw: () => void}} handlers */
  window.SKT.runLoop = function (handlers) {
    let last = performance.now();

    function frame(now) {
      // タブ非表示から戻ったときに巨大な dt で動きが飛ばないよう上限を設ける
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;

      handlers.update(dt);
      handlers.draw();
      requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  };
})();
