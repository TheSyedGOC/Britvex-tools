(function(){
var RATES={
  '2425':{pa:12570,basic:50270,higher:125140,it20:0.20,it40:0.40,it45:0.45,ni_pt:12570,ni_uel:50270,ni_main:0.08,ni_up:0.02,cl4_ll:12570,cl4_ul:50270,cl4_m:0.09,cl4_up:0.02,yr:'2024/25'},
  '2526':{pa:12570,basic:50270,higher:125140,it20:0.20,it40:0.40,it45:0.45,ni_pt:12570,ni_uel:50270,ni_main:0.08,ni_up:0.02,cl4_ll:12570,cl4_ul:50270,cl4_m:0.06,cl4_up:0.02,yr:'2025/26'}
};
function mtG(id){return parseFloat(document.getElementById(id).value)||0;}
function mtGS(id){return document.getElementById(id).value;}
function mtEl(id){return document.getElementById(id);}
function mtFmt(v){return '\u00a3'+Math.max(0,Math.round(v)).toLocaleString('en-GB');}
function mtPct(v){return (v*100).toFixed(1)+'%';}

function mtIT(g,r,region){
  var pa=r.pa;
  if(g>100000) pa=Math.max(0,r.pa-Math.floor((g-100000)/2));
  if(g<=pa) return 0;
  var t=0;
  if(region==='scot'){
    var bands=[{lim:15397,rt:0.19},{lim:27491,rt:0.20},{lim:43662,rt:0.21},{lim:75000,rt:0.42},{lim:125140,rt:0.45},{lim:1e9,rt:0.48}];
    var tax=g-pa,prev=0;
    for(var i=0;i<bands.length;i++){if(tax<=0)break;var ck=Math.min(tax,bands[i].lim-prev);if(ck>0)t+=ck*bands[i].rt;tax-=ck;prev=bands[i].lim;}
  } else {
    if(g>r.higher) t=(g-r.higher)*r.it45+(r.higher-r.basic)*r.it40+(r.basic-pa)*r.it20;
    else if(g>r.basic) t=(g-r.basic)*r.it40+(r.basic-pa)*r.it20;
    else t=(g-pa)*r.it20;
  }
  return Math.max(0,t);
}
function mtNI(g,r){var n=0;if(g>r.ni_pt)n+=(Math.min(g,r.ni_uel)-r.ni_pt)*r.ni_main;if(g>r.ni_uel)n+=(g-r.ni_uel)*r.ni_up;return Math.max(0,n);}
function mtCl4(p,r){var n=0;if(p>r.cl4_ll)n+=(Math.min(p,r.cl4_ul)-r.cl4_ll)*r.cl4_m;if(p>r.cl4_ul)n+=(p-r.cl4_ul)*r.cl4_up;return Math.max(0,n);}
function mtHICBC(adj,cb){if(adj<=60000)return 0;if(adj>=80000)return cb;return cb*((adj-60000)/20000);}

function mtMarginalRate(income,r,type,region){
  var step=100;
  var t1=mtTotalTax(income,r,type,region,0);
  var t2=mtTotalTax(income+step,r,type,region,0);
  return (t2-t1)/step;
}

function mtTotalTax(income,r,type,region,penPct){
  var taxable=income*(1-penPct/100);
  var it=mtIT(taxable,r,region);
  var ni=type==='paye'?mtNI(taxable,r):type==='se'?mtCl4(taxable,r):mtNI(Math.min(taxable,r.pa),r);
  return it+ni;
}

function mtCalc(){
  var income=mtG('mt-income');
  if(income<=0){mtEl('mt-result').innerHTML='<div class="bv-empty"><div style="font-size:32px;margin-bottom:10px">📊</div><div style="font-size:14px;font-weight:600;color:var(--bv-text2);margin-bottom:5px">Enter your income</div><div style="font-size:12px">Enter your current income to see your marginal tax position,<br>threshold warnings and planning recommendations.</div></div>';return;}
  var yr=mtGS('mt-yr'),r=RATES[yr],type=mtGS('mt-type'),region=mtGS('mt-region');
  var increase=mtG('mt-increase'),penPct=mtG('mt-pen');
  var hasCB=mtGS('mt-cb')==='yes',cbAmt=hasCB?mtG('mt-cbamt'):0;
  var newIncome=income+(increase||0);
  var penAmt=income*(penPct/100);
  var taxableNow=income-penAmt;
  var taxableNew=newIncome-penAmt;

  var itNow=mtIT(taxableNow,r,region);
  var niNow=type==='paye'?mtNI(taxableNow,r):type==='se'?mtCl4(taxableNow,r):0;
  var cbNow=hasCB?mtHICBC(taxableNow,cbAmt):0;
  var totalNow=itNow+niNow+cbNow;
  var takeNow=income-totalNow-penAmt;

  var itNew=mtIT(taxableNew,r,region);
  var niNew=type==='paye'?mtNI(taxableNew,r):type==='se'?mtCl4(taxableNew,r):0;
  var cbNew=hasCB?mtHICBC(taxableNew,cbAmt):0;
  var totalNew=itNew+niNew+cbNew;
  var takeNew=newIncome-totalNew-penAmt;

  var margRate=mtMarginalRate(income,r,type,region);
  var effRate=income>0?totalNow/income:0;

  var html='';

  // Summary cards
  html+='<div class="bv-sgrid">';
  html+='<div class="bv-sc bv-pri"><div class="bv-slbl">Current take-home</div><div class="bv-sval">'+mtFmt(takeNow)+'</div><div class="bv-ssub">'+mtFmt(takeNow/12)+' /month</div></div>';
  html+='<div class="bv-sc '+(margRate>=0.55?'bv-warn':'')+'"><div class="bv-slbl">Marginal rate now</div><div class="bv-sval">'+mtPct(margRate)+'</div><div class="bv-ssub">Tax on your next £1 earned</div></div>';
  html+='<div class="bv-sc"><div class="bv-slbl">Effective tax rate</div><div class="bv-sval">'+mtPct(effRate)+'</div><div class="bv-ssub">Overall tax burden</div></div>';
  html+='</div>';

  // Before / after if increase entered
  if(increase>0){
    var extraKept=takeNew-takeNow;
    var extraTax=totalNew-totalNow;
    var margOnIncrease=increase>0?extraTax/increase:0;
    html+='<div class="bv-ba">';
    html+='<div class="bv-ba-card"><div class="bv-ba-lbl">Current take-home</div><div class="bv-ba-val">'+mtFmt(takeNow)+'</div><div class="bv-ba-sub">'+mtFmt(income)+' income</div></div>';
    html+='<div class="bv-ba-card after"><div class="bv-ba-lbl">After +'+mtFmt(increase)+'</div><div class="bv-ba-val">'+mtFmt(takeNew)+'</div><div class="bv-ba-sub">You keep '+mtFmt(extraKept)+' of the increase ('+mtPct(extraKept/increase)+')</div></div>';
    html+='</div>';
    html+='<div class="bv-bdc"><div class="bv-bdtitle">Impact of +'+mtFmt(increase)+' increase <span class="bv-badge" style="background:var(--bv-blue-l);color:var(--bv-blue)">Marginal '+mtPct(margOnIncrease)+'</span></div>';
    html+='<div class="bv-row"><span class="bv-rk">Extra income</span><span class="bv-rv">'+mtFmt(increase)+'</span></div>';
    html+='<div class="bv-row"><span class="bv-rk">Extra tax &amp; NI</span><span class="bv-rv red">'+mtFmt(extraTax)+'</span></div>';
    html+='<div class="bv-row"><span class="bv-rk">Amount you keep</span><span class="bv-rv grn">'+mtFmt(extraKept)+'</span></div>';
    html+='<div class="bv-row"><span class="bv-rk">Effective rate on increase</span><span class="bv-rv amb">'+mtPct(margOnIncrease)+'</span></div>';
    if(cbAmt>0){html+='<div class="bv-row"><span class="bv-rk">Child Benefit charge change</span><span class="bv-rv red">+'+mtFmt(cbNew-cbNow)+'</span></div>';}
    html+='</div>';
  }

  // Threshold warnings
  html+='<div id="mt-cliffs">';
  var cliffs=[];
  var thresholds=[
    {lim:12570,label:'Personal Allowance starts',desc:'Income below £12,570 is tax-free. Above this, income tax begins at 20%.'},
    {lim:50270,label:'Higher rate threshold — 40%',desc:'Income above £50,270 is taxed at 40%. Marginal rate jumps significantly here. Consider pension contributions to stay below.'},
    {lim:60000,label:'Child Benefit charge starts',desc:'If you claim Child Benefit, the High Income Child Benefit Charge begins at £60,000. 1% clawback per £200 over the threshold.'},
    {lim:80000,label:'Full Child Benefit clawback',desc:'At £80,000+ adjusted net income, 100% of Child Benefit is repaid via the tax charge. Net effective rate can exceed 60%.'},
    {lim:100000,label:'Personal Allowance taper — 60% trap',desc:'Between £100,000 and £125,140, the Personal Allowance is withdrawn at £1 per £2 earned. This creates an effective 60% marginal rate. Pension contributions are crucial here.'},
    {lim:125140,label:'Personal Allowance fully withdrawn',desc:'Above £125,140 you have no Personal Allowance. Additional rate of 45% applies. All income above this point taxed at 45%.'}
  ];
  for(var i=0;i<thresholds.length;i++){
    var t=thresholds[i];
    var dist=t.lim-income;
    var distNew=t.lim-newIncome;
    if(income>=t.lim-100&&income<=t.lim+5000){
      cliffs.push({type:'danger',icon:'🚨',msg:'<strong>You are at the '+t.label+' (£'+t.lim.toLocaleString('en-GB')+')</strong> &mdash; '+t.desc});
    } else if(dist>0&&dist<=5000){
      cliffs.push({type:'warn',icon:'⚠️',msg:'<strong>You are £'+dist.toLocaleString('en-GB')+' below the '+t.label+'</strong> &mdash; '+t.desc+(increase>0&&distNew<=0?' Your planned increase crosses this threshold.':'')});
    } else if(increase>0&&dist>0&&distNew<0){
      cliffs.push({type:'warn',icon:'⚠️',msg:'<strong>Your planned +£'+increase.toLocaleString('en-GB')+' crosses the '+t.label+'</strong> &mdash; '+t.desc});
    }
  }
  if(cliffs.length>0){
    for(var c=0;c<cliffs.length;c++){html+='<div class="bv-cliff '+cliffs[c].type+'"><span class="bv-cliff-icon">'+cliffs[c].icon+'</span><div>'+cliffs[c].msg+'</div></div>';}
  }

  // Pension recommendation
  if(income>50000&&income<125140){
    var penToBasic=Math.max(0,income-50270);
    var penTo100k=Math.max(0,income-100000);
    if(income>100000){
      html+='<div class="bv-cliff tip"><span class="bv-cliff-icon">💡</span><div><strong>Pension tip:</strong> Contributing £'+Math.ceil(penTo100k/1000)*1000+' to pension would bring adjusted net income to £100,000, avoiding the 60% marginal rate trap and restoring your full Personal Allowance. Net cost after tax relief is approximately £'+mtFmt(penTo100k*0.40)+'.</div></div>';
    } else if(income>50000){
      html+='<div class="bv-cliff tip"><span class="bv-cliff-icon">💡</span><div><strong>Pension tip:</strong> Contributing £'+Math.ceil(penToBasic/1000)*1000+' to pension would bring income back to the basic rate band, reducing your marginal rate from 40% to 20% and saving approximately £'+mtFmt(penToBasic*0.20)+' in tax.</div></div>';
    }
  }
  if(hasCB&&income>=60000&&income<80000){
    var penForCB=Math.max(0,income-60000);
    html+='<div class="bv-cliff tip"><span class="bv-cliff-icon">💡</span><div><strong>Child Benefit tip:</strong> Contributing £'+Math.ceil(penForCB/1000)*1000+' to pension would bring adjusted net income below £60,000, preserving your full Child Benefit of '+mtFmt(cbAmt)+' per year.</div></div>';
  }
  html+='</div>';

  // UK tax band table
  var bands=[
    {from:0,to:12570,label:'Personal Allowance',rate:'0%',cls:'bv-rate-0'},
    {from:12571,to:50270,label:'Basic rate',rate:'20%',cls:'bv-rate-20'},
    {from:50271,to:100000,label:'Higher rate',rate:'40%',cls:'bv-rate-40'},
    {from:100001,to:125140,label:'Personal Allowance taper',rate:'60%*',cls:'bv-rate-60'},
    {from:125141,to:999999,label:'Additional rate',rate:'45%',cls:'bv-rate-45'}
  ];
  html+='<div class="bv-bdc"><div class="bv-bdtitle">UK income tax band reference <span class="bv-badge" style="background:var(--bv-gray1);color:var(--bv-text3)">2025/26</span></div>';
  html+='<table class="bv-bands"><thead><tr><th>Band</th><th>Income range</th><th>Rate</th><th>You</th></tr></thead><tbody>';
  for(var b=0;b<bands.length;b++){
    var bd=bands[b];
    var inBand=income>=bd.from&&income<=bd.to;
    html+='<tr'+(inBand?' class="bv-cur"':'')+'>';
    html+='<td>'+bd.label+(inBand?' &#9664;':'')+'</td>';
    html+='<td>£'+bd.from.toLocaleString('en-GB')+' &ndash; £'+bd.to.toLocaleString('en-GB')+'</td>';
    html+='<td class="'+bd.cls+'"><strong>'+bd.rate+'</strong></td>';
    html+='<td>'+(inBand?'<strong>Your income</strong>':'&mdash;')+'</td>';
    html+='</tr>';
  }
  html+='</tbody></table><div style="font-size:10px;color:var(--bv-text3);margin-top:6px">* 60% effective rate between £100,000&ndash;£125,140 due to Personal Allowance withdrawal. Plus NI where applicable.</div></div>';

  html+='<div style="text-align:center;padding:6px 0"><a href="https://www.britvex.com/contact-us" target="_blank" class="bv-cta">Discuss tax planning with Britvex &rarr;</a></div>';

  mtEl('mt-result').innerHTML=html;
}

window.mtCBToggle=function(){
  var show=document.getElementById('mt-cb').value==='yes';
  document.getElementById('mt-cbwrap').style.display=show?'block':'none';
  mtCalc();
};
window.mtCalc=mtCalc;
})();
