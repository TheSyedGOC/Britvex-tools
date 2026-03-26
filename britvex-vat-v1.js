
var vatCurrentMode='add';
var VATDATA={threshold:90000,frs_entry:150000,frs_exit:230000};

function vatG(id){return parseFloat(document.getElementById(id).value)||0;}
function vatGS(id){var el=document.getElementById(id);return el?el.value:'';}
function vatEl(id){return document.getElementById(id);}
function vatFmt(v){return '\u00a3'+Math.abs(v).toLocaleString('en-GB',{minimumFractionDigits:2,maximumFractionDigits:2});}
function vatFmtR(v){return v<0?'<span style="color:var(--bv-green)">Refund '+vatFmt(-v)+'</span>':'<span style="color:var(--bv-red)">Pay '+vatFmt(v)+'</span>';}

function vatMode(m){
  vatCurrentMode=m;
  ['add','rem','ret','frs','reg'].forEach(function(x){
    vatEl('vat-m-'+x).classList.toggle('bv-on',x===m);
    vatEl('vi-'+x).classList.toggle('bv-hidden',x!==m);
  });
  var titles={add:'Add VAT Calculator',rem:'Remove VAT Calculator',ret:'VAT Return Calculator',frs:'Flat Rate Scheme Calculator',reg:'VAT Registration Checker'};
  var subs={add:'Calculate gross amount from net &mdash; UK standard rate 20%',rem:'Extract net amount from gross (inc-VAT) price',ret:'Calculate VAT payable or reclaimable for your return',frs:'Compare flat rate vs standard VAT &mdash; which saves more?',reg:'Check if you need to register for VAT'};
  vatEl('vat-title').textContent=titles[m];
  vatEl('vat-sub').textContent=subs[m];
  vatCalc();
}

function vatCalc(){
  var m=vatCurrentMode,alerts='',result='';
  if(m==='add'){
    var net=vatG('va-net'),rate=parseFloat(vatGS('va-rate'))||20;
    var vatAmt=net*(rate/100),gross=net+vatAmt;
    if(net<=0){vatEl('vat-result').innerHTML='<div style="font-size:12px;color:var(--bv-text3);padding:20px 0">Enter a net amount to calculate.</div>';vatEl('vat-alerts').innerHTML='';return;}
    result+='<div class="bv-rgrid">';
    result+='<div class="bv-rc bv-pri"><div class="bv-rl">Gross (inc-VAT)</div><div class="bv-rv">'+vatFmt(gross)+'</div><div class="bv-rsub">Total to charge client</div></div>';
    result+='<div class="bv-rc"><div class="bv-rl">VAT amount</div><div class="bv-rv">'+vatFmt(vatAmt)+'</div><div class="bv-rsub">'+rate+'% of net</div></div>';
    result+='<div class="bv-rc"><div class="bv-rl">Net (ex-VAT)</div><div class="bv-rv">'+vatFmt(net)+'</div><div class="bv-rsub">Your revenue</div></div>';
    result+='</div>';
    result+=bvDC('VAT calculation breakdown',vatFmt(vatAmt),'background:var(--bv-blue-l);color:var(--bv-blue)',[
      ['Net amount (ex-VAT)',vatFmt(net)],['VAT rate',rate+'%'],['VAT amount',vatFmt(vatAmt),'amb'],['Gross amount (inc-VAT)',vatFmt(gross),''],
      ['Annual equivalent VAT (x12)',vatFmt(vatAmt*12),''],['Annual equivalent gross (x12)',vatFmt(gross*12),'']
    ],true);
    if(rate===20) alerts+=bvAlert('info','Standard rate 20% applies. If your customer is VAT-registered they can reclaim this VAT as input tax.');
  }
  else if(m==='rem'){
    var gross2=vatG('vr-gross'),rate2=parseFloat(vatGS('vr-rate'))||20;
    var vatAmt2=gross2*(rate2/(100+rate2)),net2=gross2-vatAmt2;
    if(gross2<=0){vatEl('vat-result').innerHTML='<div style="font-size:12px;color:var(--bv-text3);padding:20px 0">Enter a gross amount to calculate.</div>';vatEl('vat-alerts').innerHTML='';return;}
    result+='<div class="bv-rgrid">';
    result+='<div class="bv-rc bv-pri"><div class="bv-rl">Net (ex-VAT)</div><div class="bv-rv">'+vatFmt(net2)+'</div><div class="bv-rsub">Your revenue before VAT</div></div>';
    result+='<div class="bv-rc"><div class="bv-rl">VAT amount</div><div class="bv-rv">'+vatFmt(vatAmt2)+'</div><div class="bv-rsub">'+rate2+'% rate applied</div></div>';
    result+='<div class="bv-rc"><div class="bv-rl">Gross (inc-VAT)</div><div class="bv-rv">'+vatFmt(gross2)+'</div><div class="bv-rsub">Amount paid by customer</div></div>';
    result+='</div>';
    result+=bvDC('VAT extraction breakdown',vatFmt(vatAmt2),'background:var(--bv-blue-l);color:var(--bv-blue)',[
      ['Gross amount (inc-VAT)',vatFmt(gross2)],['VAT fraction used',rate2+'/(100+'+rate2+')'],['VAT element extracted',vatFmt(vatAmt2),'amb'],['Net amount (ex-VAT)',vatFmt(net2),''],
      ['Annual net equivalent (x12)',vatFmt(net2*12),''],['Annual VAT equivalent (x12)',vatFmt(vatAmt2*12),'']
    ],true);
  }
  else if(m==='ret'){
    var out=vatG('vt-out'),inp=vatG('vt-in'),sales=vatG('vt-sales'),purch=vatG('vt-purch');
    var net3=out-inp;
    if(out===0&&inp===0){vatEl('vat-result').innerHTML='<div style="font-size:12px;color:var(--bv-text3);padding:20px 0">Enter VAT return figures to calculate.</div>';vatEl('vat-alerts').innerHTML='';return;}
    var period=vatGS('vt-period'),pLabel=period==='q'?'Quarterly':period==='m'?'Monthly':'Annual';
    result+='<div class="bv-rgrid">';
    result+='<div class="bv-rc '+(net3>=0?'bv-pri':'bv-grn')+'"><div class="bv-rl">'+(net3>=0?'VAT payable to HMRC':'VAT refund from HMRC')+'</div><div class="bv-rv">'+vatFmt(Math.abs(net3))+'</div><div class="bv-rsub">'+pLabel+' return</div></div>';
    result+='<div class="bv-rc"><div class="bv-rl">Box 1 &mdash; Output VAT</div><div class="bv-rv">'+vatFmt(out)+'</div><div class="bv-rsub">VAT charged on sales</div></div>';
    result+='<div class="bv-rc"><div class="bv-rl">Box 4 &mdash; Input VAT</div><div class="bv-rv">'+vatFmt(inp)+'</div><div class="bv-rsub">VAT reclaimed on purchases</div></div>';
    result+='</div>';
    var retRows=[['Box 1 &mdash; VAT on sales (output)',vatFmt(out)],['Box 4 &mdash; VAT on purchases (input)','&minus; '+vatFmt(inp)],['Net VAT '+( net3>=0?'payable':'refund'),vatFmt(Math.abs(net3)),net3>=0?'red':'grn']];
    if(sales>0)retRows.push(['Box 6 &mdash; Total sales (ex-VAT)',vatFmt(sales)]);
    if(purch>0)retRows.push(['Box 7 &mdash; Total purchases (ex-VAT)',vatFmt(purch)]);
    if(sales>0&&out>0)retRows.push(['Effective output rate',(out/sales*100).toFixed(1)+'%']);
    result+=bvDC('VAT return summary',net3>=0?'Pay '+vatFmt(net3):'Refund '+vatFmt(-net3),(net3>=0?'background:var(--bv-red-l);color:var(--bv-red)':'background:var(--bv-green-l);color:var(--bv-green)'),retRows,true);
    if(net3>=0) alerts+=bvAlert('warn','Payment due to HMRC &mdash; 1 month and 7 days after the end of your VAT period. Late payment attracts penalties and interest under the new HMRC points-based system.');
    else alerts+=bvAlert('success','You are due a VAT refund. HMRC aims to process refunds within 30 days of receiving your return.');
    alerts+=bvAlert('info','Under Making Tax Digital (MTD), VAT returns must be submitted via MTD-compatible software. Manual submissions via HMRC online are no longer accepted for most businesses.');
  }
  else if(m==='frs'){
    var turn3=vatG('vf-turn'),sectorEl=vatGS('vf-sector');
    var frsRate=sectorEl==='custom'?vatG('vf-custom'):parseFloat(sectorEl)||12;
    var firstYr=vatGS('vf-firstyr')==='yes';
    var effectiveRate=firstYr?Math.max(0,frsRate-1):frsRate;
    var vatEl2=document.getElementById('vf-custom-wrap');
    if(vatEl2)vatEl2.style.display=sectorEl==='custom'?'block':'none';
    var inputVAT=vatG('vf-input');
    if(turn3<=0){vatEl('vat-result').innerHTML='<div style="font-size:12px;color:var(--bv-text3);padding:20px 0">Enter your gross turnover to calculate.</div>';vatEl('vat-alerts').innerHTML='';return;}
    var netTurn=turn3/1.20;
    var stdVAT=netTurn*0.20-inputVAT;
    var frsPay=turn3*(effectiveRate/100);
    var saving=stdVAT-frsPay;
    var winner=saving>0?'frs':'std';
    result+='<div class="bv-frs-grid">';
    result+='<div class="bv-frs-card '+(winner==='frs'?'bv-winner':'')+'"><div class="bv-frs-lbl">Flat rate scheme '+(winner==='frs'?'&#9989; Better':'')+'</div><div class="bv-frs-val">'+vatFmt(frsPay)+'</div><div class="bv-frs-sub">'+(firstYr?'Rate: '+frsRate+'% &minus; 1% = '+effectiveRate+'%':'Rate: '+effectiveRate+'%')+'</div></div>';
    result+='<div class="bv-frs-card '+(winner==='std'?'bv-winner':'')+'"><div class="bv-frs-lbl">Standard scheme '+(winner==='std'?'&#9989; Better':'')+'</div><div class="bv-frs-val">'+vatFmt(stdVAT)+'</div><div class="bv-frs-sub">Output &minus; input VAT reclaimed</div></div>';
    result+='</div>';
    result+='<div class="bv-rgrid" style="grid-template-columns:1fr 1fr 1fr">';
    result+='<div class="bv-rc '+(saving>0?'bv-grn':'bv-pri')+'"><div class="bv-rl">'+(saving>0?'FRS saves you':'Standard saves you')+'</div><div class="bv-rv">'+vatFmt(Math.abs(saving))+'</div><div class="bv-rsub">Per year</div></div>';
    result+='<div class="bv-rc"><div class="bv-rl">FRS rate applied</div><div class="bv-rv">'+effectiveRate+'%</div><div class="bv-rsub">'+(firstYr?'First year discount':'Standard sector rate')+'</div></div>';
    result+='<div class="bv-rc"><div class="bv-rl">Gross turnover</div><div class="bv-rv">'+vatFmt(turn3)+'</div><div class="bv-rsub">Inc-VAT, annual</div></div>';
    result+='</div>';
    result+=bvDC('Flat rate vs standard comparison',saving>0?'FRS saves '+vatFmt(saving):'Standard saves '+vatFmt(-saving),(saving>0?'background:var(--bv-green-l);color:var(--bv-green)':'background:var(--bv-blue-l);color:var(--bv-blue)'),[
      ['Gross turnover (inc-VAT)',vatFmt(turn3)],['Net turnover (ex-VAT)',vatFmt(netTurn)],['FRS rate',effectiveRate+'%'],['FRS VAT payable',vatFmt(frsPay),'amb'],
      ['Output VAT (standard)',vatFmt(netTurn*0.20)],['Input VAT reclaimable',inputVAT>0?'&minus; '+vatFmt(inputVAT):'None claimed'],['Standard VAT payable',vatFmt(stdVAT),'amb'],
      ['Annual saving ('+( saving>0?'use FRS':'use standard')+')',vatFmt(Math.abs(saving)),saving>0?'grn':'red']
    ],true);
    if(turn3>VATDATA.frs_exit) alerts+=bvAlert('warn','Your turnover exceeds the FRS exit threshold of &pound;230,000. You must leave the flat rate scheme.');
    else if(saving<0) alerts+=bvAlert('info','Standard VAT accounting is more beneficial for your business. This is common when you have significant VATable purchases or high input VAT.');
    else alerts+=bvAlert('success','The flat rate scheme saves &pound;'+vatFmt(saving)+' per year based on these figures. You keep the difference between the VAT you charge (20%) and the flat rate you pay to HMRC.');
    if(firstYr) alerts+=bvAlert('info','First year 1% discount applies. This is available in the first year of VAT registration only.');
    alerts+=bvAlert('info','Limited cost businesses (spending less than 2% of turnover or less than &pound;1,000 per year on goods) must use the 16.5% limited cost trader rate.');
  }
  else if(m==='reg'){
    var turn4=vatG('vg-turn'),next4=vatG('vg-next'),btype=vatGS('vg-type');
    if(turn4<=0&&next4<=0){vatEl('vat-result').innerHTML='<div style="font-size:12px;color:var(--bv-text3);padding:20px 0">Enter your turnover figures to check registration status.</div>';vatEl('vat-alerts').innerHTML='';return;}
    var mustReg=turn4>VATDATA.threshold||next4>VATDATA.threshold;
    var nearThreshold=!mustReg&&turn4>VATDATA.threshold*0.85;
    var headroom=mustReg?0:VATDATA.threshold-turn4;
    result+='<div class="bv-rgrid">';
    result+='<div class="bv-rc '+(mustReg?'bv-pri':'bv-grn')+'"><div class="bv-rl">Registration status</div><div class="bv-rv" style="font-size:16px;">'+(mustReg?'Must register':'Not required')+'</div><div class="bv-rsub">'+(mustReg?'Immediate action needed':'Based on current figures')+'</div></div>';
    result+='<div class="bv-rc"><div class="bv-rl">VAT threshold</div><div class="bv-rv">&pound;90,000</div><div class="bv-rsub">Rolling 12-month taxable turnover</div></div>';
    result+='<div class="bv-rc"><div class="bv-rl">'+(mustReg?'Exceeded by':'Headroom remaining')+'</div><div class="bv-rv">'+vatFmt(Math.abs(turn4-VATDATA.threshold))+'</div><div class="bv-rsub">'+(mustReg?'Register within 30 days':'Before mandatory registration')+'</div></div>';
    result+='</div>';
    result+=bvDC('Registration check',(mustReg?'Register now':'Below threshold'),(mustReg?'background:var(--bv-red-l);color:var(--bv-red)':'background:var(--bv-green-l);color:var(--bv-green)'),[
      ['Rolling 12-month turnover',vatFmt(turn4)],['VAT registration threshold',vatFmt(VATDATA.threshold)],['Next 30 days expected',vatFmt(next4)],
      ['Mandatory registration',mustReg?'Yes &mdash; register within 30 days':'No &mdash; not yet required'],['Deregistration threshold','&pound;88,000 (can deregister below this)'],
      ['MTD applies from','First VAT return after registration'],['Voluntary registration','Available below threshold &mdash; beneficial if customers are VAT-registered']
    ],false);
    if(mustReg){alerts+=bvAlert('danger','You must register for VAT within 30 days of exceeding the &pound;90,000 threshold. Failure to register on time results in a penalty calculated as a percentage of VAT owed from the date you should have registered.');}
    else if(nearThreshold){alerts+=bvAlert('warn','You are approaching the VAT threshold. At your current growth rate you may need to register soon. Consider voluntary registration now if your customers are VAT-registered businesses &mdash; you can then reclaim input VAT on your purchases.');}
    else{alerts+=bvAlert('success','Your turnover is below the VAT registration threshold of &pound;90,000. No action required unless you expect turnover to exceed the threshold in the next 30 days.');}
    if(btype==='zero') alerts+=bvAlert('info','If your supplies are mainly zero-rated, voluntary registration may allow you to reclaim input VAT on purchases even though you charge 0% on sales &mdash; potentially resulting in regular refunds from HMRC.');
    if(btype==='exempt') alerts+=bvAlert('info','Exempt supplies do not count towards the VAT registration threshold. However, you cannot reclaim input VAT on costs related to exempt activities.');
  }
  vatEl('vat-alerts').innerHTML=alerts;
  vatEl('vat-result').innerHTML=result;
}

function bvDC(title,badge,bstyle,rows,showTotRow){
  var h='<div class="bv-bdc"><div class="bv-bdtitle">'+title+' <span class="bv-badge" style="'+bstyle+'">'+badge+'</span></div>';
  for(var i=0;i<rows.length;i++){var cls=rows[i][2]?' class="bv-val '+rows[i][2]+'"':' class="bv-val"';h+='<div class="bv-row"><span class="bv-key">'+rows[i][0]+'</span><span'+cls+'>'+rows[i][1]+'</span></div>';}
  return h+'</div>';
}
function bvAlert(type,msg){return '<div class="bv-alert '+type+'"><span class="bv-alert-icon">'+(type==='warn'?'&#9888;':type==='danger'?'&#128683;':type==='success'?'&#9989;':'&#8505;')+'</span><div>'+msg+'</div></div>';}

document.getElementById('vf-sector').addEventListener('change',function(){document.getElementById('vf-custom-wrap').style.display=this.value==='custom'?'block':'none';vatCalc();});

vatCalc();
