(() => {
  const data = window.CLEARSHIELD_TECHNIQUES || [];
  const slug = decodeURIComponent(location.pathname.split('/').filter(Boolean).pop() || '');
  const item = data.find(x => x.slug === slug);
  const root = document.getElementById('techniqueDetail');
  const breadcrumb = document.getElementById('breadcrumbCurrent');
  const esc = (value) => String(value ?? '');
  function el(tag, text, cls) { const n=document.createElement(tag); if(text !== undefined) n.textContent=text; if(cls) n.className=cls; return n; }
  if (!item) {
    document.title='Technique not found — ClearShield';
    root.replaceChildren(el('h1','Technique not found'),el('p','This technique page may have moved. Browse the full library to find the topic you need.'),Object.assign(el('a','Browse all techniques →'),{href:'/scam-techniques'}));
    return;
  }
  document.title=`${item.title} — Scam Techniques | ClearShield`;
  document.querySelector('meta[name="description"]').setAttribute('content',`${item.shortDescription} Learn warning signs and practical ways to protect yourself.`);
  breadcrumb.textContent=item.title;
  root.replaceChildren();
  root.append(el('span',item.category,'technique-category'),el('h1',item.title),el('p',item.shortDescription,'lead'));
  const section=(title, content, list=false)=>{const s=el('section');s.append(el('h2',title)); if(list){const ul=el('ul');content.forEach(v=>ul.append(el('li',v)));s.append(ul);}else{s.append(el('p',content));}root.append(s);};
  section('What it means',item.overview);
  section('How it works',item.howItWorks);
  section('Why it can work',item.whyItWorks);
  section('Warning signs to watch for',item.warningSigns,true);
  const example=el('section');example.append(el('h2','Illustrative example'));example.append(el('div',item.illustrativeExample,'example-panel'));example.append(el('p','This is a fictional educational example, not a claim about a verified real incident.'));root.append(example);
  section('How to protect yourself',item.prevention);
  section('If you have already been affected',item.afterIncident);
  const related=el('section');related.append(el('h2','Related techniques'));const links=el('div',undefined,'related-links');
  (item.relatedTechniques||[]).slice(0,4).forEach(s=>{const other=data.find(x=>x.slug===s);if(other){const a=el('a',other.title);a.href='/scam-techniques/'+encodeURIComponent(other.slug);links.append(a);}});related.append(links);root.append(related);
  const cats=el('section');cats.append(el('h2','Related scam categories'));const catlinks=el('div',undefined,'related-links');
  const names={job:'Job and recruitment scams',investment:'Investment scams',romance:'Romance scams',phishing:'Phishing scams',impersonation:'Impersonation scams',marketplace:'Marketplace scams',sextortion:'Sextortion scams',other:'Other scam types'};
  (item.relatedScamCategories||[]).forEach(c=>{const a=el('a',names[c]||c);a.href='/#learn';catlinks.append(a);});cats.append(catlinks);root.append(cats);
  const nav=el('div',undefined,'technique-nav');const index=data.findIndex(x=>x.slug===item.slug);const prev=data[(index-1+data.length)%data.length],next=data[(index+1)%data.length];const p=el('a','← '+prev.title);p.href='/scam-techniques/'+encodeURIComponent(prev.slug);const n=el('a',next.title+' →');n.href='/scam-techniques/'+encodeURIComponent(next.slug);nav.append(p,n);root.append(nav);
  root.append(el('p','ClearShield provides general educational information, not legal or financial advice. Verify suspicious claims through independently sourced official channels.','technique-footer-note'));
})();