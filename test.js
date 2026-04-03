fetch('https://www.youtube.com/channel/UChvA8_nrczWDBYdHUum7Amw')
  .then(r => r.text())
  .then(t => {
    const m = t.match(/externalId\"\:\"(UC[a-zA-Z0-9_-]+)\"/);
    if (m) console.log(m[1]); else console.log('none');
  });
