/**
 * Curated photography URLs for owned-item visuals (Unsplash — editorial use).
 * Keyed by shopping category + stable index from item id suffix.
 */
(function (global) {
  'use strict';

  const Q = 'auto=format&fit=crop&w=640&q=82';
  function u(id) {
    return 'https://images.unsplash.com/' + id + '?' + Q;
  }

  const POOLS = {
    homes: [
      u('photo-1600596542815-ffad4c1539a9'),
      u('photo-1512917774080-9991f1c4c750'),
      u('photo-1564013799919-ab600027ffc6'),
      u('photo-1600585154340-be6161a56a0c'),
      u('photo-1600566753190-17f0baa2a6c3'),
      u('photo-1600047509807-ba8f99d2cdde'),
      u('photo-1613977257363-707ba9348227'),
      u('photo-1600607687939-ce8a6c25118c'),
      u('photo-1600585154526-990dced4db0d'),
      u('photo-1600607687644-aac4c3e76cf9')
    ],
    cars: [
      u('photo-1549317661-bd32c8ce0db2'),
      u('photo-1492144534655-ae79c964c9d7'),
      u('photo-1503376780353-7e669276c704'),
      u('photo-1617814076367-b759c7d7a738'),
      u('photo-1613490493576-7fde63acd811'),
      u('photo-1583121274602-3e2820ce698b'),
      u('photo-1555215695-3004980ad54e'),
      u('photo-1614200179885-80ee8d8f74df'),
      u('photo-1618843479313-40f8afb4b4d8'),
      u('photo-1606664515524-ed2f786a0bd6')
    ],
    jewelry: [
      u('photo-1535632066927-ab7c095fd305'),
      u('photo-1611599533688-275d19ab50d5'),
      u('photo-1522312346379-d1a52e2b99b3'),
      u('photo-1617032210959-3fb4d2a7bc35'),
      u('photo-1515562141217-7e222bd22d32'),
      u('photo-1573408301185-914d59930d8a'),
      u('photo-1605100804763-247f67b3557e'),
      u('photo-1617032210947-7f0d1dda012d')
    ],
    watches: [
      u('photo-1523170335258-f5ed118d92a1'),
      u('photo-1524592094714-0f0654e20314'),
      u('photo-1614164185128-e489902f3c62'),
      u('photo-1522312346379-d1a52e2b99b3'),
      u('photo-1539874754764-5a9655916b2c'),
      u('photo-1617032210959-3fb4d2a7bc35'),
      u('photo-1526045431048-f857369baa09'),
      u('photo-1612815154858-60aa99c43ca6')
    ],
    luxury: [
      u('photo-1552374196-c4e7ffc6e126'),
      u('photo-1509631179647-b017aa49ffb1'),
      u('photo-1469334031218-e382a71b716b'),
      u('photo-1490481651871-ab68de25d43d'),
      u('photo-1539109136881-3be0616acf4b'),
      u('photo-1515378791036-0648a3ef77b2'),
      u('photo-1483985988355-763728e1935b'),
      u('photo-1441986300917-64674bd600d8')
    ],
    social: [
      u('photo-1519671482749-fd09f7ea3157'),
      u('photo-1517245385007-939e87e20d2e'),
      u('photo-1521737604893-d14cc237f11d'),
      u('photo-1540575467063-178a50c2df87'),
      u('photo-1504384308090-c54be3855836'),
      u('photo-1529156069898-49953e39b3ac')
    ],
    default: [u('photo-1556761175-5973dc0f32e7')]
  };

  function idxFromItemId(id) {
    const m = String(id || '').match(/_(\d+)$/);
    return m ? parseInt(m[1], 10) : 0;
  }

  function mmIdentityThumbForItem(item) {
    if (!item || item.kind !== 'shopping') return '';
    const cat = String(item.category || 'default');
    const pool = POOLS[cat] || POOLS.default;
    const i = idxFromItemId(item.id) % pool.length;
    return pool[i] || pool[0];
  }

  function mmIdentityHeroForItem(item) {
    if (!item || item.kind !== 'shopping' || item.category !== 'homes') return '';
    const pool = POOLS.homes;
    const i = idxFromItemId(item.id) % pool.length;
    return pool[i].replace('w=640', 'w=1400');
  }

  function mmIdentityRarityLabel(cost) {
    const c = Number(cost) || 0;
    if (c >= 5e8) return 'Mythic';
    if (c >= 5e7) return 'Legendary';
    if (c >= 5e6) return 'Epic';
    if (c >= 5e5) return 'Rare';
    if (c >= 5e4) return 'Uncommon';
    return 'Common';
  }

  global.mmIdentityThumbForItem = mmIdentityThumbForItem;
  global.mmIdentityHeroForItem = mmIdentityHeroForItem;
  global.mmIdentityRarityLabel = mmIdentityRarityLabel;
})(typeof window !== 'undefined' ? window : this);
