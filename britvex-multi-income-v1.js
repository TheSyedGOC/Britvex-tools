(function(){
var RATES={
  '2526':{pa:12570,basic:50270,higher:125140,it20:0.20,it40:0.40,it45:0.45,ni_pt:12570,ni_uel:50270,ni_main:0.08,ni_up:0.02,cl4_ll:12570,cl4_ul:50270,cl4_m:0.06,cl4_up:0.02,div_allow:500,div_b:0.0875,div_h:0.3375,div_a:0.3935,cgt_exempt:3000,cgt_basic:0.18,cgt_higher:0.24,cgt_prop:0.24,cgt_badr:0.14,ct_small:0.19,ct_main:0.25,ct_ll:50000,ct_ul:250000,yr:'2025/26'},
  '2425':{pa:12570,basic:50270,higher:125140,it20:0.20,it40:0.40,it45:0.45,ni_pt:12570,ni_uel:50270,ni_main:0.08,ni_up:0.02,cl4_ll:12570,cl4_ul:50270,cl4_m:0.09,cl4_up:0.02,div_allow:500,div_b:0.0875,div_h:0.3375,div_a:0.3935,cgt_exempt:3000,cgt_basic:0.18,cgt_higher:0.24,cgt_prop:0.24,cgt_badr:0.10,ct_small:0.19,ct_main:0.25,ct_ll:50000,ct_ul:250000,yr:'2024/25'}
};
function miG(id){return parseFloat(document.getElementById(id).value)||0;}
function miGS(id){return document.getElementById(id).value;}
function miEl(id){return document.getElementById(id);}
function miFmt(v){return '\u00a3'+Math.max(0,Math.round(v)).toLocaleString('en-GB');}
function miPct(v){return (Math.max(0,v)*100).toFixed(1)+'%';}

function miIT(g,r){
  var pa=r.pa;
  if(g>100000)pa=Math.max(0,r.pa-Math.floor((g-100000)/2));
  if(g<=pa)return 0;
  var t=0;
  if(g>r.higher)t=(g-r.higher)*r.it45+(r.higher-r.basic)*r.it40+(r.basic-pa)*r.it20;
  else if(g>r.basic)t=(g-r.basic)*r.it40+(r.basic-pa)*r.it20;
  else t=(g-pa)*r.it20;
  return Math.max(0,t);
}
function miNI(g,r){var n=0;if(g>r.ni_pt)n+=(Math.min(g,r.ni_uel)-r.ni_pt)*r.ni_main;if(g>r.ni_uel)n+=(g-r.ni_uel)*r.ni_up;return Math.max(0,n);}
function miCl4(p,r){var n=0;if(p>r.cl4_ll)n+=(Math.min(p,r.cl4_ul)-r.cl4_ll)*r.cl4_m;if(p>r.cl4_ul)n+=(p-r.cl4_ul)*r.cl4_up;return Math.max(0,n);}
function miDivTax(d,used,r){
  var taxable=Math.max(0,d-r.div_allow),tax=0;
  var bands=[{lim:37700,rt:r.div_b},{lim:r.higher,rt:r.div_h},{lim:1e9,rt:r.div_a}];
  var prev=0,pos=used;
  for(var i=0;i<bands.length;i++){if(taxable<=0)break;var sz=bands[i].lim-prev,u2=Math.max(0,Math.min(pos,sz)),av=Math.max(0,sz-u2),ch=Math.min(taxable,av);if(ch>0)tax+=ch*bands[i].rt;taxable-=ch;pos=Math.max(0,pos-sz);prev=bands[i].lim;}
  return Math.max(0,tax);
}
function miCGT(gains,type,totalIncome,r){
  var taxable=Math.max(0,gains-r.cgt_exempt);if(taxable<=0)return 0;
  var rate=type==='prop'?r.cgt_prop:type==='badr'?r.cgt_badr:totalIncome>r.basic?r.cgt_higher:r.cgt_basic;
  return taxable*rate;
}
function miCT(p,r){if(p<=r.ct_ll)return p*r.ct_small;if(p>=r.ct_ul)return p*r.ct_main;var rel=(r.ct_ul-p)/(r.ct_ul-r.ct_ll)*(r.ct_main-r.ct_small)*p;return p*r.ct_main-rel;}

window.miCalc=function(){
  var r=RATES[miGS('mi-yr')];
  var salary=miG('mi-salary'),seProfit=miG('mi-se'),rentProfit=miG('mi-rent'),divInc=miG('mi-div'),cgtGains=miG('mi-cgt'),cgtType=miGS('mi-cgttype');
  var ltdProfit=miG('mi-ltd'),ltdSal=miG('mi-ltdsal'),pension=miG('mi-pension');
  var savingsInt=miG('mi-savings');

  var hasData=salary>0||seProfit>0||rentProfit>0||divInc>0||cgtGains>0||ltdProfit>0||savingsInt>0;
  if(!hasData){miEl('mi-result').innerHTML='<div style="text-align:center;padding:50px 20px;color:#8a909a"><div style="font-size:32px;margin-bottom:10px">🔀</div><div style="font-size:14px;font-weight:600;color:#4a5060;margin-bottom:5px">Enter your income sources</div><div style="font-size:12px">Add any combination of salary, self-employment, rental,<br>dividends, capital gains or Ltd company profit.</div></div>';return;}

  var penAmt=salary*(pension/100);
  var payeNet=Math.max(0,salary-penAmt);
  var totalNonDiv=payeNet+seProfit+rentProfit+savingsInt;
  var adjNet=totalNonDiv;

  // Income tax on non-div income
  var it=miIT(totalNonDiv,r);
  var niPAYE=miNI(payeNet,r);
  var niSE=miCl4(seProfit,r);
  var cl2=seProfit>6845?179.40:0;
  var bandUsed=Math.max(0,totalNonDiv-r.pa);

  // Dividend tax
  var divTax=miDivTax(divInc,bandUsed,r);

  // CGT
  var cgt=miCGT(cgtGains,cgtType,totalNonDiv,r);

  // Ltd company (if entered separately)
  var ltdCorpTax=0,ltdDivToDr=0,ltdDivTax=0,ltdDirIT=0,ltdDirNI=0;
  if(ltdProfit>0){
    var ltdTaxProfit=Math.max(0,ltdProfit-ltdSal);
    ltdCorpTax=miCT(ltdTaxProfit,r);
    var ltdRetained=Math.max(0,ltdTaxProfit-ltdCorpTax);
    ltdDivToDr=ltdRetained;
    ltdDirIT=miIT(ltdSal+totalNonDiv,r)-it;
    ltdDirNI=miNI(ltdSal,r);
    var ltdBandUsed=Math.max(0,ltdSal+totalNonDiv-r.pa);
    ltdDivTax=miDivTax(ltdDivToDr,ltdBandUsed,r);
  }

  var totalIT=it+divTax+ltdDirIT+ltdDivTax;
  var totalNI=niPAYE+niSE+cl2+ltdDirNI;
  var totalCorp=ltdCorpTax;
  var totalCGT=cgt;
  var totalTax=totalIT+totalNI+totalCorp+totalCGT+penAmt;

  var totalGross=salary+seProfit+rentProfit+divInc+savingsInt+(ltdSal>0?ltdSal:0)+(ltdDivToDr>0?ltdDivToDr:0);
  var takeHome=Math.max(0,totalGross-totalIT-totalNI-totalCorp-totalCGT-penAmt);
  var effRate=totalGross>0?(totalIT+totalNI+totalCorp+totalCGT)/totalGross:0;

  // Build output
  var html='';

  // Hero summary
  html+='<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:9px;margin-bottom:14px">';
  html+='<div style="background:#0f2744;border-radius:10px;padding:14px;grid-column:1/-1"><div style="font-size:10px;color:rgba(255,255,255,.5);font-weight:500;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px">Total take-home (all sources)</div><div style="font-size:26px;font-weight:700;color:#fff;font-family:monospace">'+miFmt(takeHome)+'</div><div style="font-size:11px;color:rgba(255,255,255,.4);margin-top:2px">'+miFmt(takeHome/12)+'/month &mdash; effective rate '+miPct(effRate)+'</div></div>';
  html+='<div style="background:#fff;border:1px solid #e0e3e8;border-radius:10px;padding:13px"><div style="font-size:10px;color:#8a909a;font-weight:500;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px">Total tax &amp; NI</div><div style="font-size:20px;font-weight:700;color:#1a1e28;font-family:monospace">'+miFmt(totalIT+totalNI)+'</div><div style="font-size:10px;color:#8a909a;margin-top:2px">Income tax + NI</div></div>';
  if(totalCorp>0){html+='<div style="background:#fff;border:1px solid #e0e3e8;border-radius:10px;padding:13px"><div style="font-size:10px;color:#8a909a;font-weight:500;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px">Corporation tax</div><div style="font-size:20px;font-weight:700;color:#1a1e28;font-family:monospace">'+miFmt(totalCorp)+'</div><div style="font-size:10px;color:#8a909a;margin-top:2px">On Ltd profit</div></div>';}
  if(totalCGT>0){html+='<div style="background:#fff;border:1px solid #e0e3e8;border-radius:10px;padding:13px"><div style="font-size:10px;color:#8a909a;font-weight:500;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px">Capital gains tax</div><div style="font-size:20px;font-weight:700;color:#1a1e28;font-family:monospace">'+miFmt(totalCGT)+'</div><div style="font-size:10px;color:#8a909a;margin-top:2px">After £'+r.cgt_exempt.toLocaleString('en-GB')+' exempt amount</div></div>';}
  html+='</div>';

  // Income breakdown
  html+='<div style="background:#fff;border:1px solid #e0e3e8;border-radius:10px;padding:14px 16px;margin-bottom:12px">';
  html+='<div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#8a909a;margin-bottom:10px">Full income &amp; tax breakdown</div>';
  var rows=[];
  if(salary>0){rows.push(['Employment salary',miFmt(salary),'']);if(penAmt>0)rows.push(['Pension sacrifice',miFmt(penAmt),'red']);}
  if(seProfit>0)rows.push(['Self-employed profit',miFmt(seProfit),'']);
  if(rentProfit>0)rows.push(['Rental profit',miFmt(rentProfit),'']);
  if(savingsInt>0)rows.push(['Savings interest',miFmt(savingsInt),'']);
  rows.push(['Personal allowance used',miFmt(Math.min(totalNonDiv,r.pa)),'green']);
  rows.push(['Income tax on earned income',miFmt(it),'red']);
  rows.push(['Employee/Class 4 NI',miFmt(niPAYE+niSE+cl2),'red']);
  if(divInc>0){rows.push(['Dividend income',miFmt(divInc),'']);rows.push(['Dividend allowance',miFmt(r.div_allow),'green']);rows.push(['Dividend tax',miFmt(divTax),'red']);}
  if(ltdProfit>0){rows.push(['Ltd company profit',miFmt(ltdProfit),'']);rows.push(['Corporation tax',miFmt(ltdCorpTax),'red']);rows.push(['Director salary (from Ltd)',miFmt(ltdSal),'']);rows.push(['Dividend from Ltd',miFmt(ltdDivToDr),'']);rows.push(['Dividend tax (Ltd)',miFmt(ltdDivTax),'red']);}
  if(cgtGains>0){rows.push(['Capital gains',miFmt(cgtGains),'']);rows.push(['CGT exempt amount',miFmt(r.cgt_exempt),'green']);rows.push(['Capital gains tax',miFmt(cgt),'red']);}
  for(var i=0;i<rows.length;i++){
    var rc=rows[i][2]==='red'?'#c0392b':rows[i][2]==='green'?'#1a7a4a':'#1a1e28';
    html+='<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #f5f6f8;font-size:12px"><span style="color:#4a5060">'+rows[i][0]+'</span><span style="font-family:monospace;font-weight:600;color:'+rc+'">'+rows[i][1]+'</span></div>';
  }
  html+='<div style="display:flex;justify-content:space-between;padding:8px 0 4px;font-size:12px;font-weight:700;border-top:1px solid #c8ccd2;margin-top:2px"><span>Net take-home (all sources)</span><span style="font-family:monospace;color:#1a7a4a">'+miFmt(takeHome)+'</span></div>';
  html+='</div>';

  // Visual income split bar
  var barItems=[];
  if(salary>0)barItems.push({l:'Salary',v:salary,c:'#0f2744'});
  if(seProfit>0)barItems.push({l:'Self-employed',v:seProfit,c:'#1e6fbf'});
  if(rentProfit>0)barItems.push({l:'Rental',v:rentProfit,c:'#1a7a4a'});
  if(divInc>0)barItems.push({l:'Dividends',v:divInc,c:'#b86800'});
  if(cgtGains>0)barItems.push({l:'Capital gains',v:cgtGains,c:'#6b21a8'});
  if(ltdDivToDr>0)barItems.push({l:'Ltd dividends',v:ltdDivToDr,c:'#c0392b'});
  if(barItems.length>1){
    var totalBar=barItems.reduce(function(s,x){return s+x.v;},0);
    html+='<div style="background:#fff;border:1px solid #e0e3e8;border-radius:10px;padding:13px 15px;margin-bottom:12px">';
    html+='<div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#8a909a;margin-bottom:9px">Income sources</div>';
    html+='<div style="height:8px;border-radius:99px;overflow:hidden;display:flex;gap:2px;margin-bottom:9px">';
    for(var b=0;b<barItems.length;b++){html+='<div style="width:'+Math.max(1,barItems[b].v/totalBar*100).toFixed(1)+'%;background:'+barItems[b].c+';border-radius:99px;transition:width .4s ease"></div>';}
    html+='</div><div style="display:flex;flex-wrap:wrap;gap:10px">';
    for(var b2=0;b2<barItems.length;b2++){html+='<div style="display:flex;align-items:center;gap:5px;font-size:11px;color:#4a5060"><div style="width:8px;height:8px;border-radius:50%;background:'+barItems[b2].c+'"></div>'+barItems[b2].l+' ('+miFmt(barItems[b2].v)+')</div>';}
    html+='</div></div>';
  }

  // Optimisation tips
  var tips=[];
  var totalIncome2=totalNonDiv+divInc;
  if(totalNonDiv>100000&&totalNonDiv<125140){tips.push({title:'60% marginal rate trap',desc:'Your income is between £100,000 and £125,140 where the Personal Allowance is withdrawn. Contributing '+miFmt(totalNonDiv-100000)+' to pension would bring adjusted net income to £100,000 and save approximately '+miFmt((totalNonDiv-100000)*0.40)+' in tax.'});}
  if(salary>50270&&seProfit===0&&ltdProfit===0){tips.push({title:'Consider pension contributions',desc:'Income above £50,270 is taxed at 40%. Each £1,000 contributed to pension saves £400 in income tax plus NI savings. Consider increasing pension contributions.'});}
  if(rentProfit>0&&salary>r.basic){tips.push({title:'Rental income and higher rate tax',desc:'Your rental profit is being taxed at 40% or above. Ensure you are claiming all allowable expenses including mortgage interest tax credit (20% of interest). Consider whether transferring the property or interest to a lower-earning spouse could reduce the overall tax bill.'});}
  if(cgtGains>3000&&cgtGains<10000&&totalNonDiv<r.basic){tips.push({title:'Capital gains &mdash; use your basic rate band',desc:'Some of your capital gains may fall within the basic rate band (18% for assets, 24% for property) rather than the higher rate. Timing disposals to maximise use of the basic rate band can save significant tax.'});}
  if(divInc>0&&salary>r.pa){tips.push({title:'Dividend allowance only £500',desc:'The dividend allowance is only £500 for '+r.yr+'. If your dividends exceed this, consider whether it would be tax-efficient to transfer some shares to a spouse or civil partner who uses less of their basic rate band.'});}

  if(tips.length>0){
    html+='<div style="background:#fff;border:1px solid #e0e3e8;border-radius:10px;padding:13px 15px;margin-bottom:12px">';
    html+='<div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#8a909a;margin-bottom:10px">Optimisation opportunities</div>';
    for(var t=0;t<tips.length;t++){
      html+='<div style="padding:9px 0;border-bottom:1px solid #f5f6f8;font-size:12px"><div style="font-weight:600;color:#1a7a4a;margin-bottom:3px">💡 '+tips[t].title+'</div><div style="color:#4a5060;line-height:1.5">'+tips[t].desc+'</div></div>';
    }
    html+='</div>';
  }

  html+='<div style="text-align:center;padding:6px 0"><a href="https://www.britvex.com/contact-us" target="_blank" style="display:inline-block;background:#0f2744;color:#fff;font-size:12px;font-weight:700;padding:10px 20px;border-radius:6px;text-decoration:none">Get a full tax optimisation review from Britvex &rarr;</a></div>';
  miEl('mi-result').innerHTML=html;
};
})();
