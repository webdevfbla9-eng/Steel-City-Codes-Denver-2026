(function () {
  var section = document.querySelector(".counts");
  var nodes = document.querySelectorAll("[data-count]");
  if (!section || !nodes.length) return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var started = false;

  function tick(el, target, start, duration, now) {
    var progress = Math.min(1, (now - start) / duration);
    var eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = String(Math.round(target * eased));
    if (progress < 1) {
      requestAnimationFrame(function (next) {
        tick(el, target, start, duration, next);
      });
    }
  }

  function run() {
    if (started) return;
    started = true;
    nodes.forEach(function (el) {
      var target = Number(el.getAttribute("data-count"));
      if (reduce) {
        el.textContent = String(target);
        return;
      }
      el.textContent = "0";
      requestAnimationFrame(function (now) {
        tick(el, target, now, 1400, now);
      });
    });
  }

  if (reduce || !("IntersectionObserver" in window)) {
    run();
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      run();
      observer.disconnect();
    });
  }, { threshold: 0.4 });

  observer.observe(section);
})();
