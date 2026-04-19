/**
 * Market Magnate procedural avatar — shared by game.html + index.html hub.
 * Exposes window.MM_AVATAR.*
 */
(function (global) {
  'use strict';

  const MM_AVATAR_DEFAULT = {
    skinWarmth: 44,
    hairStyle: 2,
    hairHue: 32,
    hairSat: 48,
    hairLight: 34,
    hairLen: 42,
    hairBangs: 28,
    eyeHue: 208,
    eyeSize: 72,
    mouthStyle: 1,
    brow: 1,
    cheek: 42,
    shirtHue: 214,
    shirtSat: 44,
    shirtLight: 46,
    shirtStyle: 0,
    shirtPat: 0,
    pantsHue: 226,
    pantsSat: 34,
    pantsLight: 36,
    pantsStyle: 0,
    coatStyle: 0,
    coatHue: 220,
    coatSat: 28,
    coatLight: 38,
    shoeHue: 210,
    shoeStyle: 1,
    pose: 0,
    scalePct: 100
  };

  const HAIR_N = 18;
  const MM_HAIR_BACK_CLIP = [
    'ellipse(72% 58% at 50% 100%)',
    'polygon(4% 100%,96% 100%,90% 0,10% 0)',
    'ellipse(88% 62% at 50% 100%)',
    'polygon(0 100%,100% 100%,100% 8%,70% 0,30% 0,0 8%)',
    'ellipse(95% 72% at 50% 100%)',
    'polygon(8% 100%,92% 100%,84% 0,16% 0)',
    'ellipse(58% 88% at 50% 100%)',
    'polygon(12% 100%,88% 100%,100% 0,0 0)',
    'ellipse(78% 52% at 50% 100%)',
    'polygon(2% 100%,98% 100%,94% 12%,50% 0,6% 12%)',
    'ellipse(66% 70% at 50% 100%)',
    'polygon(0 100%,100% 100%,92% 0,8% 0)',
    'ellipse(102% 48% at 50% 100%)',
    'polygon(6% 100%,94% 100%,76% 0,24% 0)',
    'ellipse(70% 64% at 50% 100%)',
    'polygon(10% 100%,90% 100%,100% 18%,0 18%)',
    'ellipse(84% 56% at 50% 100%)',
    'polygon(14% 100%,86% 100%,50% 0,50% 0)'
  ];
  const MM_HAIR_FRONT_CLIP = [
    'ellipse(64% 50% at 50% 0%)',
    'polygon(0 0,100% 0,100% 78%,0 78%)',
    'ellipse(82% 54% at 50% 0%)',
    'polygon(4% 0,96% 0,100% 88%,0 88%)',
    'ellipse(90% 60% at 50% 0%)',
    'polygon(0 0,100% 0,92% 100%,8% 100%)',
    'ellipse(54% 68% at 50% 0%)',
    'polygon(10% 0,90% 0,100% 100%,0 100%)',
    'ellipse(76% 52% at 50% 0%)',
    'polygon(2% 0,98% 0,100% 70%,0 70%)',
    'ellipse(68% 58% at 50% 0%)',
    'polygon(6% 0,94% 0,88% 100%,12% 100%)',
    'ellipse(96% 46% at 50% 0%)',
    'polygon(8% 0,92% 0,100% 92%,0 92%)',
    'ellipse(72% 62% at 50% 0%)',
    'polygon(0 0,100% 0,96% 100%,4% 100%)',
    'ellipse(86% 56% at 50% 0%)',
    'polygon(12% 0,88% 0,50% 100%,50% 100%)'
  ];

  const HAIR_LABELS = [
    'Soft round', 'Straight bob', 'Long halo', 'Side part', 'High volume', 'Pixie crop',
    'Twin tails', 'Slick back', 'Wavy lob', 'Curtain bangs', 'Afro puff', 'Undercut',
    'Braided crown', 'Messy layers', 'Low bun', 'Shaggy fringe', 'Elegant sweep', 'Street fade'
  ];

  function clamp(n, a, b) {
    return Math.min(b, Math.max(a, n));
  }

  function mmHashStringToUint(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
  }

  function mmLerp(a, b, t) {
    return a + (b - a) * t;
  }

  function mmHsl(h, s, l, a) {
    const hh = ((Number(h) || 0) % 360 + 360) % 360;
    const ss = clamp(Number(s) || 0, 0, 100);
    const ll = clamp(Number(l) || 0, 0, 100);
    return a == null ? 'hsl(' + hh + ',' + ss + '%,' + ll + '%)' : 'hsla(' + hh + ',' + ss + '%,' + ll + '%,' + a + ')';
  }

  function mmSkinPairFromWarmth(w) {
    const t = clamp(Number(w) || 0, 0, 100) / 100;
    const h1 = mmLerp(30, 18, t), s1 = mmLerp(40, 28, t), l1 = mmLerp(44, 86, t);
    const h2 = mmLerp(24, 330, t), s2 = mmLerp(32, 22, t), l2 = mmLerp(30, 74, t);
    return { a: mmHsl(h1, s1, l1), b: mmHsl(h2, s2, l2) };
  }

  function normalizeAvatarDNA(d) {
    const o = Object.assign({}, MM_AVATAR_DEFAULT, d && typeof d === 'object' ? d : {});
    o.skinWarmth = clamp(Number(o.skinWarmth) || 0, 0, 100);
    o.hairStyle = clamp(Math.floor(Number(o.hairStyle) || 0), 0, HAIR_N - 1);
    ['hairHue', 'shirtHue', 'pantsHue', 'eyeHue', 'coatHue', 'shoeHue'].forEach(function (k) {
      o[k] = ((Math.floor(Number(o[k]) || 0) % 360) + 360) % 360;
    });
    [
      'hairSat', 'hairLight', 'hairLen', 'hairBangs', 'shirtSat', 'shirtLight', 'pantsSat', 'pantsLight',
      'coatSat', 'coatLight', 'cheek', 'eyeSize', 'scalePct'
    ].forEach(function (k) {
      o[k] = clamp(Number(o[k]) || 0, k === 'scalePct' ? 78 : 0, k === 'scalePct' ? 118 : 100);
    });
    o.brow = clamp(Math.floor(Number(o.brow) || 0), 0, 2);
    o.pose = clamp(Math.floor(Number(o.pose) || 0), 0, 2);
    o.mouthStyle = clamp(Math.floor(Number(o.mouthStyle) || 0), 0, 2);
    o.shirtStyle = clamp(Math.floor(Number(o.shirtStyle) || 0), 0, 4);
    o.shirtPat = clamp(Math.floor(Number(o.shirtPat) || 0), 0, 2);
    o.pantsStyle = clamp(Math.floor(Number(o.pantsStyle) || 0), 0, 2);
    o.coatStyle = clamp(Math.floor(Number(o.coatStyle) || 0), 0, 5);
    o.shoeStyle = clamp(Math.floor(Number(o.shoeStyle) || 0), 0, 3);
    return o;
  }

  function defaultAvatarDNA() {
    return normalizeAvatarDNA({});
  }

  function randomAvatarDNA() {
    const r = function () { return Math.random() * 100; };
    const ri = function (n) { return Math.floor(Math.random() * n); };
    return normalizeAvatarDNA({
      skinWarmth: ri(101), hairStyle: ri(HAIR_N), hairHue: ri(360), hairSat: 30 + r() * 0.5, hairLight: 20 + r() * 0.38,
      hairLen: ri(101), hairBangs: ri(101), eyeHue: ri(360), eyeSize: 58 + ri(43), mouthStyle: ri(3),
      shirtHue: ri(360), shirtSat: 28 + r() * 0.45, shirtLight: 34 + r() * 0.32, shirtStyle: ri(5), shirtPat: ri(3),
      pantsHue: ri(360), pantsSat: 25 + r() * 0.42, pantsLight: 26 + r() * 0.32, pantsStyle: ri(3),
      coatStyle: ri(6), coatHue: ri(360), coatSat: 20 + ri(50), coatLight: 28 + ri(40),
      shoeHue: ri(360), shoeStyle: ri(4), brow: ri(3), pose: ri(3), scalePct: 90 + ri(29), cheek: 18 + ri(62)
    });
  }

  function deterministicAvatarDNA(username) {
    let h = mmHashStringToUint(String(username || 'guest').toLowerCase());
    const next = function (m) {
      h = (Math.imul(h, 1664525) + 1013904223) >>> 0;
      return m <= 1 ? 0 : (h % m);
    };
    return normalizeAvatarDNA({
      skinWarmth: next(101), hairStyle: next(HAIR_N), hairHue: next(360), hairSat: 30 + next(51), hairLight: 20 + next(39),
      hairLen: next(101), hairBangs: next(101), eyeHue: next(360), eyeSize: 58 + next(43), mouthStyle: next(3),
      shirtHue: next(360), shirtSat: 28 + next(48), shirtLight: 34 + next(33), shirtStyle: next(5), shirtPat: next(3),
      pantsHue: next(360), pantsSat: 25 + next(43), pantsLight: 26 + next(33), pantsStyle: next(3),
      coatStyle: next(6), coatHue: next(360), coatSat: 20 + next(50), coatLight: 28 + next(40),
      shoeHue: next(360), shoeStyle: next(4), brow: next(3), pose: next(3), scalePct: 90 + next(29), cheek: 18 + next(62)
    });
  }

  function mmAvatarMarkup() {
    return (
      '<div class="mmAvRoot" data-pose="0">' +
      '<div class="mmAvHairBack"></div>' +
      '<div class="mmAvHead">' +
      '<div class="mmAvCheek mmL"></div><div class="mmAvCheek mmR"></div>' +
      '<div class="mmAvBrow mmL"></div><div class="mmAvBrow mmR"></div>' +
      '<div class="mmAvEyes"><span class="mmEye"></span><span class="mmEye"></span></div>' +
      '<div class="mmAvMouth" data-m="1"></div>' +
      '</div>' +
      '<div class="mmAvHairFront"></div>' +
      '<div class="mmAvNeck"><span id="mmSlotNecklace" class="mmAvNecklaceGlyph" title=""></span></div>' +
      '<div class="mmAvCoat"></div>' +
      '<div class="mmAvTorso" data-shirt="0">' +
      '<div class="mmAvArm mmL"><div class="mmAvUpper"></div><div class="mmAvFore"></div><div class="mmAvHand mmL"><span id="mmSlotRingL" class="mmRingGlyph" title=""></span></div></div>' +
      '<div class="mmAvArm mmR"><div class="mmAvUpper"></div><div class="mmAvFore"></div><div class="mmAvHand mmR">' +
      '<span id="mmSlotRingR" class="mmRingGlyph" title=""></span><span id="mmSlotWatch" class="mmAvWatchGlyph" title=""></span></div></div>' +
      '<div class="mmAvChestJewel" id="mmSlotChestJewel" title=""></div>' +
      '</div>' +
      '<div class="mmAvLegs"><div class="mmAvLeg"></div><div class="mmAvLeg"></div></div>' +
      '</div>'
    );
  }

  function classifyShopFlex(jewelPick, watchPick) {
    const icon = jewelPick && jewelPick.icon ? String(jewelPick.icon).trim() : '';
    const name = (jewelPick && jewelPick.name) ? String(jewelPick.name).toLowerCase() : '';
    const watchIcon = watchPick && watchPick.icon ? String(watchPick.icon).trim() : '';
    const watchTitle = (watchPick && watchPick.name) ? String(watchPick.name) : '';
    const jewelTitle = (jewelPick && jewelPick.name) ? String(jewelPick.name) : '';

    const neckWords = /necklace|chain|choker|strand|locket|pendant|beads|pearls|collar|torque|rivière|riviere|lariat/;
    const ringWords = /\bring\b|bands?\b|signet|wedding|eternity|solitaire|carat/;
    const neckEmoji = { '📿': 1, '🔗': 1 };
    const ringEmoji = { '💍': 1, '💠': 1 };

    let neck = '';
    let ringL = '';
    let ringR = '';
    let chest = '';

    if (icon) {
      if (neckEmoji[icon] || neckWords.test(name)) {
        neck = icon;
      } else if (ringEmoji[icon] || ringWords.test(name)) {
        ringR = icon;
      } else {
        chest = icon;
      }
    }

    return {
      necklace: neck,
      necklaceTitle: neck ? jewelTitle : '',
      ringL: ringL,
      ringR: ringR,
      ringLTitle: ringL ? jewelTitle : '',
      ringRTitle: ringR ? jewelTitle : '',
      chestJewel: chest,
      chestJewelTitle: chest ? jewelTitle : '',
      watch: watchIcon,
      watchTitle: watchTitle
    };
  }

  function applyAvatarDNAToHost(host, dna, flex) {
    if (!host) return;
    const d = normalizeAvatarDNA(dna);
    const skin = mmSkinPairFromWarmth(d.skinWarmth);
    const hair = mmHsl(d.hairHue, d.hairSat, d.hairLight);
    const hairDark = mmHsl(d.hairHue, Math.min(90, d.hairSat + 12), Math.max(8, d.hairLight - 14));
    const shirt = mmHsl(d.shirtHue, d.shirtSat, d.shirtLight);
    const shirtDeep = mmHsl(d.shirtHue, Math.min(92, d.shirtSat + 8), Math.max(12, d.shirtLight - 18));
    const pants = mmHsl(d.pantsHue, d.pantsSat, d.pantsLight);
    const pantsDeep = mmHsl(d.pantsHue, Math.min(90, d.pantsSat + 6), Math.max(10, d.pantsLight - 16));
    const coat = mmHsl(d.coatHue, d.coatSat, d.coatLight);
    const coatDeep = mmHsl(d.coatHue, Math.min(90, d.coatSat + 10), Math.max(14, d.coatLight - 20));
    const shoe = mmHsl(d.shoeHue, 38, 36);
    const shoeDeep = mmHsl(d.shoeHue, 42, 22);
    const eye = mmHsl(d.eyeHue, 72, 28);
    const eyeHi = mmHsl(d.eyeHue, 40, 92);
    const lip = mmHsl(mmLerp(d.skinWarmth, 350, 0.35), 55, 58);
    const st = d.hairStyle % HAIR_N;
    const coatOp = d.coatStyle <= 0 ? 0 : 0.22 + d.coatStyle * 0.12;

    host.innerHTML = mmAvatarMarkup();
    const root = host.querySelector('.mmAvRoot');
    if (root) {
      root.setAttribute('data-pose', String(d.pose));
      root.style.setProperty('--mm-scale', String((Number(d.scalePct) || 100) / 100));
      root.style.setProperty('--mm-skin-a', skin.a);
      root.style.setProperty('--mm-skin-b', skin.b);
      root.style.setProperty('--mm-hair', hair);
      root.style.setProperty('--mm-hair-dark', hairDark);
      root.style.setProperty('--mm-shirt', shirt);
      root.style.setProperty('--mm-shirt-deep', shirtDeep);
      root.style.setProperty('--mm-pants', pants);
      root.style.setProperty('--mm-pants-deep', pantsDeep);
      root.style.setProperty('--mm-coat', coat);
      root.style.setProperty('--mm-coat-deep', coatDeep);
      root.style.setProperty('--mm-coat-op', String(coatOp));
      root.style.setProperty('--mm-shoe', shoe);
      root.style.setProperty('--mm-shoe-deep', shoeDeep);
      root.style.setProperty('--mm-shoe-op', d.shoeStyle <= 0 ? '0' : '1');
      root.style.setProperty('--mm-eye', eye);
      root.style.setProperty('--mm-eye-hi', eyeHi);
      root.style.setProperty('--mm-lip', lip);
      root.style.setProperty('--mm-brow-op', String(0.5 + d.brow * 0.2));
      root.style.setProperty('--mm-cheek', String((Number(d.cheek) || 0) / 100));
      root.style.setProperty('--mm-hair-len', String((Number(d.hairLen) || 0) / 100));
      root.style.setProperty('--mm-bangs', String((Number(d.hairBangs) || 0) / 50));
      root.style.setProperty('--mm-eye-size', String((Number(d.eyeSize) || 72) / 100 - 0.5));
      root.style.setProperty('--mm-stripe', d.shirtPat <= 0 ? '0' : String(0.15 + d.shirtPat * 0.12));

      const mouth = host.querySelector('.mmAvMouth');
      if (mouth) mouth.setAttribute('data-m', String(d.mouthStyle));

      const torso = host.querySelector('.mmAvTorso');
      if (torso) torso.setAttribute('data-shirt', String(d.shirtStyle));

      const legs = host.querySelectorAll('.mmAvLeg');
      legs.forEach(function (leg) {
        leg.style.transform = d.pantsStyle === 1 ? 'scaleX(0.92)' : d.pantsStyle === 2 ? 'scaleX(1.08)' : '';
      });

      const hb = host.querySelector('.mmAvHairBack');
      const hf = host.querySelector('.mmAvHairFront');
      if (hb) hb.style.clipPath = MM_HAIR_BACK_CLIP[st];
      if (hf) hf.style.clipPath = MM_HAIR_FRONT_CLIP[st];
    }

    const f = flex || {};
    function setGlyph(sel, emoji, title) {
      const el = host.querySelector(sel);
      if (!el) return;
      const ch = emoji && String(emoji).trim() ? String(emoji).trim() : '';
      el.textContent = ch;
      el.style.display = ch ? 'block' : 'none';
      el.title = title || '';
    }
    setGlyph('#mmSlotNecklace', f.necklace, f.necklaceTitle);
    setGlyph('#mmSlotChestJewel', f.chestJewel, f.chestJewelTitle);
    setGlyph('#mmSlotRingL', f.ringL, f.ringLTitle);
    setGlyph('#mmSlotRingR', f.ringR, f.ringRTitle);
    const wEl = host.querySelector('#mmSlotWatch');
    if (wEl) {
      const w = f.watch && String(f.watch).trim() ? String(f.watch).trim() : '';
      wEl.textContent = w;
      wEl.style.display = w ? 'block' : 'none';
      wEl.title = f.watchTitle || '';
    }
  }

  function rowRange(label, key, min, max) {
    return (
      '<div class="mmAvRow"><label>' + label + '</label>' +
      '<input type="range" data-dna="' + key + '" min="' + min + '" max="' + max + '" step="1" /></div>'
    );
  }

  function rowSelect(label, key, options) {
    const opts = options.map(function (o) {
      return '<option value="' + o.v + '">' + o.t + '</option>';
    }).join('');
    return '<div class="mmAvRow"><label>' + label + '</label><select data-dna="' + key + '">' + opts + '</select></div>';
  }

  function buildStudioAccordionHTML() {
    const hairOpts = HAIR_LABELS.map(function (t, i) { return { v: String(i), t: t }; });
    return (
      '<div class="mmAvStudio">' +
      '<details open><summary>Face & skin</summary><div class="mmAvGrid">' +
      rowRange('Skin warmth', 'skinWarmth', 0, 100) +
      rowRange('Blush', 'cheek', 0, 100) +
      rowRange('Iris hue', 'eyeHue', 0, 359) +
      rowRange('Eye size', 'eyeSize', 55, 100) +
      rowSelect('Brows', 'brow', [{ v: '0', t: 'Soft' }, { v: '1', t: 'Medium' }, { v: '2', t: 'Bold' }]) +
      rowSelect('Mouth', 'mouthStyle', [{ v: '0', t: 'Soft smile' }, { v: '1', t: 'Grin' }, { v: '2', t: 'Smirk' }]) +
      '</div></details>' +
      '<details><summary>Hair</summary><div class="mmAvGrid">' +
      rowSelect('Hairstyle', 'hairStyle', hairOpts) +
      rowRange('Hair hue', 'hairHue', 0, 359) +
      rowRange('Hair saturation', 'hairSat', 0, 100) +
      rowRange('Hair brightness', 'hairLight', 0, 100) +
      rowRange('Length / volume', 'hairLen', 0, 100) +
      rowRange('Bangs height', 'hairBangs', 0, 100) +
      '</div></details>' +
      '<details><summary>Outfit</summary><div class="mmAvGrid">' +
      rowSelect('Top cut', 'shirtStyle', [
        { v: '0', t: 'Crew tee' }, { v: '1', t: 'Rounded sweater' }, { v: '2', t: 'Striped tee' },
        { v: '3', t: 'Tank top' }, { v: '4', t: 'Deep V shirt' }
      ]) +
      rowSelect('Fabric pattern', 'shirtPat', [{ v: '0', t: 'Solid' }, { v: '1', t: 'Light pinstripe' }, { v: '2', t: 'Bold stripe' }]) +
      rowRange('Top hue', 'shirtHue', 0, 359) +
      rowRange('Top saturation', 'shirtSat', 0, 100) +
      rowRange('Top brightness', 'shirtLight', 0, 100) +
      rowSelect('Pants fit', 'pantsStyle', [{ v: '0', t: 'Straight' }, { v: '1', t: 'Slim' }, { v: '2', t: 'Wide' }]) +
      rowRange('Bottom hue', 'pantsHue', 0, 359) +
      rowRange('Bottom saturation', 'pantsSat', 0, 100) +
      rowRange('Bottom brightness', 'pantsLight', 0, 100) +
      rowSelect('Outer layer', 'coatStyle', [
        { v: '0', t: 'None' }, { v: '1', t: 'Light cardigan' }, { v: '2', t: 'Blazer' }, { v: '3', t: 'Parka' },
        { v: '4', t: 'Bomber' }, { v: '5', t: 'Trench' }
      ]) +
      rowRange('Layer hue', 'coatHue', 0, 359) +
      rowRange('Layer saturation', 'coatSat', 0, 100) +
      rowRange('Layer brightness', 'coatLight', 0, 100) +
      rowSelect('Shoes', 'shoeStyle', [{ v: '0', t: 'Bare / minimal' }, { v: '1', t: 'Sneakers' }, { v: '2', t: 'Loafers' }, { v: '3', t: 'Boots' }]) +
      rowRange('Shoe hue', 'shoeHue', 0, 359) +
      '</div></details>' +
      '<details><summary>Stance</summary><div class="mmAvGrid">' +
      rowSelect('Pose', 'pose', [{ v: '0', t: 'Neutral' }, { v: '1', t: 'Open' }, { v: '2', t: 'Confident' }]) +
      rowRange('Body scale', 'scalePct', 78, 118) +
      '</div></details>' +
      '<div class="mmAvActions">' +
      '<button type="button" class="mmAvBtn" data-mm-av="random">Randomize</button>' +
      '<button type="button" class="mmAvBtn" data-mm-av="reset">Defaults</button>' +
      '</div></div>'
    );
  }

  function readControlsFromContainer(container, base) {
    const d = Object.assign({}, base || MM_AVATAR_DEFAULT);
    container.querySelectorAll('[data-dna]').forEach(function (el) {
      const k = el.getAttribute('data-dna');
      if (!k) return;
      const n = Number(el.value);
      if (el.tagName === 'SELECT') d[k] = Math.floor(n);
      else d[k] = n;
    });
    return normalizeAvatarDNA(d);
  }

  function writeControlsFromDNA(container, dna) {
    const d = normalizeAvatarDNA(dna);
    container.querySelectorAll('[data-dna]').forEach(function (el) {
      const k = el.getAttribute('data-dna');
      if (!k || !(k in d)) return;
      el.value = String(d[k]);
    });
  }

  function mountStudio(container, previewHost, options) {
    if (!container) return function () {};
    const get = options.get || function () { return {}; };
    const set = options.set || function () {};
    const save = options.save || function () {};
    const flex = options.flex || function () { return {}; };

    let built = false;
    let saveT = null;

    function paint() {
      const d = normalizeAvatarDNA(get());
      if (previewHost && typeof previewHost === 'string') {
        const h = document.querySelector(previewHost);
        if (h) applyAvatarDNAToHost(h, d, flex());
      } else if (previewHost) {
        applyAvatarDNAToHost(previewHost, d, flex());
      }
    }

    function syncFromUi() {
      const next = readControlsFromContainer(container, get());
      set(next);
      paint();
      clearTimeout(saveT);
      saveT = setTimeout(function () { try { save(); } catch (e) {} }, 280);
    }

    function initialSync() {
      writeControlsFromDNA(container, get());
      paint();
      built = true;
    }

    function onStudioClick(e) {
      const b = e.target.closest('[data-mm-av]');
      if (!b) return;
      e.preventDefault();
      if (b.getAttribute('data-mm-av') === 'random') set(randomAvatarDNA());
      else set(defaultAvatarDNA());
      writeControlsFromDNA(container, get());
      paint();
      try { save(); } catch (err) {}
    }

    function refresh() {
      if (!built) initialSync();
      else {
        writeControlsFromDNA(container, get());
        paint();
      }
    }

    if (container.dataset.mmAvMounted === '1') {
      return refresh;
    }
    container.innerHTML = buildStudioAccordionHTML();
    container.dataset.mmAvMounted = '1';
    container.addEventListener('input', syncFromUi);
    container.addEventListener('change', syncFromUi);
    container.addEventListener('click', onStudioClick);
    initialSync();

    return refresh;
  }

  global.MM_AVATAR = {
    MM_AVATAR_DEFAULT: MM_AVATAR_DEFAULT,
    HAIR_LABELS: HAIR_LABELS,
    normalizeAvatarDNA: normalizeAvatarDNA,
    defaultAvatarDNA: defaultAvatarDNA,
    randomAvatarDNA: randomAvatarDNA,
    deterministicAvatarDNA: deterministicAvatarDNA,
    applyAvatarDNAToHost: applyAvatarDNAToHost,
    classifyShopFlex: classifyShopFlex,
    buildStudioAccordionHTML: buildStudioAccordionHTML,
    mountStudio: mountStudio,
    readControlsFromContainer: readControlsFromContainer,
    writeControlsFromDNA: writeControlsFromDNA
  };

  global.normalizeAvatarDNA = normalizeAvatarDNA;
  global.MM_applyAvatarDNA = applyAvatarDNAToHost;
  global.deterministicAvatarDNA = deterministicAvatarDNA;
  global.randomAvatarDNA = randomAvatarDNA;
  global.defaultAvatarDNA = defaultAvatarDNA;
})(typeof window !== 'undefined' ? window : this);
