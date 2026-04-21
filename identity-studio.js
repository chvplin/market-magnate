/**
 * Empire identity studio — ownership-driven wardrobe UI (game.html).
 * Depends: MM_AVATAR, game, mmIdentityThumbForItem, mmNormalizeAvatarLoadout (on window from game).
 */
(function (global) {
  'use strict';

  const TABS = [
    { id: 'appearance', label: 'Look' },
    { id: 'outfits', label: 'Wardrobe' },
    { id: 'accessories', label: 'Flex' },
    { id: 'backgrounds', label: 'Residence' },
    { id: 'fleet', label: 'Fleet' }
  ];

  let currentTab = 'appearance';

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function gameSafe() {
    return global.game || null;
  }

  function ownedList() {
    const g = gameSafe();
    return g && Array.isArray(g.shoppingOwned) ? g.shoppingOwned : [];
  }

  function getItem(id) {
    if (typeof global.getItemById === 'function') return global.getItemById(id);
    return null;
  }

  function normLoadout(lo, owned) {
    if (typeof global.mmNormalizeAvatarLoadout === 'function') {
      return global.mmNormalizeAvatarLoadout(lo, owned);
    }
    return Object.assign({}, lo || {});
  }

  function setTab(tab) {
    currentTab = tab;
  }

  function paintMiniPreview() {
    const host = document.getElementById('identityStudioPreviewHost');
    if (!host || !global.MM_AVATAR) return;
    const g = gameSafe();
    if (!g) return;
    const owned = ownedList();
    const lo = normLoadout(g.avatarLoadout, owned);
    g.avatarLoadout = lo;
    const d =
      typeof global.mmMergeLoadoutIntoDNA === 'function'
        ? global.mmMergeLoadoutIntoDNA(g.avatarDNA, lo)
        : global.MM_AVATAR.normalizeAvatarDNA(g.avatarDNA || {});
    const flex =
      typeof global.mmFlexFromLoadout === 'function'
        ? global.mmFlexFromLoadout()
        : global.MM_AVATAR.classifyShopFlex(null, null);
    global.MM_AVATAR.applyAvatarDNAToHost(host, d, flex);
  }

  function rarityFor(item) {
    if (global.mmIdentityRarityLabel) return global.mmIdentityRarityLabel(item.cost);
    return '';
  }

  function thumbFor(item) {
    if (global.mmIdentityThumbForItem) return global.mmIdentityThumbForItem(item) || '';
    return '';
  }

  function isEquipped(slot, id) {
    const g = gameSafe();
    if (!g || !g.avatarLoadout) return false;
    return String(g.avatarLoadout[slot] || '') === String(id);
  }

  function equip(slot, id) {
    const g = gameSafe();
    if (!g) return;
    const owned = ownedList();
    const lo = normLoadout(g.avatarLoadout || {}, owned);
    const sid = id ? String(id) : '';
    if (!sid) {
      lo[slot] = null;
    } else {
      if (!owned.includes(sid)) return;
      lo[slot] = sid;
    }
    g.avatarLoadout = normLoadout(lo, owned);
    paintMiniPreview();
    if (typeof global.mmPaintEmpireAvatarFigure === 'function') global.mmPaintEmpireAvatarFigure();
    if (typeof global.mmSaveGameSilent === 'function') global.mmSaveGameSilent();
  }

  function renderGrid(container) {
    const grid = container.querySelector('#identityStudioGrid');
    if (!grid) return;
    const g = gameSafe();
    const owned = ownedList();
    const lo = g ? normLoadout(g.avatarLoadout, owned) : {};
    let html = '';

    function esc(s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/"/g, '&quot;');
    }
    function card(slot, item, extraCls) {
      const eq = isEquipped(slot, item.id);
      const th = thumbFor(item);
      const r = rarityFor(item);
      return (
        '<button type="button" class="mmIdCard' +
        (eq ? ' mmIdCard--on' : '') +
        (extraCls || '') +
        '" data-slot="' +
        esc(slot) +
        '" data-id="' +
        esc(String(item.id)) +
        '">' +
        '<div class="mmIdCardImg"><img loading="lazy" decoding="async" alt="" src="' +
        esc(th) +
        '"/></div>' +
        '<div class="mmIdCardMeta"><b>' +
        esc(item.name) +
        '</b><span>' +
        esc(r) +
        '</span></div>' +
        '</button>'
      );
    }

    if (currentTab === 'appearance') {
      const poses = [
        { v: 0, t: 'Idle' },
        { v: 1, t: 'Open' },
        { v: 2, t: 'Confident' }
      ];
      html += '<div class="mmIdSection"><div class="mmIdSectionTitle">Pose</div><div class="mmIdChips">';
      const dpose = lo.pose != null ? Number(lo.pose) : g && g.avatarDNA ? Number(g.avatarDNA.pose) || 0 : 0;
      poses.forEach(function (p) {
        const on = dpose === p.v;
        html +=
          '<button type="button" class="mmIdChip' +
          (on ? ' mmIdChip--on' : '') +
          '" data-appearance="pose" data-v="' +
          p.v +
          '">' +
          p.t +
          '</button>';
      });
      html += '</div></div>';

      html += '<div class="mmIdSection"><div class="mmIdSectionTitle">Silhouette</div><div class="mmIdChips">';
      ['m', 'f', 'n'].forEach(function (b, i) {
        const lab = ['Tailored', 'Sleek', 'Bold'][i];
        const on = String(lo.appearanceBase || 'm') === b;
        html +=
          '<button type="button" class="mmIdChip' +
          (on ? ' mmIdChip--on' : '') +
          '" data-appearance="base" data-v="' +
          b +
          '">' +
          lab +
          '</button>';
      });
      html += '</div></div>';

      html += '<div class="mmIdSection"><div class="mmIdSectionTitle">Hair silhouette</div><div class="mmIdChips">';
      for (let h = 0; h < 6; h++) {
        const on = lo.appearanceHair != null && Number(lo.appearanceHair) === h;
        html +=
          '<button type="button" class="mmIdChip' +
          (on ? ' mmIdChip--on' : '') +
          '" data-appearance="hair" data-v="' +
          h +
          '">Preset ' +
          (h + 1) +
          '</button>';
      }
      html += '</div></div>';

      html += '<div class="mmIdSection"><div class="mmIdSectionTitle">Palette</div><div class="mmIdSwatches">';
      const pals = (global.MM_APPEARANCE_PALETTE_SWATCHES && global.MM_APPEARANCE_PALETTE_SWATCHES.slice(0, 6)) || [
        '#94a3b8',
        '#c084fc',
        '#38bdf8',
        '#fbbf24',
        '#fb7185',
        '#34d399'
      ];
      pals.forEach(function (hex, i) {
        const on = Number(lo.appearancePalette || 0) === i;
        html +=
          '<button type="button" class="mmIdSwatch' +
          (on ? ' mmIdSwatch--on' : '') +
          '" data-appearance="palette" data-v="' +
          i +
          '" style="--sw:' +
          hex +
          '"></button>';
      });
      html += '</div></div>';

      html +=
        '<p class="mmIdHint">Looks are built from limited, polished presets. Wardrobe items you own refine tailoring and metals.</p>';
    } else if (currentTab === 'outfits') {
      const rows = owned
        .map(getItem)
        .filter(function (it) {
          return it && it.kind === 'shopping' && (it.category === 'luxury' || it.category === 'social');
        })
        .sort(function (a, b) {
          return b.cost - a.cost;
        });
      if (!rows.length) {
        html = '<div class="mmIdEmpty">No lifestyle wardrobe pieces yet. Own items in Shopping → Luxury or Social.</div>';
      } else {
        html += '<div class="mmIdSectionTitle">Equip a look you own</div><div class="mmIdCardGrid">';
        rows.forEach(function (it) {
          html += card('outfitLuxuryId', it, '');
        });
        html += '</div>';
        html +=
          '<button type="button" class="mmIdClear" data-clear="outfitLuxuryId">Clear wardrobe styling</button>';
      }
    } else if (currentTab === 'accessories') {
      const rows = owned
        .map(getItem)
        .filter(function (it) {
          return it && it.kind === 'shopping' && (it.category === 'jewelry' || it.category === 'watches');
        })
        .sort(function (a, b) {
          return b.cost - a.cost;
        });
      if (!rows.length) {
        html = '<div class="mmIdEmpty">No jewelry or watches owned yet.</div>';
      } else {
        html += '<div class="mmIdSectionTitle">Jewelry</div><div class="mmIdCardGrid">';
        rows
          .filter(function (it) {
            return it.category === 'jewelry';
          })
          .forEach(function (it) {
            html += card('jewelryId', it, '');
          });
        html += '</div><div class="mmIdSectionTitle" style="margin-top:12px">Watches</div><div class="mmIdCardGrid">';
        rows
          .filter(function (it) {
            return it.category === 'watches';
          })
          .forEach(function (it) {
            html += card('watchId', it, '');
          });
        html += '</div>';
        html +=
          '<button type="button" class="mmIdClear" data-clear="jewelryId">Clear jewelry</button> ' +
          '<button type="button" class="mmIdClear" data-clear="watchId">Clear watch</button>';
      }
    } else if (currentTab === 'backgrounds') {
      const rows = owned
        .map(getItem)
        .filter(function (it) {
          return it && it.kind === 'shopping' && it.category === 'homes';
        })
        .sort(function (a, b) {
          return b.cost - a.cost;
        });
      if (!rows.length) {
        html = '<div class="mmIdEmpty">No residences owned yet.</div>';
      } else {
        html += '<div class="mmIdSectionTitle">Stage a home you own</div><div class="mmIdCardGrid">';
        rows.forEach(function (it) {
          html += card('backgroundHomeId', it, ' mmIdCard--wide');
        });
        html += '</div>';
        html +=
          '<button type="button" class="mmIdClear" data-clear="backgroundHomeId">Use default skyline</button>';
      }
    } else if (currentTab === 'fleet') {
      const rows = owned
        .map(getItem)
        .filter(function (it) {
          return it && it.kind === 'shopping' && it.category === 'cars';
        })
        .sort(function (a, b) {
          return b.cost - a.cost;
        });
      if (!rows.length) {
        html = '<div class="mmIdEmpty">No vehicles owned yet.</div>';
      } else {
        html += '<div class="mmIdSectionTitle">Hero vehicle in scene</div><div class="mmIdCardGrid">';
        rows.forEach(function (it) {
          html += card('showcaseCarId', it, '');
        });
        html += '</div>';
        html += '<button type="button" class="mmIdClear" data-clear="showcaseCarId">Clear hero car</button>';
      }
    }

    grid.innerHTML = html;
  }

  function wire(container) {
    container.querySelectorAll('.mmIdentityTab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const t = btn.getAttribute('data-tab');
        if (!t) return;
        setTab(t);
        container.querySelectorAll('.mmIdentityTab').forEach(function (b) {
          b.classList.toggle('mmIdentityTab--on', b.getAttribute('data-tab') === t);
        });
        renderGrid(container);
      });
    });

    container.addEventListener('click', function (e) {
      const clr = e.target.closest('[data-clear]');
      if (clr) {
        equip(clr.getAttribute('data-clear'), '');
        renderGrid(container);
        return;
      }
      const ap = e.target.closest('[data-appearance]');
      if (ap) {
        const g = gameSafe();
        if (!g) return;
        const kind = ap.getAttribute('data-appearance');
        const v = ap.getAttribute('data-v');
        const owned = ownedList();
        const lo = normLoadout(g.avatarLoadout || {}, owned);
        if (kind === 'pose') lo.pose = v === '' ? null : Number(v);
        if (kind === 'base') lo.appearanceBase = v || 'm';
        if (kind === 'hair') lo.appearanceHair = v === '' ? null : Number(v);
        if (kind === 'palette') lo.appearancePalette = Number(v) || 0;
        g.avatarLoadout = normLoadout(lo, owned);
        paintMiniPreview();
        if (typeof global.mmPaintEmpireAvatarFigure === 'function') global.mmPaintEmpireAvatarFigure();
        if (typeof global.mmSaveGameSilent === 'function') global.mmSaveGameSilent();
        renderGrid(container);
        return;
      }
      const card = e.target.closest('.mmIdCard');
      if (card) {
        const slot = card.getAttribute('data-slot');
        const id = card.getAttribute('data-id');
        if (!slot) return;
        if (isEquipped(slot, id)) equip(slot, '');
        else equip(slot, id);
        renderGrid(container);
      }
    });
  }

  function mount(container) {
    if (!container) return function () {};
    function refresh() {
      renderGrid(container);
      paintMiniPreview();
    }
    if (container.dataset.mmIdentityMounted === '1') {
      refresh();
      return refresh;
    }
    const rail = TABS.map(function (t) {
      return (
        '<button type="button" class="mmIdentityTab' +
        (t.id === currentTab ? ' mmIdentityTab--on' : '') +
        '" data-tab="' +
        t.id +
        '">' +
        t.label +
        '</button>'
      );
    }).join('');
    container.innerHTML =
      '<div class="mmIdentityStudio">' +
      '<nav class="mmIdentityRail" aria-label="Identity categories">' +
      rail +
      '</nav>' +
      '<div class="mmIdentityPreviewCol">' +
      '<div class="mmIdentityPreviewLabel">Live preview</div>' +
      '<div id="identityStudioPreviewHost" class="mmAvatarHost mmAvatarHost--hub"></div>' +
      '</div>' +
      '<div class="mmIdentityGridCol">' +
      '<div id="identityStudioGrid" class="mmIdentityGrid"></div>' +
      '</div>' +
      '</div>';
    container.dataset.mmIdentityMounted = '1';
    wire(container);
    refresh();
    return refresh;
  }

  global.mmMountIdentityStudio = mount;
})(typeof window !== 'undefined' ? window : this);
