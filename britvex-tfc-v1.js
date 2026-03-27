(function(){
function tfcG(id){return parseFloat(document.getElementById(id).value)||0;}
function tfcGS(id){return document.getElementById(id).value;}
function tfcEl(id){return document.getElementById(id);}
function tfcFmt(v){return '\u00a3'+Math.max(0,Math.round(v)).toLocaleString('en-GB');}
function tfcFmtD(v){return '\u00a3'+(Math.max(0,v)).toLocaleString('en-GB',{minimumFractionDigits:2,maximumFractionDigits:2});}

window.tfcCalc=function(){
  var income1=tfcG('tfc-inc1'),income2=tfcG('tfc-inc2');
  var children=parseInt(tfcGS('tfc-children'))||0;
  var childcare=tfcG('tfc-cost');
  var hasDisabled=tfcGS('tfc-disabled')==='yes';
  var hasVouchers=tfcGS('tfc-vouchers')==='yes';
  var voucherAmt=hasVouchers?tfcG('tfc-voucheramt'):0;
  var empType1=tfcGS('tfc-emptype1'),empType2=tfcGS('tfc-emptype2');

  // Show/hide partner income
  var p2wrap=tfcEl('tfc-partner-wrap');
  if(p2wrap)p2wrap.style.display=tfcGS('tfc-couple')==='yes'?'block':'none';

  // Show/hide voucher amount
  var vwrap=tfcEl('tfc-voucher-wrap');
  if(vwrap)vwrap.style.display=hasVouchers?'block':'none';

  if(children===0||childcare===0){
    tfcEl('tfc-result').innerHTML='<div style="text-align:center;padding:50px 20px;color:#8a909a"><div style="font-size:32px;margin-bottom:10px">👶</div><div style="font-size:14px;font-weight:600;color:#4a5060;margin-bottom:5px">Enter your details</div><div style="font-size:12px">Enter number of children and annual childcare costs<br>to see your Tax-Free Childcare entitlement.</div></div>';
    return;
  }

  var isCouple=tfcGS('tfc-couple')==='yes';
  var totalIncome=income1+(isCouple?income2:0);

  // ELIGIBILITY CHECKS
  var eligible=true;
  var ineligibleReasons=[];

  // Each parent must earn at least minimum wage x 16 hours
  var minEarn=1922; // approx 16hrs x NMW annually (quarterly = 1922/4 = 480.50 per quarter)
  var maxIncome=100000;

  if(income1<minEarn){eligible=false;ineligibleReasons.push('You must earn at least £1,922 per year (equivalent to 16 hours per week at National Minimum Wage) to qualify.');}
  if(income1>maxIncome){eligible=false;ineligibleReasons.push('Your income exceeds £100,000. TFC is not available if either parent earns over £100,000 adjusted net income.');}
  if(isCouple&&income2>maxIncome){eligible=false;ineligibleReasons.push('Your partner\'s income exceeds £100,000. TFC is not available if either parent earns over £100,000.');}
  if(isCouple&&income2>0&&income2<minEarn){eligible=false;ineligibleReasons.push('Your partner must also earn at least £1,922 per year to qualify for TFC.');}

  // TFC calculation
  // Government adds 20p for every 80p paid in = 25% top-up on what you pay in
  // Max childcare per child per year: standard £10,000 (gov tops up £2,000), disabled £20,000 (gov tops up £4,000)
  var maxChildcarePerChild=hasDisabled?20000:10000;
  var maxGovTopUpPerChild=hasDisabled?4000:2000;
  var totalMaxChildcare=children*maxChildcarePerChild;
  var totalMaxTopUp=children*maxGovTopUpPerChild;

  // Actual childcare vs cap
  var eligibleChildcare=Math.min(childcare,totalMaxChildcare);
  var tfcTopUp=Math.min(eligibleChildcare*0.25,totalMaxTopUp); // you pay 80%, gov pays 20% (=25% of what you pay)
  var tfcSaving=tfcTopUp;
  var yourContrib=eligibleChildcare-tfcTopUp;

  // Employer childcare vouchers (legacy scheme - closed to new entrants April 2018)
  // Basic rate taxpayer: £55/week = £2,860/year exempt
  // Higher rate: £28/week = £1,456/year
  // Additional rate: £25/week = £1,300/year
  var voucherSaving=0;
  if(hasVouchers&&voucherAmt>0){
    var maxVoucher=income1>125140?1300:income1>50270?1456:2860;
    var eligible1Voucher=Math.min(voucherAmt,maxVoucher);
    var taxRate=income1>50270?0.40:0.20;
    var niRate=income1>50270?0.02:0.08;
    voucherSaving=eligible1Voucher*(taxRate+niRate);
    if(isCouple&&income2>0){
      var maxVoucher2=income2>125140?1300:income2>50270?1456:2860;
      var eligible2Voucher=Math.min(income2>0?voucherAmt/2:0,maxVoucher2);
      var taxRate2=income2>50270?0.40:0.20;
      var niRate2=income2>50270?0.02:0.08;
      voucherSaving+=eligible2Voucher*(taxRate2+niRate2);
    }
  }

  // UC childcare (85% of eligible costs up to cap)
  var ucMax1=1014.63*12,ucMax2=1739.37*12;
  var ucCap=children>=2?ucMax2:ucMax1;
  var ucSaving=Math.min(childcare,ucCap)*0.85;

  // 15/30 hours free childcare (England) - 3-4 year olds
  var freeHours=0;
  if(tfcGS('tfc-age')==='3to4'){
    var workingHours=isCouple||(empType1!=='unemp')?30:15;
    freeHours=workingHours;
  } else if(tfcGS('tfc-age')==='2'){
    freeHours=15;
  }
  var freeHoursValue=freeHours>0?freeHours*38*5.50:0; // 38 weeks, approx £5.50/hr avg

  // Best option
  var options=[
    {name:'Tax-Free Childcare',saving:tfcSaving,note:'20% top-up on childcare costs'},
    {name:'UC Childcare (85%)',saving:ucSaving,note:'Only if claiming Universal Credit'},
    {name:'Employer vouchers',saving:voucherSaving,note:'Legacy scheme — closed to new entrants'}
  ];
  var bestOption=options.reduce(function(a,b){return b.saving>a.saving?b:a;});

  var html='';

  // Eligibility banner
  if(!eligible){
    html+='<div style="background:#fdecea;border:1px solid #f5a9a3;border-radius:10px;padding:14px 16px;margin-bottom:14px">';
    html+='<div style="font-size:13px;font-weight:700;color:#c0392b;margin-bottom:8px">⚠️ You may not be eligible for Tax-Free Childcare</div>';
    for(var r=0;r<ineligibleReasons.length;r++){html+='<div style="font-size:12px;color:#c0392b;margin-bottom:4px;line-height:1.5">• '+ineligibleReasons[r]+'</div>';}
    html+='</div>';
  }

  // Summary cards
  html+='<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin-bottom:14px">';
  html+='<div style="background:#0f2744;border-radius:10px;padding:13px"><div style="font-size:10px;color:rgba(255,255,255,.5);font-weight:500;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px">TFC government top-up</div><div style="font-size:22px;font-weight:700;color:#fff;font-family:monospace">'+tfcFmt(tfcSaving)+'</div><div style="font-size:10px;color:rgba(255,255,255,.4);margin-top:2px">Per year &mdash; '+tfcFmt(tfcSaving/12)+'/month</div></div>';
  html+='<div style="background:#fff;border:1px solid #e0e3e8;border-radius:10px;padding:13px"><div style="font-size:10px;color:#8a909a;font-weight:500;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px">Your contribution</div><div style="font-size:22px;font-weight:700;color:#1a1e28;font-family:monospace">'+tfcFmt(yourContrib)+'</div><div style="font-size:10px;color:#8a909a;margin-top:2px">You pay, gov adds '+tfcFmt(tfcSaving)+'</div></div>';
  html+='<div style="background:#fff;border:1px solid #e0e3e8;border-radius:10px;padding:13px"><div style="font-size:10px;color:#8a909a;font-weight:500;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px">Max top-up available</div><div style="font-size:22px;font-weight:700;color:#1a1e28;font-family:monospace">'+tfcFmt(totalMaxTopUp)+'</div><div style="font-size:10px;color:#8a909a;margin-top:2px">'+children+' child'+(children>1?'ren':'')+' x '+tfcFmt(maxGovTopUpPerChild)+'</div></div>';
  html+='</div>';

  // How it works
  html+='<div style="background:#fff;border:1px solid #e0e3e8;border-radius:10px;padding:14px 16px;margin-bottom:12px">';
  html+='<div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#8a909a;margin-bottom:10px">How Tax-Free Childcare works</div>';
  var rows=[
    ['Annual childcare costs',tfcFmt(childcare),''],
    ['Eligible childcare (capped at '+tfcFmt(totalMaxChildcare)+')',tfcFmt(eligibleChildcare),''],
    ['You pay into TFC account (80%)',tfcFmt(yourContrib),''],
    ['Government adds (20% top-up)',tfcFmt(tfcSaving),'grn'],
    ['Total childcare covered',tfcFmt(eligibleChildcare),''],
  ];
  if(childcare>totalMaxChildcare){rows.push(['Remaining costs (above cap)',tfcFmt(childcare-totalMaxChildcare),'red']);}
  rows.push(['Your net saving vs paying direct',tfcFmt(tfcSaving),'grn']);
  for(var i=0;i<rows.length;i++){
    var rc=rows[i][2]==='grn'?'#1a7a4a':rows[i][2]==='red'?'#c0392b':'#1a1e28';
    html+='<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f5f6f8;font-size:12px"><span style="color:#4a5060">'+rows[i][0]+'</span><span style="font-family:monospace;font-weight:600;color:'+rc+'">'+rows[i][1]+'</span></div>';
  }
  html+='</div>';

  // Comparison of all options
  html+='<div style="background:#fff;border:1px solid #e0e3e8;border-radius:10px;padding:14px 16px;margin-bottom:12px">';
  html+='<div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#8a909a;margin-bottom:10px">Compare childcare support options</div>';
  html+='<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-bottom:10px">';
  for(var o=0;o<options.length;o++){
    var isBest=options[o].name===bestOption.name&&options[o].saving>0;
    var bg=isBest?'background:#d6f5e6;border-color:#8fd4b2':'background:#f5f6f8;border-color:#e0e3e8';
    var vc=isBest?'#1a7a4a':'#1a1e28';
    var lc=isBest?'#1a7a4a':'#8a909a';
    html+='<div style="'+bg+';border:1px solid;border-radius:8px;padding:11px 12px">';
    html+='<div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:'+lc+';margin-bottom:4px">'+options[o].name+(isBest?' ✅ Best':'')+'</div>';
    html+='<div style="font-size:18px;font-weight:700;font-family:monospace;color:'+vc+'">'+tfcFmt(options[o].saving)+'</div>';
    html+='<div style="font-size:10px;color:#8a909a;margin-top:2px">'+options[o].note+'</div>';
    html+='</div>';
  }
  html+='</div>';
  html+='<div style="background:#e8f0f7;border-radius:6px;padding:9px 12px;font-size:11px;color:#185FA5;line-height:1.5">You cannot use Tax-Free Childcare at the same time as Universal Credit childcare support or employer childcare vouchers. Choose the one that saves you most.</div>';
  html+='</div>';

  // Free hours
  if(freeHours>0){
    html+='<div style="background:#d6f5e6;border:1px solid #8fd4b2;border-radius:10px;padding:13px 15px;margin-bottom:12px">';
    html+='<div style="font-size:12px;font-weight:700;color:#1a7a4a;margin-bottom:5px">🎉 Free childcare hours available</div>';
    html+='<div style="font-size:12px;color:#1a7a4a;line-height:1.6">Your child\'s age qualifies for <strong>'+freeHours+' hours per week</strong> of free childcare in England (38 weeks/year). This is worth approximately <strong>'+tfcFmt(freeHoursValue)+'/year</strong> at average rates. Free hours can be used alongside Tax-Free Childcare for additional hours.</div>';
    html+='</div>';
  }

  // Alerts
  html+='<div style="background:#fff3d6;border:1px solid #f0c87a;border-radius:8px;padding:10px 13px;font-size:12px;color:#b86800;margin-bottom:10px;line-height:1.5">⚠️ <strong>TFC accounts:</strong> You must open a TFC account at <strong>childcarechoices.gov.uk</strong>. You pay in, and the government tops up automatically. The account is held with NS&I (National Savings). You must reconfirm eligibility every 3 months or your account will be suspended.</div>';
  if(income1>90000&&income1<=100000){html+='<div style="background:#fff3d6;border:1px solid #f0c87a;border-radius:8px;padding:10px 13px;font-size:12px;color:#b86800;margin-bottom:10px;line-height:1.5">⚠️ <strong>Income warning:</strong> You are close to the £100,000 limit. If your adjusted net income exceeds £100,000 you will lose TFC eligibility. Consider pension contributions to bring income below the threshold.</div>';}
  html+='<div style="text-align:center;padding:6px 0"><a href="https://www.britvex.com/contact-us" target="_blank" style="display:inline-block;background:#0f2744;color:#fff;font-size:12px;font-weight:700;padding:10px 20px;border-radius:6px;text-decoration:none">Get childcare tax advice from Britvex &rarr;</a></div>';

  tfcEl('tfc-result').innerHTML=html;
};

window.tfcTogglePartner=function(){
  var show=tfcGS('tfc-couple')==='yes';
  tfcEl('tfc-partner-wrap').style.display=show?'block':'none';
  tfcCalc();
};
window.tfcToggleVouchers=function(){
  tfcEl('tfc-voucher-wrap').style.display=tfcGS('tfc-vouchers')==='yes'?'block':'none';
  tfcCalc();
};
})();
