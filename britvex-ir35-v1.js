(function(){
var ir35State={
  control:null,substitution:null,mol:null,equipment:null,
  financial_risk:null,exclusive:null,integration:null,
  correction:null,sick_holiday:null,contract_len:null
};

function ir35G(id){return parseFloat(document.getElementById(id).value)||0;}
function ir35GS(id){var el=document.getElementById(id);return el?el.value:'';}
function ir35El(id){return document.getElementById(id);}
function ir35Fmt(v){return '\u00a3'+Math.max(0,Math.round(v)).toLocaleString('en-GB');}

window.ir35SetQ=function(factor,val,btn){
  ir35State[factor]=val;
  var btns=document.querySelectorAll('[data-factor="'+factor+'"]');
  btns.forEach(function(b){b.classList.remove('bv-sel');});
  btn.classList.add('bv-sel');
  ir35Assess();
};

function ir35Assess(){
  var s=ir35State;
  var answered=0,total=10;
  var outsidePoints=0,insidePoints=0,unknownPoints=0;

  var factors=[
    {key:'control',weight:20,outside:'no',inside:'yes',label:'Right of control',
     outside_text:'You control how, when and where you work',
     inside_text:'Client controls how, when and where you work'},
    {key:'substitution',weight:15,outside:'yes',inside:'no',label:'Right of substitution',
     outside_text:'You can send a substitute to do the work',
     inside_text:'You must personally carry out the work'},
    {key:'mol',weight:20,outside:'no',inside:'yes',label:'Mutuality of obligation',
     outside_text:'No obligation to offer or accept further work',
     inside_text:'Client must offer work, you must accept it'},
    {key:'equipment',weight:10,outside:'own',inside:'client',label:'Equipment and tools',
     outside_text:'You provide your own significant equipment',
     inside_text:'Client provides all equipment and tools'},
    {key:'financial_risk',weight:15,outside:'yes',inside:'no',label:'Financial risk',
     outside_text:'You bear real financial risk if work is unsatisfactory',
     inside_text:'No financial risk beyond losing the contract'},
    {key:'exclusive',weight:10,outside:'no',inside:'yes',label:'Exclusivity',
     outside_text:'You work for multiple clients simultaneously',
     inside_text:'You work exclusively for this one client'},
    {key:'integration',weight:10,outside:'no',inside:'yes',label:'Integration into client',
     outside_text:'You are clearly separate from the client business',
     inside_text:'You are integrated into client teams and processes'},
    {key:'correction',weight:5,outside:'own',inside:'paid',label:'Correcting mistakes',
     outside_text:'You fix mistakes at your own time and expense',
     inside_text:'Client pays you to correct any errors'},
    {key:'sick_holiday',weight:5,outside:'no',inside:'yes',label:'Sick pay and holiday',
     outside_text:'No sick pay or holiday pay from client',
     inside_text:'You receive sick pay or holiday pay from client'},
    {key:'contract_len',weight:5,outside:'short',inside:'long',label:'Contract length and continuity',
     outside_text:'Short fixed-term contracts, clear end dates',
     inside_text:'Long ongoing engagement, renewed repeatedly'}
  ];

  var weightAnswered=0,weightOutside=0,weightInside=0;

  for(var i=0;i<factors.length;i++){
    var f=factors[i];
    if(s[f.key]!==null){
      answered++;
      weightAnswered+=f.weight;
      if(s[f.key]===f.outside){weightOutside+=f.weight;}
      else if(s[f.key]===f.inside){weightInside+=f.weight;}
    }
  }

  if(answered<3){
    ir35El('ir35-result').innerHTML='<div style="text-align:center;padding:30px 20px;color:#8a909a"><div style="font-size:28px;margin-bottom:8px">📋</div><div style="font-size:13px;font-weight:600;color:#4a5060;margin-bottom:4px">Answer the questions</div><div style="font-size:12px">Answer at least 3 questions to see your IR35 status assessment.</div></div>';
    return;
  }

  var outsidePct=weightAnswered>0?weightOutside/weightAnswered*100:0;
  var insidePct=weightAnswered>0?weightInside/weightAnswered*100:0;
  var verdict='',verdictClass='',verdictIcon='';

  if(outsidePct>=70){verdict='Likely Outside IR35';verdictClass='outside';verdictIcon='✅';}
  else if(insidePct>=70){verdict='Likely Inside IR35';verdictClass='inside';verdictIcon='⚠️';}
  else if(outsidePct>=50){verdict='Probably Outside IR35';verdictClass='probably-out';verdictIcon='🔍';}
  else{verdict='Borderline &mdash; Seek Advice';verdictClass='borderline';verdictIcon='⚖️';}

  var contract=ir35G('ir35-rate'),wks=ir35G('ir35-weeks')||46;
  var annualContract=contract*wks*5;
  var ir35IT=0,ir35NI=0,ir35TH=0,outsideIT=0,outsideNI=0,outsideTH=0;
  var r={pa:12570,basic:50270,higher:125140,ni_pt:12570,ni_uel:50270};

  if(annualContract>0){
    var deemed=annualContract*0.95;
    ir35IT=calcIT(deemed,r);ir35NI=calcNI(deemed,r);ir35TH=deemed-ir35IT-ir35NI;
    var profit=Math.max(0,annualContract-5000);
    var ltdSal=r.pa,ltdProfit=Math.max(0,profit-ltdSal);
    var ct=ltdProfit*0.19,divPot=ltdProfit-ct;
    var dirIT=calcIT(ltdSal,r),dirNI=calcNI(ltdSal,r);
    var divTax=calcDivTax(divPot,Math.max(0,ltdSal-r.pa));
    outsideTH=ltdSal-dirIT-dirNI+divPot-divTax;
    outsideIT=dirIT+divTax;outsideNI=dirNI;
  }

  var html='';

  // Verdict banner
  var bgCol=verdictClass==='outside'||verdictClass==='probably-out'?'#1a7a4a':verdictClass==='inside'?'#c0392b':'#b86800';
  html+='<div style="background:'+bgCol+';border-radius:10px;padding:18px 20px;color:#fff;margin-bottom:14px">';
  html+='<div style="font-size:13px;opacity:.7;margin-bottom:4px">IR35 Status Assessment</div>';
  html+='<div style="font-size:20px;font-weight:700;margin-bottom:6px">'+verdictIcon+' '+verdict+'</div>';
  html+='<div style="font-size:12px;opacity:.75;line-height:1.5">Based on '+answered+' of 10 factors answered. '+(answered<10?'Answer remaining questions for a more accurate assessment.':'All 10 factors assessed.')+'</div>';
  html+='</div>';

  // Score bar
  html+='<div style="background:#fff;border:1px solid #e0e3e8;border-radius:10px;padding:14px 16px;margin-bottom:12px">';
  html+='<div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#8a909a;margin-bottom:10px">Factor weight analysis</div>';
  html+='<div style="display:flex;height:10px;border-radius:99px;overflow:hidden;margin-bottom:8px;background:#f5f6f8">';
  html+='<div style="width:'+outsidePct.toFixed(1)+'%;background:#1a7a4a;transition:width .5s ease"></div>';
  html+='<div style="width:'+insidePct.toFixed(1)+'%;background:#c0392b;transition:width .5s ease"></div>';
  html+='</div>';
  html+='<div style="display:flex;justify-content:space-between;font-size:12px"><span style="color:#1a7a4a;font-weight:600">Outside '+outsidePct.toFixed(0)+'%</span><span style="color:#c0392b;font-weight:600">Inside '+insidePct.toFixed(0)+'%</span></div>';
  html+='</div>';

  // Factor breakdown
  html+='<div style="background:#fff;border:1px solid #e0e3e8;border-radius:10px;padding:14px 16px;margin-bottom:12px">';
  html+='<div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#8a909a;margin-bottom:10px">Your answers by factor</div>';
  for(var j=0;j<factors.length;j++){
    var f2=factors[j];
    if(ir35State[f2.key]===null)continue;
    var isOutside=ir35State[f2.key]===f2.outside;
    var fc=isOutside?'#1a7a4a':'#c0392b';
    var fb=isOutside?'#d6f5e6':'#fdecea';
    html+='<div style="display:flex;align-items:flex-start;gap:10px;padding:7px 0;border-bottom:1px solid #f5f6f8;font-size:12px">';
    html+='<div style="width:8px;height:8px;border-radius:50%;background:'+fc+';flex-shrink:0;margin-top:4px"></div>';
    html+='<div style="flex:1"><div style="font-weight:600;color:#1a1e28;margin-bottom:1px">'+f2.label+'</div>';
    html+='<div style="color:#4a5060">'+(isOutside?f2.outside_text:f2.inside_text)+'</div></div>';
    html+='<span style="font-size:10px;font-weight:600;padding:2px 7px;border-radius:99px;background:'+fb+';color:'+fc+';white-space:nowrap">'+(isOutside?'Outside':'Inside')+'</span>';
    html+='</div>';
  }
  html+='</div>';

  // Financial comparison
  if(annualContract>0){
    html+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">';
    html+='<div style="background:#fdecea;border:1px solid #f5a9a3;border-radius:10px;padding:14px">';
    html+='<div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:#c0392b;margin-bottom:5px">Inside IR35 take-home</div>';
    html+='<div style="font-size:22px;font-weight:700;font-family:monospace;color:#c0392b">'+ir35Fmt(ir35TH)+'</div>';
    html+='<div style="font-size:10px;color:#c0392b;opacity:.7;margin-top:2px">'+ir35Fmt(ir35TH/12)+'/month &mdash; deemed employee</div></div>';
    html+='<div style="background:#d6f5e6;border:1px solid #8fd4b2;border-radius:10px;padding:14px">';
    html+='<div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:#1a7a4a;margin-bottom:5px">Outside IR35 take-home</div>';
    html+='<div style="font-size:22px;font-weight:700;font-family:monospace;color:#1a7a4a">'+ir35Fmt(outsideTH)+'</div>';
    html+='<div style="font-size:10px;color:#1a7a4a;opacity:.7;margin-top:2px">'+ir35Fmt(outsideTH/12)+'/month &mdash; via Ltd company</div></div>';
    html+='</div>';
    html+='<div style="background:#0f2744;border-radius:10px;padding:14px 16px;margin-bottom:12px;color:#fff">';
    html+='<div style="font-size:12px;font-weight:600;margin-bottom:4px">Annual difference: '+ir35Fmt(Math.abs(outsideTH-ir35TH))+'</div>';
    html+='<div style="font-size:11px;color:rgba(255,255,255,.65)">Operating outside IR35 via Ltd company would generate approximately '+ir35Fmt(Math.abs(outsideTH-ir35TH))+' more per year based on a day rate of '+ir35Fmt(contract)+' for '+wks+' weeks.</div>';
    html+='</div>';
  }

  // Key advice
  html+='<div style="background:#e8f0f7;border:1px solid #aed4f5;border-radius:10px;padding:13px 16px;margin-bottom:12px;font-size:12px;color:#185FA5;line-height:1.6">';
  html+='<strong>Important:</strong> This assessment is based on HMRC\'s published IR35 guidance and the factors used by employment status courts. It is not a legal determination. From April 2021, medium and large clients determine IR35 status. Always get a formal Status Determination Statement (SDS) from your client and consider an IR35 contract review by a specialist before starting any engagement.';
  html+='</div>';
  html+='<div style="text-align:center"><a href="https://www.britvex.com/contact-us" target="_blank" style="display:inline-block;background:#0f2744;color:#fff;font-size:12px;font-weight:700;padding:10px 20px;border-radius:6px;text-decoration:none">Discuss IR35 with Britvex &rarr;</a></div>';

  ir35El('ir35-result').innerHTML=html;
}

function calcIT(g,r){
  var pa=r.pa;
  if(g>100000)pa=Math.max(0,r.pa-Math.floor((g-100000)/2));
  if(g<=pa)return 0;
  var t=0;
  if(g>r.higher)t=(g-r.higher)*0.45+(r.higher-r.basic)*0.40+(r.basic-pa)*0.20;
  else if(g>r.basic)t=(g-r.basic)*0.40+(r.basic-pa)*0.20;
  else t=(g-pa)*0.20;
  return Math.max(0,t);
}
function calcNI(g,r){
  var n=0;
  if(g>r.ni_pt)n+=(Math.min(g,r.ni_uel)-r.ni_pt)*0.08;
  if(g>r.ni_uel)n+=(g-r.ni_uel)*0.02;
  return Math.max(0,n);
}
function calcDivTax(d,used){
  var allow=500,taxable=Math.max(0,d-allow),tax=0;
  var bands=[{lim:37700,rt:0.0875},{lim:125140,rt:0.3375},{lim:1e9,rt:0.3935}];
  var prev=0,pos=used;
  for(var i=0;i<bands.length;i++){
    if(taxable<=0)break;
    var sz=bands[i].lim-prev,u2=Math.max(0,Math.min(pos,sz)),av=Math.max(0,sz-u2),ch=Math.min(taxable,av);
    if(ch>0)tax+=ch*bands[i].rt;
    taxable-=ch;pos=Math.max(0,pos-sz);prev=bands[i].lim;
  }
  return Math.max(0,tax);
}

window.ir35Calc=function(){ir35Assess();};
ir35Assess();
})();
