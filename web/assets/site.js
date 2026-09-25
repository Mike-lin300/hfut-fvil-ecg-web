/* 增强脚本：被禁用时折叠/目录/跳转/高亮均不受影响 */
document.querySelectorAll('.copybtn').forEach(function (b) {
  b.addEventListener('click', function () {
    var code = b.parentNode.querySelector('code');
    if (navigator.clipboard) navigator.clipboard.writeText(code.innerText).then(function () {
      b.textContent = '已复制'; setTimeout(function () { b.textContent = '复制'; }, 1200);
    });
  });
});
window.addEventListener('beforeprint', function () {
  document.querySelectorAll('details').forEach(function (d) { d.setAttribute('open', ''); });
});
