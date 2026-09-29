const {URL}=require('url');

const count=(re,s)=>(s.match(re)||[]).length;
const clean=(s='')=>s.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
const uniq=xs=>[...new Set(xs.filter(Boolean))];
const privateHost=h=>h==='localhost'||h==='::1'||/^127\./.test(h)||/^10\./.test(h)||/^192\.168\./.test(h)||/^169\.254\./.test(h)||/^172\.(1[6-9]|2\d|3[01])\./.test(h);

function normalize(input){
  const v=(input||'').trim(); if(!v) throw new Error('Укажите URL компании');
  const u=new URL(/^https?:\/\//i.test(v)?v:'https://'+v);
  if(!['http:','https:'].includes(u.protocol)||privateHost(u.hostname.toLowerCase())) throw new Error('Разрешены только публичные http/https сайты');
  return u.toString();
}
async function get(url,ms=12000){
  const c=new AbortController(),t=setTimeout(()=>c.abort(),ms);
  try{const r=await fetch(url,{redirect:'follow',signal:c.signal,headers:{'user-agent':'Mozilla/5.0 AI-Business-Scan/0.1'}});return {ok:r.ok,status:r.status,url:r.url,text:(await r.text()).slice(0,1500000)}}finally{clearTimeout(t)}
}
function links(html,base){
  const out=[],re=/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi; let m;
  while((m=re.exec(html))){try{out.push({href:new URL(m[1],base).toString(),text:clean(m[2]).slice(0,120)})}catch{}}
  return out.slice(0,1200);
}
function inspect(html,url){
  const ls=links(html,url), imgs=html.match(/<img\b[^>]*>/gi)||[];
  const wa=ls.filter(x=>/wa\.me|whatsapp\.com|api\.whatsapp/i.test(x.href));
  const social=ls.filter(x=>/instagram\.com|facebook\.com|tiktok\.com|youtube\.com|linkedin\.com/i.test(x.href));
  const trackers={
    gtm:/googletagmanager\.com|GTM-[A-Z0-9]+/i.test(html),
    ga:/gtag\(|google-analytics\.com|\bG-[A-Z0-9]{6,}\b/i.test(html),
    meta:/connect\.facebook\.net|fbq\(/i.test(html),
    yandex:/mc\.yandex\.ru|ym\(/i.test(html),
    calltracking:/calltouch|comagic|uiscom|roistat/i.test(html)
  };
  const m=html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)||[];
  const d=html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i)||[];
  const can=html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)||[];
  return {
    title:clean(m[1]||''),description:clean(d[1]||''),canonical:can[1]||null,
    viewport:/<meta[^>]+name=["']viewport["']/i.test(html),
    h1:count(/<h1\b[^>]*>/gi,html),forms:count(/<form\b[^>]*>/gi,html),
    jsonLd:count(/<script[^>]+type=["']application\/ld\+json["']/gi,html),
    images:imgs.length,imagesWithoutAlt:imgs.filter(x=>!/\balt=["'][^"']+["']/i.test(x)).length,
    whatsapp:wa.length,whatsappSamples:wa.slice(0,5),social:uniq(social.map(x=>x.href)).slice(0,12),
    phones:uniq((html.match(/tel:[^"'\s<]+/gi)||[]).map(x=>x.slice(4))).slice(0,10),
    ctas:ls.filter(x=>/(запис|стоим|цен|консульт|купить|заказать|получить|оставить|whatsapp|написать|связаться|booking|book|price|contact)/i.test(x.text)).slice(0,25),
    trackers,utmLinks:ls.filter(x=>/[?&]utm_(source|medium|campaign)=/i.test(x.href)).length,
    crm:uniq(ls.map(x=>{try{return new URL(x.href).hostname}catch{return''}}).filter(h=>/bitrix|amocrm|yclients|dikidi|medods|1c|crm/i.test(h)))
  };
}
const F=(type,title,evidence,impact,next,score)=>({type,title,evidence,impact,next,score});
function findings(a,x){
  const f=[];
  if(a.whatsapp>0&&a.forms===0) f.push(F('ГИПОТЕЗА','Путь лида завязан на WhatsApp',`WhatsApp-ссылок: ${a.whatsapp}; HTML-форм: 0.`,'После перехода качество конверсии зависит от ручной обработки; возможны потерянные лиды и отсутствие структурированной квалификации.','Провести mystery-shopping 3–5 сценариями и проверить follow-up через 1/3/7 дней.',92));
  if(Object.values(a.trackers).some(Boolean)&&a.utmLinks===0) f.push(F('ГИПОТЕЗА','Атрибуция рекламы может обрываться после сайта',`Трекеры: ${Object.entries(a.trackers).filter(([,v])=>v).map(([k])=>k).join(', ')}; UTM в исходящих CTA не найдены.`,'Источник обращения может не доезжать до менеджера/CRM.','Проверить передачу source/campaign и отчёт источник → запись → продажа.',88));
  if(!a.trackers.gtm&&!a.trackers.ga&&!a.trackers.yandex) f.push(F('ГИПОТЕЗА','Не видна базовая веб-аналитика','GTM/GA/Yandex Metrika сигнатуры не обнаружены.','Без аналитики трудно связать трафик с заявками и продажами.','Уточнить серверную/иную аналитику; если её нет — настроить события и цели.',76));
  if(!a.canonical) f.push(F('ФАКТ','Не обнаружен canonical','В HTML главной страницы не найден rel=canonical.','Возможны сложности с дублями URL/индексацией.','Проверить зеркала домена, индекс и редиректы.',54));
  if(a.h1!==1) f.push(F('ФАКТ','Структура H1 требует проверки',`H1 на главной: ${a.h1}.`,'Может ухудшать семантическую структуру страницы.','Проверить шаблоны и заголовки.',38));
  if(a.images&&a.imagesWithoutAlt/a.images>.35) f.push(F('ФАКТ','Много изображений без alt',`${a.imagesWithoutAlt} из ${a.images} изображений без содержательного alt.`,'Потеря доступности и части поисковых сигналов.','Добавить содержательные alt там, где изображение несёт смысл.',28));
  if(x.ads?.trim()) f.push(F('ФАКТ/СИГНАЛ','Рекламный контур добавлен',x.ads.trim().slice(0,700),'Можно сравнить обещание рекламы с посадочной и обработкой лида.','Разобрать каждый рекламный оффер как отдельную воронку до продажи.',95));
  if(x.mystery?.trim()&&!/(не провед|нет данных|не провер|ещ[её] не)/i.test(x.mystery)) f.push(F('ФАКТ','Mystery-shopping: есть данные обработки',x.mystery.trim().slice(0,700),'Это прямое доказательство реального поведения после обращения.','Сопоставить диалог с целевым сценарием и оценить цену потери лида.',98));
  if(x.maps?.trim()) f.push(F('СИГНАЛ','Карты/репутация добавлены',x.maps.trim().slice(0,700),'Отзывы показывают доверие, вопросы и операционные сбои глазами клиента.','Кластеризовать отзывы: сервис, ожидание, цена, запись, качество, повторные визиты.',70));
  if(x.social?.trim()) f.push(F('СИГНАЛ','Соцсети добавлены',x.social.trim().slice(0,700),'Можно проверить связку контент → CTA → лид → запись.','Сверить офферы соцсетей с сайтом/WhatsApp и атрибуцией.',68));
  return f.sort((a,b)=>b.score-a.score);
}
function contours(a,x){
  return [
    ['Привлечение','Поиск/платная реклама/карты и соответствие офферов.',x.ads?'есть данные':'нужно проверить рекламу'],
    ['Конверсия',`WhatsApp: ${a.whatsapp}; формы: ${a.forms}`,'публичные данные'],
    ['Продажи','Квалификация, SLA, follow-up снаружи не видны.','нужен mystery-shopping'],
    ['CRM',a.crm.length?`Видимые домены: ${a.crm.join(', ')}`:'CRM снаружи не подтверждена.','нужно уточнить'],
    ['Операционка','Handoff AI→человек, расписание, исключения, SLA.','нужно интервью'],
    ['Удержание','Повторные касания, реактивация, no-show, незавершённые планы.','нужны внутренние цифры'],
    ['Репутация',x.maps?x.maps.slice(0,180):'Проверить 2GIS/Google/отзывы и ответы.','частично/не проверено'],
    ['Аналитика',Object.values(a.trackers).some(Boolean)?`Трекеры: ${Object.entries(a.trackers).filter(([,v])=>v).map(([k])=>k).join(', ')}`:'Явные трекеры не обнаружены.','публичные сигналы'],
    ['B2B/внутренние процессы','Партнёры, документы, статусы заказов, отдельные продуктовые линии.','нужно исследование']
  ].map(([name,observation,status])=>({name,observation,status}));
}
function message(host,top){
  return `Добрый день. Я разобрал публичный путь клиента ${host} — не только сайт, а связку привлечение → обращение → обработка → повторное касание. Самая интересная гипотеза сейчас: «${top?.title||'есть несколько мест для проверки'}». Я не предлагаю менять всё подряд: могу показать короткий разбор на вашем же примере и один сценарий улучшения. Если гипотеза не подтвердится — так и скажу.`;
}
async function aiLayer(payload){
  if(!process.env.OPENAI_API_KEY) return null;
  const model=process.env.OPENAI_MODEL||'gpt-5-mini';
  const input='Ты консультант по AI-внедрениям. Не выдумывай внутренние процессы. Всегда разделяй ФАКТ / ГИПОТЕЗА / НУЖНО ПРОВЕРИТЬ. По JSON дай: 3 денежные гипотезы; mystery-shopping; лучший вход владельцу; что НЕ продавать. Кратко по-русски.\n'+JSON.stringify(payload).slice(0,25000);
  const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+process.env.OPENAI_API_KEY},body:JSON.stringify({model,input})});
  if(!r.ok) return 'AI layer error '+r.status;
  const j=await r.json();
  return (j.output||[]).flatMap(o=>o.content||[]).map(c=>c.text||c.output_text||'').join('\n').trim()||null;
}

module.exports=async(req,res)=>{
  if(req.method!=='POST') return res.status(405).json({error:'POST only'});
  try{
    const b=typeof req.body==='string'?JSON.parse(req.body):req.body||{}, target=normalize(b.url), main=await get(target);
    if(!main.ok) throw new Error('Сайт вернул HTTP '+main.status);
    const u=new URL(main.url), a=inspect(main.text,main.url), x={ads:b.ads||'',maps:b.maps||'',social:b.social||'',mystery:b.mystery||''};
    const [robots,sitemap]=await Promise.allSettled([get(u.origin+'/robots.txt',5000),get(u.origin+'/sitemap.xml',5000)]);
    const fs=findings(a,x);
    const result={target:main.url,host:u.hostname,scannedAt:new Date().toISOString(),technical:{...a,robots:robots.status==='fulfilled'&&robots.value.ok,sitemap:sitemap.status==='fulfilled'&&sitemap.value.ok},contours:contours(a,x),findings:fs,top:fs.slice(0,5),outreach:message(u.hostname,fs[0]),ai:null,disclaimer:'Публичный аудит показывает факты и гипотезы. CRM, продажи, no-show, повторные продажи и экономика требуют внутренней проверки или mystery-shopping.'};
    result.ai=await aiLayer({target:result.target,technical:result.technical,contours:result.contours,findings:result.findings});
    res.status(200).json(result);
  }catch(e){res.status(400).json({error:e.message||String(e)})}
};