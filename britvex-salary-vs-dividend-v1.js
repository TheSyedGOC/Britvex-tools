
var SDRATES={
  '2425':{pa:12570,basic:50270,higher:125140,it20:0.20,it40:0.40,it45:0.45,ni_pt:12570,ni_uel:50270,ni_main:0.08,ni_up:0.02,emp_st:9100,emp_r:0.138,div_allow:500,div_b:0.0875,div_h:0.3375,div_a:0.3935,ct_small:0.19,ct_main:0.25,ct_ll:50000,ct_ul:250000,yr:'2024/25'},
  '2526':{pa:12570,basic:50270,higher:125140,it20:0.20,it40:0.40,it45:0.45,ni_pt:12570,ni_uel:50270,ni_main:0.08,ni_up:0.02,emp_st:5000,emp_r:0.138,div_allow:500,div_b:0.0875,div_h:0.3375,div_a:0.3935,ct_small:0.19,ct_main:0.25,ct_ll:50000,ct_ul:250000,yr:'2025/26'}
};
function sdG(id){return parseFloat(document.getElementById(id).value)||0;}
function sdGS(id){return document.getElementById(id).value;}
function sdEl(id){return document.getElementById(id);}
function sdFmt(v){return '\u00a3'+Math.max(0,Math.round(v)).toLocaleString('en-GB');}

function sdSync(k){
  var s=sdEl('sd-'+k+'-s'),v=parseFloat(s.value)||0;
  if(k==='pen'){sdEl('sd-pen-disp').textContent=v+'%';}
  else{var inp=sdEl('sd-'+k);if(inp)inp.value=v;sdEl('sd-'+k+'-disp').textContent=sdFmt(v);}
  sdCalc();
}
function sdSync2(k){
  var inp=sdEl('sd-'+k),v=parseFloat(inp.value)||0;
  var s=sdEl('sd-'+k+'-s');if(s){s.value=Math.min(v,parseFloat(s.max));sdEl('sd-'+k+'-disp').textContent=sdFmt(v);}
  sdCalc();
}

function sdIT(g,r,region){
  var pa=r.pa;if(g>100000) pa=Math.max(0,r.pa-Math.floor((g-100000)/2));if(g<=pa) return 0;
  var t=0;
  if(region==='scot'){var bands=[{lim:15397,rt:0.19},{lim:27491,rt:0.20},{lim:43662,rt:0.21},{lim:75000,rt:0.42},{lim:125140,rt:0.45},{lim:1e9,rt:0.48}],tax=g-pa,prev=0;for(var i=0;i<bands.length;i++){if(tax<=0)break;var ck=Math.min(tax,bands[i].lim-prev);if(ck>0)t+=ck*bands[i].rt;tax-=ck;prev=bands[i].lim;}}
  else{if(g>r.higher)t=(g-r.higher)*r.it45+(r.higher-r.basic)*r.it40+(r.basic-pa)*r.it20;else if(g>r.basic)t=(g-r.basic)*r.it40+(r.basic-pa)*r.it20;else t=(g-pa)*r.it20;}
  return Math.max(0,t);
}
function sdNI(g,r){var n=0;if(g>r.ni_pt)n+=(Math.min(g,r.ni_uel)-r.ni_pt)*r.ni_main;if(g>r.ni_uel)n+=(g-r.ni_uel)*r.ni_up;return Math.max(0,n);}
function sdDivTax(d,used,r){var allow=r.div_allow,taxable=Math.max(0,d-allow),tax=0,bands=[{lim:37700,rt:r.div_b},{lim:r.higher,rt:r.div_h},{lim:1e9,rt:r.div_a}],prev=0,pos=used;for(var i=0;i<bands.length;i++){if(taxable<=0)break;var sz=bands[i].lim-prev,u2=Math.max(0,Math.min(pos,sz)),av=Math.max(0,sz-u2),ch=Math.min(taxable,av);if(ch>0)tax+=ch*bands[i].rt;taxable-=ch;pos=Math.max(0,pos-sz);prev=bands[i].lim;}return Math.max(0,tax);}
function sdCT(p,r){if(p<=r.ct_ll)return p*r.ct_small;if(p>=r.ct_ul)return p*r.ct_main;var rel=(r.ct_ul-p)/(r.ct_ul-r.ct_ll)*(r.ct_main-r.ct_small)*p;return p*r.ct_main-rel;}

function sdScenario(profit,salary,penPct,otherInc,dirs,r,region){
  var empNI=Math.max(0,(salary-r.emp_st)*r.emp_r)*dirs;
  var empPen=salary*0.03*dirs;
  var penAmt=profit*(penPct/100);
  var taxProfit=Math.max(0,profit-salary*dirs-empNI-empPen-penAmt);
  var ct=sdCT(taxProfit,r);
  var retained=Math.max(0,taxProfit-ct);
  var divPerDir=retained/dirs;
  var dirIT=sdIT(salary+otherInc,r,region)*dirs;
  var dirNI=sdNI(salary,r)*dirs;
  var bandUsed=Math.max(0,salary+otherInc-r.pa);
  var divTax=sdDivTax(divPerDir,bandUsed,r)*dirs;
  var totalTax=ct+dirIT+dirNI+divTax+empNI;
  var takeHome=(salary*dirs-dirIT-dirNI)+retained-divTax;
  var effRate=profit>0?(totalTax/profit*100).toFixed(1):'0';
  return{profit:profit,salary:salary,dirs:dirs,empNI:empNI,empPen:empPen,penAmt:penAmt,taxProfit:taxProfit,ct:ct,retained:retained,divPerDir:divPerDir,dirIT:dirIT,dirNI:dirNI,divTax:divTax,totalTax:totalTax,takeHome:takeHome,effRate:effRate};
}

function sdCalc(){
  var profit=sdG('sd-profit'),salary=sdG('sd-sal'),penPct=sdG('sd-pen-s')||0;
  sdEl('sd-profit-disp').textContent=sdFmt(profit);sdEl('sd-sal-disp').textContent=sdFmt(salary);sdEl('sd-pen-disp').textContent=penPct+'%';
  if(profit<=0){sdEl('sd-result').innerHTML='<div class="bv-empty"><div style="font-size:32px;margin-bottom:10px">&#128200;</div><div style="font-size:14px;font-weight:600;color:var(--bv-text2);margin-bottom:5px">Enter company profit</div><div style="font-size:12px">Use the slider or type a profit figure to start.</div></div>';return;}
  var yr=sdGS('sd-yr'),r=SDRATES[yr],region=sdGS('sd-region'),dirs=parseInt(sdGS('sd-dirs'))||1,otherInc=sdG('sd-other');

  /* Current scenario */
  var cur=sdScenario(profit,salary,penPct,otherInc,dirs,r,region);

  /* Optimal scenario: salary = PA, rest as dividends */
  var opt=sdScenario(profit,r.pa,penPct,otherInc,dirs,r,region);

  /* Scenario: zero salary, all dividends */
  var zerSal=sdScenario(profit,0,penPct,otherInc,dirs,r,region);

  /* Scenario: full salary (no dividends) */
  var fullSal=Math.min(profit,r.basic);
  var full=sdScenario(profit,fullSal,penPct,otherInc,dirs,r,region);

  /* Find best */
  var scenarios=[{lbl:'Optimal (PA salary + dividends)',sal:r.pa,data:opt},{lbl:'Your current split',sal:salary,data:cur},{lbl:'Zero salary / all dividends',sal:0,data:zerSal},{lbl:'Salary only (no dividends)',sal:fullSal,data:full}];
  var bestTH=Math.max(opt.takeHome,cur.takeHome,zerSal.takeHome,full.takeHome);

  var html='';

  /* Optimal hero */
  html+='<div class="bv-opt-hero">';
  html+='<div style="font-size:12px;font-weight:600;margin-bottom:12px;opacity:.7">Optimal structure for '+r.yr+' &mdash; salary at personal allowance then dividends</div>';
  html+='<div class="bv-opt-grid">';
  html+='<div class="bv-opt-item"><div class="bv-opt-lbl">Optimal take-home</div><div class="bv-opt-val gold">'+sdFmt(opt.takeHome)+'</div><div class="bv-opt-sub">'+sdFmt(opt.takeHome/12)+'/month</div></div>';
  html+='<div class="bv-opt-item"><div class="bv-opt-lbl">Optimal director salary</div><div class="bv-opt-val gold">'+sdFmt(r.pa)+'</div><div class="bv-opt-sub">= Personal Allowance, no IT or NI</div></div>';
  html+='<div class="bv-opt-item"><div class="bv-opt-lbl">Dividend pot after CT</div><div class="bv-opt-val">'+sdFmt(opt.retained)+'</div><div class="bv-opt-sub">Available to distribute</div></div>';
  html+='<div class="bv-opt-item"><div class="bv-opt-lbl">Corp tax on profit</div><div class="bv-opt-val">'+sdFmt(opt.ct)+'</div><div class="bv-opt-sub">Effective rate '+opt.effRate+'%</div></div>';
  html+='</div>';
  if(salary!==r.pa&&profit>0){
    var savingVsOpt=opt.takeHome-cur.takeHome;
    if(Math.abs(savingVsOpt)>100){html+='<div style="background:rgba(255,201,71,.15);border:1px solid rgba(255,201,71,.3);border-radius:var(--bv-rs);padding:9px 13px;font-size:12px;color:#ffc947;margin-top:4px">'+(savingVsOpt>0?'Adjusting to optimal salary would increase take-home by '+sdFmt(savingVsOpt)+' per year ('+sdFmt(savingVsOpt/12)+'/month).':'Your current salary is already near-optimal. Difference is '+sdFmt(Math.abs(savingVsOpt))+'/year.')+'</div>';}
  }
  html+='</div>';

  /* 3-scenario comparison */
  html+='<div class="bv-scen">';
  var show3=[scenarios[0],scenarios[1],scenarios[2]];
  for(var i=0;i<show3.length;i++){
    var sc=show3[i].data,isBest=Math.abs(sc.takeHome-bestTH)<1;
    html+='<div class="bv-sc-card '+(isBest?'bv-best':'')+'"><div class="bv-sc-hdr">'+show3[i].lbl+(isBest?' <span class="bv-sc-badge">Best</span>':'')+'</div>';
    html+=sdScRow('Salary',sdFmt(show3[i].sal*dirs));
    html+=sdScRow('Corp tax',sdFmt(sc.ct));
    html+=sdScRow('Director IT',sdFmt(sc.dirIT));
    html+=sdScRow('Director NI',sdFmt(sc.dirNI));
    html+=sdScRow('Dividend tax',sdFmt(sc.divTax));
    html+=sdScRow('Employer NI',sdFmt(sc.empNI));
    html+='<div class="bv-sc-row bv-tot"><span class="bv-sc-k">Take-home</span><span class="bv-sc-v">'+sdFmt(sc.takeHome)+'</span></div>';
    html+='<div class="bv-sc-row"><span class="bv-sc-k">Effective rate</span><span class="bv-sc-v">'+sc.effRate+'%</span></div>';
    html+='</div>';
  }
  html+='</div>';

  /* Visual bar comparison */
  var maxTH=Math.max(opt.takeHome,cur.takeHome,zerSal.takeHome,full.takeHome)||1;
  html+='<div class="bv-bar-card"><div class="bv-bar-title">Take-home comparison across strategies</div>';
  var barScens=[{l:'Optimal (PA + dividends)',v:opt.takeHome,c:'#0f2744'},{l:'Your current split',v:cur.takeHome,c:'#1e6fbf'},{l:'Zero salary / all dividends',v:zerSal.takeHome,c:'#1a7a4a'},{l:'Salary only',v:full.takeHome,c:'#b86800'}];
  for(var b=0;b<barScens.length;b++){html+='<div class="bv-bar-row"><div class="bv-bar-lbl">'+barScens[b].l+'</div><div class="bv-bar-track"><div class="bv-bar-fill" style="width:'+Math.max(2,barScens[b].v/maxTH*100).toFixed(1)+'%;background:'+barScens[b].c+'"></div></div><div class="bv-bar-val">'+sdFmt(barScens[b].v)+'</div></div>';}
  html+='</div>';

  /* Detailed current breakdown */
  html+='<div class="bv-bdc"><div class="bv-bdt">Your current split breakdown <span class="bv-badge" style="background:var(--bv-blue-l);color:var(--bv-blue)">'+sdFmt(salary)+' salary</span></div>';
  html+=sdBrow('Company profit',sdFmt(profit));
  html+=sdBrow('Director salary (x'+dirs+')',sdFmt(salary*dirs));
  html+=sdBrow('Employer NI',sdFmt(cur.empNI));
  html+=sdBrow('Employer pension (3%)',sdFmt(cur.empPen));
  if(cur.penAmt>0)html+=sdBrow('Pension contribution',sdFmt(cur.penAmt));
  html+=sdBrow('Taxable profit',sdFmt(cur.taxProfit));
  html+=sdBrow('Corporation tax ('+( cur.taxProfit<=50000?'19%':'marginal')+')',sdFmt(cur.ct));
  html+=sdBrow('Retained / distributable',sdFmt(cur.retained));
  html+=sdBrow('Director income tax',sdFmt(cur.dirIT));
  html+=sdBrow('Director NI',sdFmt(cur.dirNI));
  html+=sdBrow('Dividend per director',sdFmt(cur.divPerDir));
  html+=sdBrow('Dividend tax',sdFmt(cur.divTax));
  html+='<div class="bv-rowt"><span class="bv-rk">Director take-home (x'+dirs+')</span><span class="bv-rv grn">'+sdFmt(cur.takeHome)+'</span></div>';
  html+='</div>';

  html+='<div style="text-align:center;padding:4px 0"><a href="https://www.britvex.com/contact-us" target="_blank" class="bv-cta">Speak to Britvex about your optimal structure &rarr;</a></div>';

  sdEl('sd-result').innerHTML=html;
}
function sdScRow(k,v){return '<div class="bv-sc-row"><span class="bv-sc-k">'+k+'</span><span class="bv-sc-v">'+v+'</span></div>';}
function sdBrow(k,v){return '<div class="bv-row"><span class="bv-rk">'+k+'</span><span class="bv-rv">'+v+'</span></div>';}

/* init sliders */
sdEl('sd-profit-disp').textContent=sdFmt(sdG('sd-profit'));
sdEl('sd-sal-disp').textContent=sdFmt(sdG('sd-sal'));
sdEl('sd-pen-disp').textContent='0%';
sdCalc();
