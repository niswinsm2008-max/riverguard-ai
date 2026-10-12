'use strict';
// scikit-learn casts input measurements to float32 before traversing trees.
function predictForest(model, values) {
  if (values.length !== 5 || values.some(v => !Number.isFinite(v))) throw new Error('Enter five valid measurements.');
  const x = values.map(Math.fround);
  let positive = 0;
  for (const tree of model.trees) {
    let node = 0;
    while (tree.left[node] !== -1) node = x[tree.feature[node]] <= tree.threshold[node] ? tree.left[node] : tree.right[node];
    positive += tree.positive[node];
  }
  positive /= model.trees.length;
  const index = positive > 0.5 ? 1 : 0;
  return { label: model.classes[index], probability: index ? positive : 1 - positive, probabilities: [1 - positive, positive] };
}
if (typeof module !== 'undefined') module.exports = { predictForest };
if (typeof document !== 'undefined') initialize();
function initialize() {
  const model = window.RIVERGUARD_MODEL;
  const $ = id => document.getElementById(id);
  if (!model) { $('result-label').textContent = 'Model unavailable'; $('result-description').textContent = 'Keep model.js beside index.html and reload the page.'; return; }
  const specs = [
    {name:'pH', unit:'', min:3,max:11.5,step:.1,value:7.2},
    {name:'Turbidity',unit:'NTU',min:.1,max:120,step:.1,value:12},
    {name:'Dissolved oxygen',unit:'mg/L',min:.3,max:14,step:.1,value:7},
    {name:'Total dissolved solids',short:'TDS',unit:'mg/L',min:20,max:1800,step:1,value:420},
    {name:'Temperature',unit:'°C',min:5,max:42,step:.1,value:25}
  ];
  let lastAssessment;
  specs.forEach((s,i) => {
    const box = document.createElement('div'); box.className = 'control';
    box.innerHTML = `<div class="control-top"><label for="value-${i}">${s.name} <span class="unit">${s.unit}</span></label><input id="value-${i}" type="number" min="${s.min}" max="${s.max}" step="${s.step}" value="${s.value}" required></div><input id="slider-${i}" type="range" aria-label="${s.name} slider" min="${s.min}" max="${s.max}" step="${s.step}" value="${s.value}"><div class="bounds"><span>${s.min}</span><span>${s.max} ${s.unit}</span></div>`;
    $('controls').append(box);
    $(`slider-${i}`).addEventListener('input', e => { $(`value-${i}`).value=e.target.value; assess(); });
    $(`value-${i}`).addEventListener('input', e => { if(e.target.validity.valid) $(`slider-${i}`).value=e.target.value; assess(); });
  });
  function assess() {
    if (!$('sample-form').checkValidity()) {
      $('input-error').hidden=false; $('input-error').textContent='Enter a value within each measurement’s allowed range.';
      $('result-label').textContent='Check measurements'; $('result-description').textContent='Complete the sample to generate a new assessment.';
      $('probability').textContent='—'; $('probability-bar').style.width='0'; $('export-sample').disabled=true; lastAssessment=null; return;
    }
    $('input-error').hidden=true;
    const values=specs.map((s,i)=>Number($(`value-${i}`).value));
    const result=predictForest(model,values);
    const station=$('station').value.trim()||'Unnamed sample';
    $('sample-name').textContent=station;
    $('result-label').textContent=result.label;
    $('result-panel').classList.toggle('warning',result.label==='Needs verification');
    $('result-description').textContent=result.label==='Needs verification' ? 'This sample merits follow-up within the demonstration model. Repeat the measurement and seek confirmatory testing.' : 'This sample is lower concern within the synthetic demonstration model. This does not establish that the water is safe.';
    const percentage=(result.probability*100).toFixed(1)+'%';
    $('probability').textContent=percentage; $('probability-bar').style.width=percentage;
    const outside=specs.filter((s,i)=>values[i]<model.ranges[i][0]||values[i]>model.ranges[i][1]);
    $('range-warning').hidden=!outside.length;
    $('range-warning').textContent='Outside the observed training range: '+outside.map(s=>s.name).join(', ')+'. Treat this prediction with additional caution.';
    $('profile').replaceChildren();
    specs.forEach((s,i)=>{
      const row=document.createElement('div');row.className='profile-row';
      row.innerHTML=`<span>${s.short||s.name}</span><div class="profile-track"><span style="width:${(values[i]-s.min)/(s.max-s.min)*100}%"></span></div><strong>${values[i]} ${s.unit}</strong>`;
      $('profile').append(row);
    });
    lastAssessment={station,values,...result,outsideTrainingRange:outside.map(s=>s.name)};
    $('export-sample').disabled=false;
  }
  $('sample-form').addEventListener('submit',e=>{e.preventDefault();assess();});
  $('station').addEventListener('input',assess);
  function setValues(values) { values.forEach((v,i)=>{$(`value-${i}`).value=v;$(`slider-${i}`).value=v;});assess(); }
  $('reset').addEventListener('click',()=>{$('station').value='Demo station';setValues(specs.map(s=>s.value));});
  document.querySelectorAll('[data-preset]').forEach(button=>button.addEventListener('click',()=>setValues(button.dataset.preset==='typical'?[7.2,12,7,420,25]:[5,75,2,1200,35])));
  $('export-sample').addEventListener('click',()=>{
    if(!lastAssessment)return;
    const a=lastAssessment;
    const headers=['Station',...model.features,'Prediction','Model_probability','Outside_training_range','Scope'];
    // Neutralize spreadsheet formulas in user-provided station names.
    const safeStation=/^[\s]*[=+@-]/.test(a.station)?"'"+a.station:a.station;
    const row=[safeStation,...a.values,a.label,a.probability,a.outsideTrainingRange.join('; '),'Synthetic demo only; not a water-safety certification'];
    const quote=v=>'"'+String(v).replaceAll('"','""')+'"';
    const blob=new Blob(['\uFEFF'+headers.map(quote).join(',')+'\r\n'+row.map(quote).join(',')+'\r\n'],{type:'text/csv;charset=utf-8'});
    const url=URL.createObjectURL(blob), link=document.createElement('a');link.href=url;link.download='riverguard-assessment.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  specs.map((s,i)=>({name:s.short||s.name,value:model.importance[i]})).sort((a,b)=>b.value-a.value).forEach(s=>{
    const row=document.createElement('div');row.className='importance-row';
    row.innerHTML=`<div class="importance-label"><span>${s.name}</span><strong>${(s.value*100).toFixed(1)}%</strong></div><div class="profile-track"><span style="width:${s.value*100}%"></span></div>`;
    $('importance').append(row);
  });
  for(const item of model.preview){const row=document.createElement('tr');for(const key of [...model.features,'Demo_Label']){const cell=document.createElement('td');cell.textContent=item[key];row.append(cell);}document.querySelector('#data-preview tbody').append(row);}
  assess();
}
