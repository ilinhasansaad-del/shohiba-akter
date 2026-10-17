(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const intro = document.querySelector('.intro-stage');
  const introText = intro && intro.querySelector('.typing-visual');
  const name = document.querySelector('.name-visual');
  const skipButton = document.querySelector('.skip-intro');
  const cursor = document.querySelector('.custom-cursor');
  const cursorDot = document.querySelector('.custom-cursor-dot');
  const fullIntro = 'Learn English interactively.';
  const fullName = 'Shohiba Akter';
  let skipIntro = false;
  let introSeen = false;
  try {
    introSeen = sessionStorage.getItem('shohiba-intro-seen') === 'yes';
  } catch {
    introSeen = false;
  }
  const playsIntro = Boolean(intro && introText && name && !reduceMotion && !introSeen);

  function typeText(element, text, delay, speed) {
    return new Promise((resolve) => {
      if (skipIntro) {
        element.textContent = text;
        resolve();
        return;
      }
      let i = 0;
      element.textContent = '';
      const tick = () => {
        if (skipIntro) {
          element.textContent = text;
          resolve();
          return;
        }
        element.textContent = text.slice(0, i);
        i += 1;
        if (i <= text.length) window.setTimeout(tick, speed);
        else resolve();
      };
      window.setTimeout(tick, delay);
    });
  }

  const sections = [...document.querySelectorAll('.section-anchor')];
  const dock = document.querySelector('.floating-dock');
  const links = [...document.querySelectorAll('.floating-dock a[data-dock]')];
  const dockIndicator = document.querySelector('.dock-active-indicator');
  const menu = document.querySelector('.menu-overlay');
  const menuPanel = menu && menu.querySelector('.menu-panel');
  const menuTrigger = document.querySelector('.dock-menu');
  const menuCloseControls = menu ? [...menu.querySelectorAll('[data-menu-close]')] : [];
  const menuLinks = menu ? [...menu.querySelectorAll('.menu-links a')] : [];
  const progress = document.querySelector('.scroll-progress');
  const progressBar = progress && progress.querySelector('span');
  const navigationGroup = {
    journey: 'teaching', teaching: 'teaching', method: 'teaching', qualifications: 'teaching',
    subjects: 'teaching', classes: 'teaching', impact: 'teaching', faq: 'teaching', quote: 'teaching'
  };
  const updateIndicator = () => {
    const activeLink = links.find((link) => link.getAttribute('aria-current') === 'location');
    if (!dock || !dockIndicator || !activeLink) return;
    const dockBounds = dock.getBoundingClientRect();
    const linkBounds = activeLink.getBoundingClientRect();
    dock.style.setProperty('--dock-indicator-x', `${linkBounds.left - dockBounds.left}px`);
    dockIndicator.style.width = `${linkBounds.width}px`;
    dock.classList.add('has-active');
  };
  const setActive = (id) => {
    const destination = navigationGroup[id] || id;
    links.forEach((link) => {
      if (link.dataset.dock === destination) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    menuLinks.forEach((link) => {
      if (link.hash === `#${id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    updateIndicator();
  };

  const revealSection = (section) => {
    if (!section) return;
    section.querySelectorAll('[data-reveal]').forEach((target) => target.setAttribute('data-reveal', 'visible'));
  };

  let stateFrame = 0;
  const updateScrollState = () => {
    stateFrame = 0;
    const scrollable = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const fraction = scrollable ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
    if (progressBar) progressBar.style.setProperty('--scroll-progress', String(fraction));
    if (progress) progress.setAttribute('aria-valuenow', String(Math.round(fraction * 100)));

    const readingLine = window.innerHeight * .42;
    let current = sections[0];
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= readingLine) current = section;
      else break;
    }
    if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) current = sections.at(-1) || current;
    if (current) setActive(current.id);
  };
  const scheduleScrollState = () => {
    if (!stateFrame) stateFrame = window.requestAnimationFrame(updateScrollState);
  };
  window.addEventListener('scroll', scheduleScrollState, { passive: true });
  window.addEventListener('resize', scheduleScrollState, { passive: true });
  if ('ResizeObserver' in window && dock) {
    const dockResizeObserver = new ResizeObserver(updateIndicator);
    dockResizeObserver.observe(dock);
    links.forEach((link) => dockResizeObserver.observe(link));
  }
  if (document.fonts?.ready) document.fonts.ready.then(updateIndicator);
  updateScrollState();

  if (menu && menuPanel && menuTrigger) {
    let closeTimer = 0;
    let previousOverflow = '';
    let bodyLockActive = false;
    let restoreFocusOnClose = true;

    const openMenu = () => {
      window.clearTimeout(closeTimer);
      if (!bodyLockActive) previousOverflow = document.body.style.overflow;
      bodyLockActive = true;
      document.body.style.overflow = 'hidden';
      menu.hidden = false;
      menu.inert = false;
      menu.setAttribute('aria-hidden', 'false');
      menuTrigger.setAttribute('aria-expanded', 'true');
      updateScrollState();
      window.requestAnimationFrame(() => menu.classList.add('is-open'));
      const firstLink = menuLinks[0] || menu.querySelector('.menu-close');
      window.setTimeout(() => firstLink?.focus(), reduceMotion ? 0 : 60);
    };

    const closeMenu = (restoreFocus = true) => {
      if (menu.hidden) return;
      window.clearTimeout(closeTimer);
      restoreFocusOnClose = restoreFocus;
      menu.classList.remove('is-open');
      menu.inert = true;
      menu.setAttribute('aria-hidden', 'true');
      menuTrigger.setAttribute('aria-expanded', 'false');
      closeTimer = window.setTimeout(() => {
        menu.hidden = true;
        menu.inert = false;
        document.body.style.overflow = previousOverflow;
        bodyLockActive = false;
        if (restoreFocusOnClose) menuTrigger.focus();
      }, reduceMotion ? 0 : 300);
    };

    menuTrigger.addEventListener('click', openMenu);
    menuCloseControls.forEach((control) => control.addEventListener('click', (event) => {
      if (event.target === control || control.classList.contains('menu-close')) closeMenu(true);
    }));
    menuLinks.forEach((link) => link.addEventListener('click', () => {
      const target = document.getElementById(link.hash.slice(1));
      if (target) {
        setActive(target.id);
        revealSection(target);
        closeMenu(false);
        window.setTimeout(() => {
          target.setAttribute('tabindex', '-1');
          target.focus({ preventScroll: true });
        }, reduceMotion ? 0 : 320);
      }
    }));
    menu.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu(true);
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = [...menu.querySelectorAll('a[href], button:not([disabled])')].filter((element) => element.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  const revealTargets = [...document.querySelectorAll('[data-reveal]')];
  const heroTargets = [...document.querySelectorAll('.hero [data-reveal]')];
  const heroHeading = document.querySelector('#hero-title');
  const heroPortrait = document.querySelector('.hero-portrait');
  const delayedHeroTargets = playsIntro ? new Set(heroTargets) : new Set();
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealTargets.forEach((target) => target.setAttribute('data-reveal', 'visible'));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.setAttribute('data-reveal', 'visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealTargets.forEach((target) => {
      target.setAttribute('data-reveal', 'pending');
      if (!delayedHeroTargets.has(target)) revealObserver.observe(target);
    });
  }

  links.forEach((link) => {
    link.addEventListener('click', () => {
      const target = document.getElementById(link.hash.slice(1));
      if (target) {
        setActive(target.id);
        revealSection(target);
      }
    });
  });

  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  if (cursor && cursorDot && finePointer.matches) {
    document.documentElement.classList.add('has-custom-cursor');
    let pointerX = -100;
    let pointerY = -100;
    let cursorX = pointerX;
    let cursorY = pointerY;
    let frame = 0;
    let cursorInitialized = false;

    const moveCursor = () => {
      const easing = reduceMotion ? 1 : 0.42;
      cursorX += (pointerX - cursorX) * easing;
      cursorY += (pointerY - cursorY) * easing;
      cursor.style.setProperty('--follower-x', `${cursorX}px`);
      cursor.style.setProperty('--follower-y', `${cursorY}px`);
      if (Math.abs(pointerX - cursorX) > 0.35 || Math.abs(pointerY - cursorY) > 0.35) {
        frame = window.requestAnimationFrame(moveCursor);
      } else {
        cursorX = pointerX;
        cursorY = pointerY;
        cursor.style.setProperty('--follower-x', `${cursorX}px`);
        cursor.style.setProperty('--follower-y', `${cursorY}px`);
        frame = 0;
      }
    };

    document.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'touch') return;
      pointerX = event.clientX;
      pointerY = event.clientY;
      cursorDot.style.setProperty('--pointer-x', `${pointerX}px`);
      cursorDot.style.setProperty('--pointer-y', `${pointerY}px`);
      if (!cursorInitialized) {
        cursorX = pointerX;
        cursorY = pointerY;
        cursor.style.setProperty('--follower-x', `${cursorX}px`);
        cursor.style.setProperty('--follower-y', `${cursorY}px`);
        cursorInitialized = true;
      } else if (!frame) {
        frame = window.requestAnimationFrame(moveCursor);
      }

      const quietArea = event.target.closest('.hero-portrait, [data-cursor="quiet"]');
      document.documentElement.classList.toggle('is-cursor-quiet', Boolean(quietArea));
      cursor.classList.toggle('is-visible', !quietArea);
      cursorDot.classList.toggle('is-visible', !quietArea);
      const interactive = quietArea ? null : event.target.closest('a, button, summary');
      cursor.classList.toggle('is-interactive', Boolean(interactive));
      const label = cursor.querySelector('.custom-cursor-label');
      const labelText = !interactive ? ''
        : interactive.classList.contains('hero-link') ? 'EXPLORE'
          : interactive.classList.contains('contact-option') ? 'CONTACT'
            : interactive.href?.startsWith('tel:') ? 'CALL'
              : interactive.href?.startsWith('mailto:') ? 'EMAIL'
                : interactive.classList.contains('button') ? 'CLASSES' : '';
      cursor.classList.toggle('is-labeled', Boolean(labelText));
      if (label) label.textContent = labelText;
    });

    document.addEventListener('pointerdown', () => cursor.classList.add('is-pressed'));
    document.addEventListener('pointerup', () => cursor.classList.remove('is-pressed'));
    const hideCursor = () => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      cursorInitialized = false;
      document.documentElement.classList.remove('is-cursor-quiet');
      cursor.classList.remove('is-visible', 'is-interactive', 'is-labeled', 'is-pressed');
      cursorDot.classList.remove('is-visible');
    };
    document.addEventListener('pointerleave', hideCursor);
    window.addEventListener('blur', hideCursor);
  }

  const portraitImage = heroPortrait && heroPortrait.querySelector('img');
  if (portraitImage && !reduceMotion) {
    let scrollFrame = 0;
    const updatePortraitShift = () => {
      scrollFrame = 0;
      const bounds = heroPortrait.getBoundingClientRect();
      const range = (window.innerHeight + bounds.height) / 2;
      const distance = window.innerHeight / 2 - (bounds.top + bounds.height / 2);
      const progress = Math.max(-1, Math.min(1, distance / range));
      portraitImage.style.setProperty('--portrait-scroll-y', `${progress * 10}px`);
    };
    const schedulePortraitShift = () => {
      if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updatePortraitShift);
    };
    window.addEventListener('scroll', schedulePortraitShift, { passive: true });
    window.addEventListener('resize', schedulePortraitShift);
    updatePortraitShift();
  }

  if (intro && introText && name) {
    if (reduceMotion || introSeen) {
      introText.textContent = fullIntro;
      name.textContent = fullName;
      intro.hidden = true;
    } else {
      document.documentElement.classList.add('intro-pending');
      intro.hidden = false;
      name.textContent = '';
      intro.classList.add('intro-playing');
      if (skipButton) skipButton.hidden = false;

      const rememberIntro = () => {
        try { sessionStorage.setItem('shohiba-intro-seen', 'yes'); } catch {}
      };
      const revealHeroImmediately = () => {
        heroTargets.forEach((target) => target.setAttribute('data-reveal', 'visible'));
      };

      if (skipButton) {
        skipButton.addEventListener('click', () => {
          skipIntro = true;
          introText.textContent = fullIntro;
          name.textContent = fullName;
          intro.classList.remove('intro-playing');
          intro.hidden = true;
          skipButton.hidden = true;
          document.documentElement.classList.remove('intro-pending');
          revealHeroImmediately();
          rememberIntro();
        });
      }

      typeText(introText, fullIntro, 150, 42).then(() => {
        if (skipIntro) return;
        intro.classList.remove('intro-playing');
        intro.classList.add('is-leaving');
        return new Promise((resolve) => window.setTimeout(() => {
          intro.hidden = true;
          intro.classList.remove('is-leaving');
          document.documentElement.classList.remove('intro-pending');
          resolve();
        }, 450));
      }).then(() => {
        if (skipIntro) return;
        if (heroPortrait) heroPortrait.setAttribute('data-reveal', 'visible');
        return new Promise((resolve) => window.setTimeout(resolve, 220));
      }).then(() => {
        if (skipIntro) return;
        if (heroHeading) heroHeading.setAttribute('data-reveal', 'visible');
        return typeText(name, fullName, 100, 65);
      }).then(() => {
        if (skipIntro) return;
        heroTargets
          .filter((target) => target !== heroPortrait && target !== heroHeading)
          .forEach((target, index) => window.setTimeout(() => target.setAttribute('data-reveal', 'visible'), index * 70));
        rememberIntro();
        if (skipButton) skipButton.hidden = true;
      });
    }
  }

  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
