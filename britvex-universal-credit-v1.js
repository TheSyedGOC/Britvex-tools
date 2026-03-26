(function(){
function ucG(id){return parseFloat(document.getElementById(id).value)||0;}
function ucGS(id){return document.getElementById(id).value;}
function ucEl(id){return document.getElementById(id);}
function ucFmt(v){return '\u00a3'+Math.max(0,Math.round(v)).toLocaleString('en-GB');}

// 2025/26 UC rates (monthly)
var UC={
  std_single:311.68,
  std_couple:489.23,
  child_first:333.33,
  child_additional:287.92,
  child_disabled:156.11,
  child_severely_disabled:487.58,
  lcw:156.11,
  lcwra:416.19,
  childcare_max_1:1014.63,
  childcare_max_2:1739.37,
  childcare_pct:0.85,
  work_allow_higher:673,
  work_allow_lower:404,
  taper:0.55,
  savings_lower:6000,
  savings_upper:16000,
  savings_tariff:4.35
};

function ucCalc(){
  var income=ucG('uc-income'),partner=ucG('uc-partner');
  var emptype=ucGS('uc-emptype'),savings=ucG('uc-savings');
  var rent=ucG('uc-rent'),housing=ucGS('uc-housing');
  var children=parseInt(ucGS('uc-children'))||0;
  var firstborn=ucGS('uc-firstborn')==='yes';
  var childcare=ucG('uc-childcare'),disabled=ucGS('uc-disabled')==='yes';
  var lcwra=ucGS('uc-lcwra');

  // Savings tariff income
  var savingsIncome=0;
  if(savings>UC.savings_upper){ucEl('uc-result').innerHTML='<div class="bv-alert info" style="margin:0"><span style="font-size:16px">ℹ️</span><div>Savings above £16,000 mean you are not eligible for Universal Credit.</div></div>';return;}
  if(savings>UC.savings_lower)savingsIncome=Math.floor((savings-UC.savings_lower)/250)*UC.savings_tariff;

  var totalIncome=income+partner+savingsIncome;

  // Maximum UC (standard allowance + elements)
  var stdAllowance=partner>0?UC.std_couple:UC.std_single;

  // Child elements
  var childElement=0;
  if(children>=1){
    childElement+=firstborn?UC.child_first:UC.child_additional;
    if(children>=2)childElement+=UC.child_additional*(children-1);
    if(disabled)childElement+=UC.child_disabled;
  }

  // Childcare element (85% of eligible costs up to cap)
  var childcareElement=0;
  if(childcare>0&&children>0&&(income>0||partner>0)){
    var maxCC=children>=2?UC.childcare_max_2:UC.childcare_max_1;
    childcareElement=Math.min(childcare,maxCC)*UC.childcare_pct;
  }

  // Housing cost element
  var housingElement=housing==='own'?0:Math.min(rent,rent);

  // Disability / health elements
  var healthElement=lcwra==='lcwra'?UC.lcwra:lcwra==='lcw'?UC.lcw:0;

  var maxUC=stdAllowance+childElement+childcareElement+housingElement+healthElement;

  // Work allowance (if children or disability)
  var hasWorkAllowance=children>0||lcwra!=='no';
  var workAllow=hasWorkAllowance?(housingElement>0?UC.work_allow_lower:UC.work_allow_higher):0;

  // Taper
  var earnedAboveWA=Math.max(0,income+partner-workAllow);
  var taper=earnedAboveWA*UC.taper;

  var estimatedUC=Math.max(0,maxUC-taper);

  // TFC comparison
  var tfcSaving=children>0?Math.min(childcare*12,children>=2?8000:2000)/12:0;
  var ucChildcareSaving=childcareElement;
  var betterOption=ucChildcareSaving>tfcSaving?'uc':'tfc';

  var html='';

  // Summary cards
  html+='<div class="bv-sgrid">';
  html+='<div class="bv-sc bv-pri"><div class="bv-slbl">Estimated monthly UC</div><div class="bv-sval">'+ucFmt(estimatedUC)+'</div><div class="bv-ssub">'+ucFmt(estimatedUC*12)+' per year</div></div>';
  html+='<div class="bv-sc"><div class="bv-slbl">Maximum entitlement</div><div class="bv-sval">'+ucFmt(maxUC)+'</div><div class="bv-ssub">Before taper applied</div></div>';
  html+='<div class="bv-sc"><div class="bv-slbl">Income taper (55%)</div><div class="bv-sval">'+ucFmt(taper)+'</div><div class="bv-ssub">Reduction from earned income</div></div>';
  html+='</div>';

  // Breakdown
  html+='<div class="bv-bdc"><div class="bv-bdtitle">UC calculation breakdown <span class="bv-badge" style="background:var(--bv-green-l);color:var(--bv-green)">Monthly</span></div>';
  html+='<div class="bv-row"><span class="bv-rk">Standard allowance ('+(partner>0?'couple':'single')+')</span><span class="bv-rv">'+ucFmt(stdAllowance)+'</span></div>';
  if(childElement>0)html+='<div class="bv-row"><span class="bv-rk">Child element ('+children+' child'+(children>1?'ren':'')+')</span><span class="bv-rv">'+ucFmt(childElement)+'</span></div>';
  if(childcareElement>0)html+='<div class="bv-row"><span class="bv-rk">Childcare element (85% of £'+ucFmt(childcare)+')</span><span class="bv-rv grn">'+ucFmt(childcareElement)+'</span></div>';
  if(housingElement>0)html+='<div class="bv-row"><span class="bv-rk">Housing cost element</span><span class="bv-rv">'+ucFmt(housingElement)+'</span></div>';
  if(healthElement>0)html+='<div class="bv-row"><span class="bv-rk">Health / disability element</span><span class="bv-rv">'+ucFmt(healthElement)+'</span></div>';
  html+='<div class="bv-row"><span class="bv-rk"><strong>Maximum UC</strong></span><span class="bv-rv"><strong>'+ucFmt(maxUC)+'</strong></span></div>';
  if(workAllow>0)html+='<div class="bv-row"><span class="bv-rk">Work allowance (earnings ignored)</span><span class="bv-rv grn">'+ucFmt(workAllow)+'</span></div>';
  html+='<div class="bv-row"><span class="bv-rk">Earnings above work allowance</span><span class="bv-rv">'+ucFmt(earnedAboveWA)+'</span></div>';
  html+='<div class="bv-row"><span class="bv-rk">Taper deduction (55%)</span><span class="bv-rv red">-'+ucFmt(taper)+'</span></div>';
  if(savingsIncome>0)html+='<div class="bv-row"><span class="bv-rk">Tariff income from savings</span><span class="bv-rv red">-'+ucFmt(savingsIncome)+'</span></div>';
  html+='<div class="bv-row"><span class="bv-rk"><strong>Estimated UC award</strong></span><span class="bv-rv grn"><strong>'+ucFmt(estimatedUC)+'</strong></span></div>';
  html+='</div>';

  // Childcare comparison
  if(childcare>0&&children>0){
    html+='<div class="bv-cmp">';
    html+='<div class="bv-cmp-card '+(betterOption==='uc'?'bv-winner':'')+'"><div class="bv-cmp-lbl">UC Childcare (85%) '+(betterOption==='uc'?'✅ Better':'')+'</div><div class="bv-cmp-val">'+ucFmt(ucChildcareSaving)+'</div><div class="bv-cmp-sub">/month &mdash; claimed via UC</div></div>';
    html+='<div class="bv-cmp-card '+(betterOption==='tfc'?'bv-winner':'')+'"><div class="bv-cmp-lbl">Tax-Free Childcare (20%) '+(betterOption==='tfc'?'✅ Better':'')+'</div><div class="bv-cmp-val">'+ucFmt(tfcSaving)+'</div><div class="bv-cmp-sub">/month &mdash; government top-up</div></div>';
    html+='</div>';
    html+='<div class="bv-alert info"><span style="font-size:16px">ℹ️</span><div>You cannot use both UC childcare and Tax-Free Childcare at the same time. Based on your figures, <strong>'+(betterOption==='uc'?'UC childcare support':'Tax-Free Childcare')+' is worth more</strong>. Speak to a benefits adviser before switching.</div></div>';
  }

  // Alerts
  if(estimatedUC<=0){
    html+='<div class="bv-alert warn"><span style="font-size:16px">⚠️</span><div>Based on these figures, your income is too high for a UC award. The 55p taper has reduced the payment to zero. You may still be entitled to other benefits such as Tax-Free Childcare or Council Tax Reduction.</div></div>';
  }
  if(emptype==='se'){
    html+='<div class="bv-alert warn"><span style="font-size:16px">⚠️</span><div><strong>Self-employed:</strong> DWP applies a Minimum Income Floor (MIF) after your first year of self-employment. This assumes you earn at least the equivalent of minimum wage x your expected hours, even if your actual earnings are lower. This can significantly reduce your UC.</div></div>';
  }
  if(savings>UC.savings_lower){
    html+='<div class="bv-alert warn"><span style="font-size:16px">⚠️</span><div>Savings between £6,000 and £16,000 reduce your UC by £'+UC.savings_tariff.toFixed(2)+' per £250 over £6,000. Your tariff income is '+ucFmt(savingsIncome)+'/month.</div></div>';
  }
  html+='<div class="bv-alert info"><span style="font-size:16px">ℹ️</span><div>UC is paid monthly in arrears. Your first payment usually arrives 5 weeks after your claim date. You can request an advance payment. Report any change in income or circumstances to DWP promptly.</div></div>';
  html+='<div style="text-align:center;padding:6px 0"><a href="https://www.britvex.com/contact-us" target="_blank" class="bv-cta">Get financial planning advice from Britvex &rarr;</a></div>';

  ucEl('uc-result').innerHTML=html;
}
window.ucCalc=ucCalc;
})();
