/**
 * Especell theme interactions.
 *
 * Two rules this file follows:
 *
 * 1. Motion is an enhancement, never a requirement. The `.js` class added in
 *    the <head> is what enables the hidden-then-reveal styles, so if this
 *    script never runs the content is simply visible.
 *
 * 2. The theme editor swaps section markup at runtime and fires
 *    `shopify:section:load`. Anything that binds to elements has to be
 *    re-applied to the new markup, or freshly rendered sections stay
 *    invisible while the merchant is editing them.
 */
(function () {
  'use strict';

  var reduceMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var supportsObserver = 'IntersectionObserver' in window;
  var finePointer =
    window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* Marks elements we've already wired so re-init never double-binds. */
  var BOUND = 'data-bound';

  /* One element can be claimed by two features at once — a FAQ group that is
     also revealed on scroll, for instance. A single shared flag made the
     second feature skip it silently, so each caller may pass its own. */
  function unbound(root, selector, flag) {
    var attr = flag || BOUND;
    return Array.prototype.filter.call(root.querySelectorAll(selector), function (el) {
      if (el.hasAttribute(attr)) return false;
      el.setAttribute(attr, '');
      return true;
    });
  }

  /* ------------------------------------------------------------------
   * Reveal on scroll, with stagger for grouped children
   * ---------------------------------------------------------------- */
  var revealObserver = null;

  function initReveal(root) {
    var targets = unbound(root, '[data-animate]');
    if (!targets.length) return;

    if (reduceMotion || !supportsObserver) {
      targets.forEach(function (el) {
        el.classList.add('is-visible');
      });
      return;
    }

    if (!revealObserver) {
      revealObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          });
        },
        { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
      );
    }

    // Stagger siblings that share a parent so grids cascade in.
    var seen = new Map();
    targets.forEach(function (el) {
      var parent = el.parentElement;
      var index = seen.get(parent) || 0;
      seen.set(parent, index + 1);
      if (index > 0 && index < 8) {
        el.style.setProperty('--reveal-delay', index * 80 + 'ms');
      }
      revealObserver.observe(el);
    });
  }

  /* ------------------------------------------------------------------
   * Safety net for the reveal.
   *
   * IntersectionObserver is the primary mechanism, but if it ever fails to
   * fire — a browser quirk, a background/throttled tab, an embedded webview —
   * the page would be left blank, since the content starts at opacity 0.
   * This sweep reveals anything already on screen using plain geometry, so a
   * broken observer costs an animation, never the content.
   * ---------------------------------------------------------------- */
  var sweepBound = false;
  var sweepTicking = false;

  function sweepReveal() {
    var pending = document.querySelectorAll('[data-animate]:not(.is-visible)');
    sweepTicking = false;

    if (!pending.length) return;

    var vh = window.innerHeight || document.documentElement.clientHeight;
    Array.prototype.forEach.call(pending, function (el) {
      var rect = el.getBoundingClientRect();
      var onScreen = rect.top < vh && rect.bottom > 0;
      if (onScreen) el.classList.add('is-visible');
    });
  }

  function bindSweep() {
    if (sweepBound) return;
    sweepBound = true;

    window.addEventListener(
      'scroll',
      function () {
        if (sweepTicking) return;
        window.requestAnimationFrame(sweepReveal);
        sweepTicking = true;
      },
      { passive: true }
    );

    // Give the observer a fair chance first, then backstop it.
    window.setTimeout(sweepReveal, 1200);
  }

  /* ------------------------------------------------------------------
   * Count-up numbers when they scroll into view
   * ---------------------------------------------------------------- */
  var counterObserver = null;

  function initCounters(root) {
    var counters = unbound(root, '[data-counter]');
    if (!counters.length) return;

    function paint(el, value) {
      el.textContent = String(value);
    }

    if (reduceMotion || !supportsObserver) {
      counters.forEach(function (el) {
        paint(el, parseInt(el.dataset.counter, 10) || 0);
      });
      return;
    }

    function run(el) {
      var target = parseInt(el.dataset.counter, 10);
      if (isNaN(target)) return;

      var duration = 1400;
      var start = null;

      function step(timestamp) {
        if (start === null) start = timestamp;
        var progress = Math.min((timestamp - start) / duration, 1);
        // easeOutExpo keeps the last digits from crawling
        var eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        paint(el, Math.round(eased * target));
        if (progress < 1) window.requestAnimationFrame(step);
      }

      window.requestAnimationFrame(step);
    }

    if (!counterObserver) {
      counterObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            run(entry.target);
            counterObserver.unobserve(entry.target);
          });
        },
        { threshold: 0.5 }
      );
    }

    counters.forEach(function (el) {
      paint(el, 0);
      counterObserver.observe(el);
    });
  }

  /* ------------------------------------------------------------------
   * Parallax layers — one shared scroll listener, refreshable list
   * ---------------------------------------------------------------- */
  var parallaxLayers = [];
  var parallaxBound = false;
  var parallaxTicking = false;

  function updateParallax() {
    parallaxLayers.forEach(function (el) {
      if (!el.isConnected) return;
      var rect = el.getBoundingClientRect();
      // Skip work for anything comfortably off-screen
      if (rect.bottom < -200 || rect.top > window.innerHeight + 200) return;
      var speed = parseFloat(el.dataset.parallaxSpeed || '0.12');
      var scale = el.dataset.parallaxScale || '1.08';
      el.style.transform =
        'translate3d(0,' + rect.top * speed + 'px, 0) scale(' + scale + ')';
    });
    parallaxTicking = false;
  }

  function initParallax() {
    if (reduceMotion) return;

    parallaxLayers = Array.prototype.slice.call(
      document.querySelectorAll('[data-parallax]')
    );
    if (!parallaxLayers.length) return;

    if (!parallaxBound) {
      window.addEventListener(
        'scroll',
        function () {
          if (parallaxTicking) return;
          window.requestAnimationFrame(updateParallax);
          parallaxTicking = true;
        },
        { passive: true }
      );
      parallaxBound = true;
    }

    updateParallax();
  }

  /* ------------------------------------------------------------------
   * Subtle 3D tilt following the pointer
   * ---------------------------------------------------------------- */
  function initTilt(root) {
    if (reduceMotion || !finePointer) return;

    var MAX = 5; // degrees

    unbound(root, '[data-tilt]').forEach(function (card) {
      var frame = null;

      card.addEventListener('pointermove', function (event) {
        if (frame) return;
        frame = window.requestAnimationFrame(function () {
          var rect = card.getBoundingClientRect();
          var px = (event.clientX - rect.left) / rect.width - 0.5;
          var py = (event.clientY - rect.top) / rect.height - 0.5;
          card.style.transform =
            'perspective(900px) rotateX(' +
            (-py * MAX).toFixed(2) +
            'deg) rotateY(' +
            (px * MAX).toFixed(2) +
            'deg) translateY(-6px)';
          // Same event pays for the glow: no second listener per card.
          card.style.setProperty('--mx', (((px + 0.5) * 100)).toFixed(1) + '%');
          card.style.setProperty('--my', (((py + 0.5) * 100)).toFixed(1) + '%');
          frame = null;
        });
      });

      card.addEventListener('pointerleave', function () {
        if (frame) {
          window.cancelAnimationFrame(frame);
          frame = null;
        }
        card.style.transform = '';
      });
    });
  }

  /* ------------------------------------------------------------------
   * Magnetic buttons — they lean toward the cursor
   * ---------------------------------------------------------------- */
  function initMagnetic(root) {
    if (reduceMotion || !finePointer) return;

    var STRENGTH = 0.22;

    unbound(root, '[data-magnetic]').forEach(function (el) {
      var frame = null;

      el.addEventListener('pointermove', function (event) {
        if (frame) return;
        frame = window.requestAnimationFrame(function () {
          var rect = el.getBoundingClientRect();
          var dx = (event.clientX - (rect.left + rect.width / 2)) * STRENGTH;
          var dy = (event.clientY - (rect.top + rect.height / 2)) * STRENGTH;
          el.style.setProperty('--magnet-x', dx.toFixed(1) + 'px');
          el.style.setProperty('--magnet-y', dy.toFixed(1) + 'px');
          frame = null;
        });
      });

      el.addEventListener('pointerleave', function () {
        if (frame) {
          window.cancelAnimationFrame(frame);
          frame = null;
        }
        el.style.setProperty('--magnet-x', '0px');
        el.style.setProperty('--magnet-y', '0px');
      });
    });
  }

  /* ------------------------------------------------------------------
   * FAQ: keep only one answer open at a time
   * ---------------------------------------------------------------- */
  function initAccordion(root) {
    unbound(root, '[data-accordion]', 'data-accordion-bound').forEach(function (group) {
      // Delegated, and the rows are looked up when the event fires rather
      // than when this binds — a group whose rows are built later (the
      // service pages assemble theirs from the page body) still behaves.
      // `toggle` does not bubble, hence the capture phase.
      group.addEventListener(
        'toggle',
        function (event) {
          var item = event.target;
          if (item.tagName !== 'DETAILS' || !item.open) return;
          Array.prototype.forEach.call(
            group.querySelectorAll('details'),
            function (other) {
              if (other !== item) other.open = false;
            }
          );
        },
        true
      );
    });
  }

  /* ------------------------------------------------------------------
   * Mobile navigation
   * ---------------------------------------------------------------- */
  function initMenu(root) {
    var toggle = root.querySelector('[data-menu-toggle]');
    var menu = root.querySelector('[data-mobile-menu]');
    if (!toggle || !menu || toggle.hasAttribute(BOUND)) return;
    toggle.setAttribute(BOUND, '');

    toggle.addEventListener('click', function () {
      var isOpen = menu.hasAttribute('data-open');
      if (isOpen) {
        menu.removeAttribute('data-open');
        toggle.setAttribute('aria-expanded', 'false');
      } else {
        menu.setAttribute('data-open', '');
        toggle.setAttribute('aria-expanded', 'true');
      }
    });

    // Close the menu after tapping a link.
    menu.addEventListener('click', function (event) {
      if (event.target.closest('a')) {
        menu.removeAttribute('data-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ------------------------------------------------------------------
   * Header shadow once the page scrolls
   * ---------------------------------------------------------------- */
  function initHeaderState(root) {
    var header = root.querySelector('[data-site-header]');
    if (!header || header.hasAttribute(BOUND)) return;
    header.setAttribute(BOUND, '');

    var ticking = false;

    function update() {
      header.classList.toggle('is-scrolled', window.scrollY > 12);
      ticking = false;
    }

    window.addEventListener(
      'scroll',
      function () {
        if (ticking) return;
        window.requestAnimationFrame(update);
        ticking = true;
      },
      { passive: true }
    );

    update();
  }

  /* ------------------------------------------------------------------
   * Spotlight that follows the pointer across the hero.
   *
   * pointermove covers mouse and touch alike, so the same code lights up
   * under a finger. Since nobody drags a finger around for fun, on touch the
   * light also drifts with scroll so the effect is alive without input.
   * ---------------------------------------------------------------- */
  function initSpotlight(root) {
    var light = root.querySelector('[data-spotlight]');
    // Pointer-driven by definition: without a pointer the light has nothing to
    // follow, and drifting it on scroll read as a stray blob on phones.
    if (!light || light.hasAttribute(BOUND) || reduceMotion || !finePointer) return;
    light.setAttribute(BOUND, '');

    var stage = light.closest('.hero__stage') || light.parentElement;
    if (!stage) return;

    // Target position vs rendered position: easing between them is what makes
    // the light glide rather than stick to the cursor.
    var targetX = null;
    var targetY = null;
    var currentX = null;
    var currentY = null;
    var running = false;

    function frame() {
      if (targetX === null) {
        running = false;
        return;
      }
      if (currentX === null) {
        currentX = targetX;
        currentY = targetY;
      }
      currentX += (targetX - currentX) * 0.12;
      currentY += (targetY - currentY) * 0.12;
      light.style.setProperty('--sx', currentX.toFixed(1) + 'px');
      light.style.setProperty('--sy', currentY.toFixed(1) + 'px');

      var settled =
        Math.abs(targetX - currentX) < 0.4 && Math.abs(targetY - currentY) < 0.4;
      if (settled) {
        running = false;
      } else {
        window.requestAnimationFrame(frame);
      }
    }

    function moveTo(x, y) {
      targetX = x;
      targetY = y;
      light.classList.add('is-lit');
      if (!running) {
        running = true;
        window.requestAnimationFrame(frame);
      }
    }

    stage.addEventListener(
      'pointermove',
      function (event) {
        var rect = stage.getBoundingClientRect();
        moveTo(event.clientX - rect.left, event.clientY - rect.top);
      },
      { passive: true }
    );

    stage.addEventListener('pointerleave', function () {
      light.classList.remove('is-lit');
    });

  }

  /* ------------------------------------------------------------------
   * Reading progress bar
   * ---------------------------------------------------------------- */
  function initReadingProgress() {
    var bar = document.querySelector('[data-reading-progress]');
    if (!bar || bar.hasAttribute(BOUND)) return;
    bar.setAttribute(BOUND, '');

    var ticking = false;

    function update() {
      var doc = document.documentElement;
      var scrollable = doc.scrollHeight - window.innerHeight;
      var progress = scrollable > 0 ? window.scrollY / scrollable : 0;
      // Clamp: elastic/overscroll can push this outside 0–1 on touch devices
      progress = Math.max(0, Math.min(progress, 1));
      bar.style.transform = 'scaleX(' + progress.toFixed(4) + ')';
      ticking = false;
    }

    function request() {
      if (ticking) return;
      window.requestAnimationFrame(update);
      ticking = true;
    }

    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request, { passive: true });
    update();
  }

  /* ------------------------------------------------------------------
   * Section dots
   *
   * Built from the sections actually on the page, labelled by each one's
   * heading. Active state is computed from geometry rather than
   * IntersectionObserver — this page has to work even where the observer is
   * unreliable, and the dots are navigation, not decoration.
   * ---------------------------------------------------------------- */
  function initSectionDots() {
    var nav = document.querySelector('[data-section-dots]');
    if (!nav || nav.hasAttribute(BOUND)) return;
    nav.setAttribute(BOUND, '');

    var sections = Array.prototype.filter.call(
      document.querySelectorAll('section[id]'),
      function (el) {
        return el.offsetHeight > 120;
      }
    );

    // One dot is not navigation, it is clutter.
    if (sections.length < 3) {
      nav.remove();
      return;
    }

    sections.forEach(function (section) {
      var heading = section.querySelector('h1, h2');
      var label = heading ? heading.textContent.trim() : section.id;
      if (label.length > 28) label = label.slice(0, 28).trim() + '…';

      var item = document.createElement('button');
      item.type = 'button';
      item.className = 'section-dots__item';
      item.setAttribute('aria-current', 'false');
      item.innerHTML =
        '<span class="section-dots__label">' +
        label.replace(/[<>&]/g, '') +
        '</span><span class="section-dots__dot"></span>';

      item.addEventListener('click', function () {
        section.scrollIntoView({
          behavior: reduceMotion ? 'auto' : 'smooth',
          block: 'start',
        });
      });

      nav.appendChild(item);
    });

    var items = nav.querySelectorAll('.section-dots__item');
    var ticking = false;

    function update() {
      ticking = false;
      // The section covering the middle of the viewport is the one you are on
      var probe = window.innerHeight / 2;
      var activeIndex = -1;

      sections.forEach(function (section, i) {
        var rect = section.getBoundingClientRect();
        if (rect.top <= probe && rect.bottom > probe) activeIndex = i;
      });

      items.forEach(function (item, i) {
        item.setAttribute('aria-current', i === activeIndex ? 'true' : 'false');
      });

      // Flip the dot outline when sitting over a dark section
      if (activeIndex > -1) {
        var onDark = sections[activeIndex].classList.contains('bg-ink');
        if (onDark) {
          nav.setAttribute('data-on-dark', '');
        } else {
          nav.removeAttribute('data-on-dark');
        }
      }
    }

    window.addEventListener(
      'scroll',
      function () {
        if (ticking) return;
        window.requestAnimationFrame(update);
        ticking = true;
      },
      { passive: true }
    );
    window.addEventListener('resize', function () {
      if (ticking) return;
      window.requestAnimationFrame(update);
      ticking = true;
    }, { passive: true });

    update();
  }

  /* ------------------------------------------------------------------
   * Back-to-top: only appears once there is something to go back to
   * ---------------------------------------------------------------- */
  function initBackToTop() {
    var btn = document.querySelector('[data-back-to-top]');
    if (!btn || btn.hasAttribute(BOUND)) return;
    btn.setAttribute(BOUND, '');

    var ticking = false;

    function update() {
      if (window.scrollY > window.innerHeight * 0.8) {
        btn.removeAttribute('hidden');
      } else {
        btn.setAttribute('hidden', '');
      }
      ticking = false;
    }

    window.addEventListener(
      'scroll',
      function () {
        if (ticking) return;
        window.requestAnimationFrame(update);
        ticking = true;
      },
      { passive: true }
    );

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });

    update();
  }

  /* ------------------------------------------------------------------
   * Service pages: upgrade plain admin-written HTML into the site's UI
   *
   * The body of a service page is written in the Shopify rich-text editor,
   * so it arrives as bare h2/h3/p/ul/ol. Rather than ask the merchant to
   * hand-build markup, the shapes they already write are promoted here:
   * every h3 + paragraph becomes an accordion row, and the h2 list becomes
   * a sticky index. Content stays plain and portable; presentation is ours.
   * ---------------------------------------------------------------- */
  function slugify(text) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60);
  }

  function buildServiceFaq(content) {
    var headings = Array.prototype.slice.call(content.querySelectorAll('h3'));
    if (!headings.length) return;

    var group = document.createElement('div');
    group.className = 'faq__list service-faq';
    group.setAttribute('data-accordion', '');
    headings[0].parentNode.insertBefore(group, headings[0]);

    headings.forEach(function (heading) {
      var answer = heading.nextElementSibling;
      if (!answer || answer.tagName !== 'P') return;

      var details = document.createElement('details');
      details.className = 'faq__item';

      var summary = document.createElement('summary');
      summary.className = 'faq__question';

      var icon = document.createElement('span');
      icon.className = 'faq__icon';
      icon.setAttribute('aria-hidden', 'true');

      // The h3 itself moves in, so the heading outline survives the rewrite.
      summary.appendChild(heading);
      summary.appendChild(icon);

      var body = document.createElement('div');
      body.className = 'faq__answer rte';
      body.appendChild(answer);

      details.appendChild(summary);
      details.appendChild(body);
      group.appendChild(details);
    });
  }

  function revealBelowFold(content) {
    if (reduceMotion) return;
    var fold = window.innerHeight;
    Array.prototype.forEach.call(content.children, function (child) {
      // Only elements already off-screen get the hidden start state —
      // attaching it to something visible would flash it out and back in.
      if (child.getBoundingClientRect().top > fold) {
        child.setAttribute('data-animate', '');
      }
    });
  }

  function buildServiceIndex(content) {
    var aside = document.querySelector('.service-body__aside');
    if (!aside) return;

    var headings = Array.prototype.filter.call(
      content.querySelectorAll('h2'),
      function (h) { return h.textContent.trim() !== ''; }
    );
    if (headings.length < 3) return;

    var nav = document.createElement('nav');
    nav.className = 'service-index';
    nav.setAttribute('aria-label', 'Nesta página');

    var title = document.createElement('p');
    title.className = 'service-index__title';
    title.textContent = 'Nesta página';
    nav.appendChild(title);

    var list = document.createElement('ul');
    var links = [];

    headings.forEach(function (heading) {
      if (!heading.id) heading.id = slugify(heading.textContent);
      var item = document.createElement('li');
      var link = document.createElement('a');
      link.href = '#' + heading.id;
      link.textContent = heading.textContent;
      item.appendChild(link);
      list.appendChild(item);
      links.push({ link: link, heading: heading });
    });

    nav.appendChild(list);
    aside.insertBefore(nav, aside.firstChild);

    var ticking = false;
    function highlight() {
      ticking = false;
      var active = links[0];
      links.forEach(function (entry) {
        if (entry.heading.getBoundingClientRect().top <= 140) active = entry;
      });
      links.forEach(function (entry) {
        entry.link.classList.toggle('is-active', entry === active);
      });
    }
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(highlight);
    }, { passive: true });
    highlight();
  }

  function initServiceContent(root) {
    // Not `unbound`: that helper shares one data-bound flag across every init
    // function, and this article already carries data-animate — initReveal
    // claims it first and this would never see it. Own flag, own lifecycle.
    Array.prototype.forEach.call(
      root.querySelectorAll('.service-body__content'),
      function (content) {
        if (content.hasAttribute('data-service-ready')) return;
        content.setAttribute('data-service-ready', '');
        buildServiceFaq(content);
        buildServiceIndex(content);
        revealBelowFold(content);
      }
    );
  }

  /** Everything that must be (re)applied to a chunk of markup. */
  function initScope(root) {
    initServiceContent(root);
    initReveal(root);
    initCounters(root);
    initTilt(root);
    initMagnetic(root);
    initAccordion(root);
    initMenu(root);
    initHeaderState(root);
    initSpotlight(root);
    initParallax();
    bindSweep();
    // A section re-rendered by the editor is usually the one being looked at,
    // so reveal what is already on screen without waiting for the observer.
    window.requestAnimationFrame(sweepReveal);
  }

  /* ------------------------------------------------------------------
   * Technician's reticle
   *
   * Four corner brackets that trail the mouse and close around whatever
   * is interactive underneath — a focus frame, not a replacement pointer.
   * The native cursor stays visible on purpose: hiding it would strand
   * anyone whose JS fails, and it hurts people who track the arrow.
   *
   * Mouse only. There is no cursor to decorate on a touch screen.
   * ---------------------------------------------------------------- */
  function initCursor() {
    if (!finePointer || reduceMotion) return;
    if (document.querySelector('.reticle')) return;

    var TARGETS = 'a[href], button, summary, [data-tilt], .card--interactive, input, select, textarea';
    var IDLE = 30;

    var el = document.createElement('div');
    el.className = 'reticle';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<i></i><i></i><i></i><i></i>';
    document.body.appendChild(el);

    var targetX = 0, targetY = 0, x = 0, y = 0;
    var targetW = IDLE, targetH = IDLE, w = IDLE, h = IDLE;
    var running = false, seen = false;

    function frame() {
      // Position eases faster than size, so the frame appears to catch up
      // and then settle onto the element rather than snapping to it.
      x += (targetX - x) * 0.22;
      y += (targetY - y) * 0.22;
      w += (targetW - w) * 0.18;
      h += (targetH - h) * 0.18;

      el.style.transform = 'translate3d(' + (x - w / 2).toFixed(1) + 'px,' + (y - h / 2).toFixed(1) + 'px,0)';
      el.style.width = w.toFixed(1) + 'px';
      el.style.height = h.toFixed(1) + 'px';

      var settled =
        Math.abs(targetX - x) < 0.3 && Math.abs(targetY - y) < 0.3 &&
        Math.abs(targetW - w) < 0.3 && Math.abs(targetH - h) < 0.3;

      if (settled) { running = false; return; }
      window.requestAnimationFrame(frame);
    }

    function run() {
      if (running) return;
      running = true;
      window.requestAnimationFrame(frame);
    }

    document.addEventListener('mousemove', function (event) {
      targetX = event.clientX;
      targetY = event.clientY;

      if (!seen) {
        // Start where the mouse is, or the frame flies in from the corner.
        seen = true;
        x = targetX;
        y = targetY;
        el.classList.add('is-on');
      }

      var hit = event.target.closest ? event.target.closest(TARGETS) : null;
      if (hit) {
        var rect = hit.getBoundingClientRect();
        // Cap the frame so a full-width button does not swallow the screen.
        targetW = Math.min(rect.width + 14, window.innerWidth * 0.6);
        targetH = Math.min(rect.height + 14, window.innerHeight * 0.6);
        targetX = rect.left + rect.width / 2;
        targetY = rect.top + rect.height / 2;
        el.classList.add('is-locked');
      } else {
        targetW = IDLE;
        targetH = IDLE;
        el.classList.remove('is-locked');
      }
      run();
    }, { passive: true });

    document.addEventListener('mouseleave', function () {
      el.classList.remove('is-on');
    });
    document.addEventListener('mouseenter', function () {
      el.classList.add('is-on');
    });
  }

  function init() {
    initScope(document);
    initCursor();
    initBackToTop();
    initReadingProgress();
    initSectionDots();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* The theme editor re-renders a section after every settings change. */
  document.addEventListener('shopify:section:load', function (event) {
    initScope(event.target);
  });
})();
