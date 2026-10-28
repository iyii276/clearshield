(() => {
  const data = window.CLEARSHIELD_TECHNIQUES || [];
  const grid = document.getElementById('techniquesGrid');
  const search = document.getElementById('techniqueSearch');
  const category = document.getElementById('techniqueCategory');
  const count = document.getElementById('techniqueCount');
  const escapeText = (s) => String(s ?? '');
  function render() {
    const term = (search.value || '').trim().toLowerCase();
    const cat = category.value;
    const found = data.filter(item => (cat === 'all' || item.category === cat) &&
      [item.title,item.category,item.shortDescription].join(' ').toLowerCase().includes(term));
    count.textContent = `${found.length} technique${found.length === 1 ? '' : 's'} shown`;
    grid.replaceChildren();
    if (!found.length) { const empty=document.createElement('p'); empty.className='technique-empty'; empty.textContent='No techniques match your search. Try another term or category.'; grid.append(empty); return; }
    found.forEach(item => {
      const card=document.createElement('article'); card.className='technique-card';
      const tag=document.createElement('span'); tag.className='technique-category'; tag.textContent=item.category;
      const h=document.createElement('h2'); const a=document.createElement('a'); a.href=`/scam-techniques/${encodeURIComponent(item.slug)}`; a.textContent=item.title; h.append(a);
      const p=document.createElement('p'); p.textContent=item.shortDescription;
      const link=document.createElement('a'); link.href=a.href; link.className='technique-link'; link.textContent='Read full explanation →';
      card.append(tag,h,p,link); grid.append(card);
    });
  }
  search?.addEventListener('input',render); category?.addEventListener('change',render); render();
})();