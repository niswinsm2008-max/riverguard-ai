'use strict';
// Optional browser-local sample journal. Nothing is transmitted to a service.
(() => {
  const key='riverguard-journal-v1', $=id=>document.getElementById(id);
  let entries=[],storageAvailable=true;
  try { const stored=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(stored))entries=stored.filter(e=>e&&typeof e.station==='string'&&Array.isArray(e.values)&&e.values.length===5&&e.values.every(Number.isFinite)&&typeof e.label==='string'&&typeof e.date==='string').slice(0,50); } catch {storageAvailable=false;}
  const names=['pH','Turbidity','Dissolved oxygen','TDS','Temperature'],units=['','NTU','mg/L','mg/L','°C'];
  const ranges=[[3,11.5],[.1,120],[.3,14],[20,1800],[5,42]];
  function current(){const values=names.map((_,i)=>Number(document.getElementById(`value-${i}`)?.value));if(!$('sample-form').checkValidity()||!window.RIVERGUARD_MODEL)return null;return {station:$('station').value.trim()||'Unnamed sample',values,...predictForest(window.RIVERGUARD_MODEL,values),date:new Date().toISOString()};}
  function persist(){try{localStorage.setItem(key,JSON.stringify(entries));return true;}catch{storageAvailable=false;return false;}}
  function render(){
    const body=$('journal-rows');body.replaceChildren();
    $('journal-empty').hidden=entries.length>0;$('journal-count').textContent=`${entries.length} / 50 samples`;
    $('clear-journal').disabled=!entries.length;
    entries.forEach((e,i)=>{const tr=document.createElement('tr');for(const text of [new Date(e.date).toLocaleString(),e.station,e.label,e.values.join(' / ')]){const td=document.createElement('td');td.textContent=text;tr.append(td);}const action=document.createElement('td'),button=document.createElement('button');button.className='text-button';button.textContent='Load sample';button.setAttribute('aria-label',`Load ${e.station}, sample ${i+1}`);button.onclick=()=>{names.forEach((_,j)=>{document.getElementById(`value-${j}`).value=e.values[j];document.getElementById(`slider-${j}`).value=e.values[j];});$('station').value=e.station;$('station').dispatchEvent(new Event('input',{bubbles:true}));$('analysis').scrollIntoView({behavior:'smooth'});refresh();};action.append(button);tr.append(action);body.append(tr);});
    refresh();
  }
  function refresh(){
    const sample=current();$('save-sample').disabled=!sample;
    const comparison=$('comparison');comparison.replaceChildren();
    if(!sample){comparison.textContent='Complete all measurements to compare a sample.';return;}
    if(!entries.length){comparison.textContent='Save your first sample to use it as a comparison point.';return;}
    const caption=document.createElement('p');caption.className='small muted';caption.textContent=`Compared with the most recently saved sample: ${entries[0].station}. Differences do not indicate a safety trend.`;comparison.append(caption);
    const list=document.createElement('div');list.className='comparison-grid';sample.values.forEach((v,i)=>{const delta=Math.round((v-entries[0].values[i])*100)/100;const cell=document.createElement('div');const label=document.createElement('span');label.textContent=names[i];const value=document.createElement('strong');value.textContent=`${delta>0?'+':''}${delta} ${units[i]}`;cell.append(label,value);list.append(cell);});comparison.append(list);
  }
  $('save-sample').onclick=()=>{const s=current();if(!s)return;entries.unshift(s);entries=entries.slice(0,50);const saved=persist();render();$('journal-message').textContent=saved?'Sample saved on this browser.':'Browser storage is unavailable. This sample is kept only until this page closes.';};
  $('clear-journal').onclick=()=>{entries=[];try{localStorage.removeItem(key);}catch{}render();$('journal-message').textContent='Saved sample history cleared from this browser.';};
  $('sample-form').addEventListener('input',refresh);$('sample-form').addEventListener('click',()=>setTimeout(refresh,0));
  $('export-journal').onclick=()=>{
    if(!entries.length){$('journal-message').textContent='Save a sample before exporting the journal.';return;}
    const escape=v=>'"'+String(v).replaceAll('"','""')+'"';
    const rows=[['Saved at','Station',...names,'Demo classification','Model probability','Scope'],...entries.map(e=>[e.date,/^[\s]*[=+@-]/.test(e.station)?"'"+e.station:e.station,...e.values,e.label,e.probability,'Synthetic model; not safety certification'])];
    const url=URL.createObjectURL(new Blob(['\uFEFF'+rows.map(r=>r.map(escape).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='riverguard-sample-journal.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  render();if(!storageAvailable)$('journal-message').textContent='Browser storage is unavailable or unreadable. New samples may only last for this session.';
})();
