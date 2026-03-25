
(function(){
var bvModeV='personal',bvInc={'paye':true},bvVAT=false,bvLtdVAT=false,bvDTA=false,bvBPV=false;
var bvStructV='sole',bvPeriod='a',bvYear='2526',bvRegion='ew';
var bvMA=false,bvBPA=false,bvCB=false,bvRAR=false,bvTA=false,bvOpenTab='';
var bvLastResult={},bvBreakdownRows=[];
var RATES={
  '2425':{pa:12570,basic_limit:50270,higher_limit:125140,it_basic:0.20,it_higher:0.40,it_add:0.45,
    scot_bands:[{lim:14876,r:0.19},{lim:26561,r:0.20},{lim:43662,r:0.21},{lim:75000,r:0.42},{lim:125140,r:0.45},{lim:1e9,r:0.48}],
    ni_pt:12570,ni_uel:50270,ni_main:0.08,ni_upper:0.02,cl4_ll:12570,cl4_ul:50270,cl4_main:0.09,cl4_upper:0.02,
    emp_ni_st:9100,emp_ni_r:0.138,div_allow:500,div_basic:0.0875,div_higher:0.3375,div_add:0.3935,
    ct_small:0.19,ct_main:0.25,ct_ll:50000,ct_ul:250000,cgt_basic:0.18,cgt_higher:0.24,cgt_prop:0.24,cgt_badr:0.10,
    cgt_exempt:3000,psa_basic:1000,psa_higher:500,psa_add:0,vat_threshold:90000,
    yr_label:'2024/25',sa_deadline:'31 Jan 2026',sa_reg:'5 Oct 2025',poa2:'31 Jul 2025'},
  '2526':{pa:12570,basic_limit:50270,higher_limit:125140,it_basic:0.20,it_higher:0.40,it_add:0.45,
    scot_bands:[{lim:15397,r:0.19},{lim:27491,r:0.20},{lim:43662,r:0.21},{lim:75000,r:0.42},{lim:125140,r:0.45},{lim:1e9,r:0.48}],
    ni_pt:12570,ni_uel:50270,ni_main:0.08,ni_upper:0.02,cl4_ll:12570,cl4_ul:50270,cl4_main:0.06,cl4_upper:0.02,
    emp_ni_st:5000,emp_ni_r:0.138,div_allow:500,div_basic:0.0875,div_higher:0.3375,div_add:0.3935,
    ct_small:0.19,ct_main:0.25,ct_ll:50000,ct_ul:250000,cgt_basic:0.18,cgt_higher:0.24,cgt_prop:0.24,cgt_badr:0.14,
    cgt_exempt:3000,psa_basic:1000,psa_higher:500,psa_add:0,vat_threshold:90000,
    yr_label:'2025/26',sa_deadline:'31 Jan 2027',sa_reg:'5 Oct 2026',poa2:'31 Jul 2026'}
};

function R(){return RATES[bvYear];}
function bvG(id){return parseFloat(document.getElementById(id).value)||0;}
function bvGS(id){return document.getElementById(id).value;}
function bvEl(id){return document.getElementById(id);}
function bvCN(){return bvGS('bv-cname')||'';}
function bvCR(){return bvGS('bv-cref')||'';}
function bvFmt(v){return '\u00a3'+Math.max(0,Math.round(v)).toLocaleString('en-GB');}
function bvDisp(v){return bvPeriod==='m'?bvFmt(v/12):bvFmt(v);}
function bvMo(v){return bvPeriod==='a'?bvFmt(v/12)+'/mo':'';}

function bvAnnSal(){var v=bvG('p-sal'),f=bvGS('p-freq');return f==='m'?v*12:f==='w'?v*52:v;}

function bvIT(g,extraPA){
  var r=R(),pa=r.pa+(extraPA||0);
  if(g>100000) pa=Math.max(0,r.pa-Math.floor((g-100000)/2))+(extraPA||0);
  pa=Math.max(0,pa);
  if(g<=pa) return 0;
  var t=0;
  if(bvRegion==='scot'){
    var tax=g-pa,prev=0;
    for(var i=0;i<r.scot_bands.length;i++){if(tax<=0)break;var ck=Math.min(tax,r.scot_bands[i].lim-prev);if(ck>0)t+=ck*r.scot_bands[i].r;tax-=ck;prev=r.scot_bands[i].lim;}
  } else {
    if(g>r.higher_limit) t=(g-r.higher_limit)*r.it_add+(r.higher_limit-r.basic_limit)*r.it_higher+(r.basic_limit-pa)*r.it_basic;
    else if(g>r.basic_limit) t=(g-r.basic_limit)*r.it_higher+(r.basic_limit-pa)*r.it_basic;
    else t=(g-pa)*r.it_basic;
  }
  return Math.max(0,t);
}
function bvNI(g){var r=R(),n=0;if(g>r.ni_pt)n+=(Math.min(g,r.ni_uel)-r.ni_pt)*r.ni_main;if(g>r.ni_uel)n+=(g-r.ni_uel)*r.ni_upper;return Math.max(0,n);}
function bvCl4(p){var r=R(),n=0;if(p>r.cl4_ll)n+=(Math.min(p,r.cl4_ul)-r.cl4_ll)*r.cl4_main;if(p>r.cl4_ul)n+=(p-r.cl4_ul)*r.cl4_upper;return Math.max(0,n);}
function bvLoan(g){var plan=bvGS('p-loan'),th={'1':24990,'2':27295,'4':31395,'5':25000};if(plan==='none'||!th[plan])return 0;return Math.max(0,(g-th[plan])*0.09);}
function bvEmpNI(g){var r=R();return Math.max(0,(g-r.emp_ni_st)*r.emp_ni_r);}
function bvDivTax(d,used){var r=R(),allow=r.div_allow,taxable=Math.max(0,d-allow),tax=0,bands=[{lim:37700,rt:r.div_basic},{lim:r.higher_limit,rt:r.div_higher},{lim:1e9,rt:r.div_add}],prev=0,pos=used;for(var i=0;i<bands.length;i++){if(taxable<=0)break;var sz=bands[i].lim-prev,u2=Math.max(0,Math.min(pos,sz)),av=Math.max(0,sz-u2),ch=Math.min(taxable,av);if(ch>0)tax+=ch*bands[i].rt;taxable-=ch;pos=Math.max(0,pos-sz);prev=bands[i].lim;}return Math.max(0,tax);}
function bvCGT(gains,type,inc){var r=R(),taxable=Math.max(0,gains-r.cgt_exempt);if(taxable<=0)return 0;var rate=type==='prop'?r.cgt_prop:type==='biz'?r.cgt_badr:inc>r.basic_limit?r.cgt_higher:r.cgt_basic;return taxable*rate;}
function bvSavTax(int,nonSav){var r=R(),unPA=Math.max(0,r.pa-nonSav),aft=Math.max(0,int-unPA);if(aft<=0)return 0;var sr=Math.max(0,5000-Math.max(0,nonSav-r.pa)),aft2=Math.max(0,aft-sr);if(aft2<=0)return 0;var band=nonSav>r.higher_limit?'add':nonSav>r.basic_limit?'higher':'basic',psa=band==='add'?r.psa_add:band==='higher'?r.psa_higher:r.psa_basic,txbl=Math.max(0,aft2-psa),rate=band==='add'?r.it_add:band==='higher'?r.it_higher:r.it_basic;return txbl*rate;}
function bvHICBC(adj,cb){if(adj<=60000)return 0;if(adj>=80000)return cb;return cb*((adj-60000)/20000);}
function bvCTRate(p){var r=R();if(p<=r.ct_ll)return r.ct_small;if(p>=r.ct_ul)return r.ct_main;var rel=(r.ct_ul-p)/(r.ct_ul-r.ct_ll)*(r.ct_main-r.ct_small)*p;return (p*r.ct_main-rel)/p;}

/* HTML row builders */
function bvRow(lbl,ann,pill){
  var pc=pill?'<span class="bv-pill '+pill.c+'">'+pill.t+'</span>':'';
  var mo=bvPeriod==='a'&&ann!==null?'<span class="bv-rmo">'+bvFmt(ann/12)+'/mo</span>':'<span class="bv-rmo"></span>';
  return '<div class="bv-row"><span class="bv-rl">'+lbl+pc+'</span><span class="bv-rr">'+bvDisp(ann)+'</span>'+mo+'</div>';
}
function bvRowS(lbl,str){return '<div class="bv-row"><span class="bv-rl">'+lbl+'</span><span class="bv-rr">'+str+'</span><span class="bv-rmo"></span></div>';}
function bvTot(lbl,ann){var mo=bvPeriod==='a'?'<span class="bv-rmo">'+bvFmt(ann/12)+'/mo</span>':'<span class="bv-rmo"></span>';return '<div class="bv-rowt"><span>'+lbl+'</span><span class="bv-rr">'+bvDisp(ann)+'</span>'+mo+'</div>';}
function bvCard(title,badgeHtml,inner){return '<div class="bv-bdc"><div class="bv-bdtitle">'+title+(badgeHtml||'')+'</div>'+inner+'</div>';}
function bvBH(txt,style){return '<span class="bv-bdtbadge" style="'+style+'">'+txt+'</span>';}

function bvSetSum(th,it,ni,totax,gross){
  bvEl('bv-th').textContent=bvDisp(th); bvEl('bv-thmo').textContent=bvMo(th);
  bvEl('bv-totax').textContent=bvDisp(totax); bvEl('bv-totaxmo').textContent=bvMo(totax);
  bvEl('bv-itax').textContent=bvDisp(it); bvEl('bv-itaxmo').textContent=bvMo(it);
  bvEl('bv-ni').textContent=bvDisp(ni); bvEl('bv-nimo').textContent=bvMo(ni);
  var eff=gross>0?(totax/gross*100).toFixed(1):0;
  bvEl('bv-effr').textContent='Effective rate '+eff+'%'; bvEl('bv-eff-b').textContent=eff+'%';
}
function bvSetBar(th,it,ni,other,cgt,gross){
  if(gross<=0)return;
  bvEl('bv-b0').style.width=Math.max(0,th/gross*100).toFixed(1)+'%';
  bvEl('bv-b1').style.width=Math.max(0,it/gross*100).toFixed(1)+'%';
  bvEl('bv-b2').style.width=Math.max(0,ni/gross*100).toFixed(1)+'%';
  bvEl('bv-b3').style.width=Math.max(0,other/gross*100).toFixed(1)+'%';
  bvEl('bv-b4').style.width=Math.max(0,cgt/gross*100).toFixed(1)+'%';
  bvEl('bv-leg3').classList.toggle('bv-hidden',other<=0);
  bvEl('bv-leg4').classList.toggle('bv-hidden',cgt<=0);
}

/* PERSONAL CALC */
function bvCalcPersonal(){
  var r=R(),gross=bvAnnSal(),penPct=bvG('p-pen');
  var se=bvInc['se']?bvG('p-se'):0,rent=bvInc['rent']?bvG('p-rent'):0;
  var divInc=bvInc['div']?bvG('p-div'):0,savInt=bvInc['sav']?bvG('p-sav'):0;
  var foreign=bvInc['overseas']?bvG('p-for'):0,statePen=bvInc['pensinc']?bvG('p-statep'):0,privPen=bvInc['pensinc']?bvG('p-privp'):0;
  var cgtG=bvInc['cgt']?bvG('p-cgt'):0;
  var hasData=gross>0||se>0||rent>0||divInc>0||savInt>0||foreign>0||statePen>0||privPen>0||cgtG>0;
  if(!hasData){bvShowEmpty();return;}
  var penAmt=gross*(penPct/100);
  var car=bvInc['paye']?bvG('p-car'):0,cc=bvInc['paye']?bvG('p-childcare'):0;
  var totalSac=penAmt+car+cc;
  var bik=bvInc['paye']?bvG('p-bik'):0;
  var se=bvInc['se']?Math.max(0,bvG('p-se')-(bvTA?1000:0)):0;
  var rent=bvInc['rent']?bvG('p-rent'):0,rentExp=bvInc['rent']?bvG('p-rent-exp'):0,mort=bvInc['rent']?bvG('p-mort'):0;
  var rarS=bvRAR?7500:0,rentProfit=Math.max(0,rent-rentExp-rarS);
  var divInc=bvInc['div']?bvG('p-div'):0,savInt=bvInc['sav']?bvG('p-sav'):0;
  var foreign=bvInc['overseas']?bvG('p-for'):0,foreignTax=bvInc['overseas']?bvG('p-fortax'):0;
  var statePen=bvInc['pensinc']?bvG('p-statep'):0,privPen=bvInc['pensinc']?bvG('p-privp'):0;
  var cgtG=bvInc['cgt']?bvG('p-cgt'):0,cgtType=bvInc['cgt']?bvGS('p-cgttype'):'other';
  var giftAid=bvG('p-giftaid'),cbAmt=bvCB?bvG('p-cb'):0;
  var extraPA=(bvMA?1260:0)+(bvBPA?2870:0);
  var payeNet=bvInc['paye']?Math.max(0,gross-totalSac):0;
  var totalNonDiv=payeNet+bik+se+rentProfit+foreign+statePen+privPen;
  var adjNet=totalNonDiv-giftAid;
  var it=bvIT(totalNonDiv,extraPA);
  var mortCredit=Math.min(mort*0.20,it); it=Math.max(0,it-mortCredit);
  var ftCredit=bvDTA?foreignTax:Math.min(foreignTax,it); it=Math.max(0,it-ftCredit);
  var effPA=totalNonDiv>100000?Math.max(0,r.pa+extraPA-Math.floor((totalNonDiv-100000)/2)):r.pa+extraPA;
  var bandUsed=Math.max(0,totalNonDiv-effPA);
  var divTax=bvDivTax(divInc,bandUsed),savTax=bvSavTax(savInt,totalNonDiv);
  var ni=bvInc['paye']?bvNI(payeNet):0,cl4=se>r.cl4_ll?bvCl4(se):0,cl2=se>6845?179.40:0;
  var loan=bvInc['paye']?bvLoan(gross):0,cgt=bvCGT(cgtG,cgtType,totalNonDiv),hicbc=bvHICBC(adjNet,cbAmt);
  var totalTax=it+divTax+savTax+ni+cl4+cl2+loan+cgt+hicbc;
  var totalGross=totalNonDiv+divInc+savInt+totalSac;
  var takeHome=Math.max(0,totalGross-totalTax-totalSac);
  var marg=totalNonDiv>r.higher_limit?'45%':totalNonDiv>100000?'60%*':totalNonDiv>r.basic_limit?'40%':'20%';
  bvSetSum(takeHome,it+divTax+savTax,ni+cl4+cl2,totalTax,totalGross);
  bvEl('bv-it-b').textContent=marg; bvEl('bv-its').textContent='Marginal rate '+marg;
  bvEl('bv-ni-b').textContent=totalNonDiv>r.ni_uel?'2%':'8%';
  bvSetBar(takeHome,it+divTax+savTax,ni+cl4+cl2,loan+totalSac+hicbc,cgt,totalGross||1);

  /* Breakdown */
  bvBreakdownRows=[];
  var h1='';
  if(bvInc['paye']){h1+=bvRow('PAYE salary',gross,'');bvBreakdownRows.push(['PAYE salary',gross]);}
  if(penAmt>0){h1+=bvRow('Pension sacrifice &mdash; '+penPct+'%',-penAmt,'');bvBreakdownRows.push(['Pension sacrifice',penAmt]);}
  if(car>0){h1+=bvRow('Car / cycle scheme',-car,'');bvBreakdownRows.push(['Car/cycle scheme',car]);}
  if(cc>0){h1+=bvRow('Childcare vouchers',-cc,'');bvBreakdownRows.push(['Childcare vouchers',cc]);}
  if(bik>0){h1+=bvRow('Benefits in kind',bik,'');bvBreakdownRows.push(['Benefits in kind',bik]);}
  if(se>0){h1+=bvRow('Self-employed profit',se,'');bvBreakdownRows.push(['SE profit',se]);}
  if(rentProfit>0){h1+=bvRow('Rental profit (net)',rentProfit,'');bvBreakdownRows.push(['Rental profit',rentProfit]);}
  if(mortCredit>0){h1+=bvRowS('Mortgage interest credit','&minus; '+bvFmt(mortCredit));bvBreakdownRows.push(['Mortgage interest credit',mortCredit]);}
  if(foreign>0){h1+=bvRow('Overseas income',foreign,'');bvBreakdownRows.push(['Overseas income',foreign]);}
  if(statePen+privPen>0){h1+=bvRow('Pension income',statePen+privPen,'');bvBreakdownRows.push(['Pension income',statePen+privPen]);}
  h1+=bvRow('Personal allowance',-effPA,{c:'bv-p0',t:'0%'});bvBreakdownRows.push(['Personal allowance',effPA]);
  var basic=Math.max(0,Math.min(totalNonDiv,r.basic_limit)-effPA);
  if(basic>0){h1+=bvRow('Basic rate band',basic,{c:'bv-p20',t:bvRegion==='scot'?'19-21%':'20%'});bvBreakdownRows.push(['Basic rate band',basic]);}
  var higher=Math.max(0,Math.min(totalNonDiv,r.higher_limit)-r.basic_limit);
  if(higher>0){h1+=bvRow('Higher rate band',higher,{c:'bv-p40',t:bvRegion==='scot'?'42%':'40%'});bvBreakdownRows.push(['Higher rate band',higher]);}
  var addl=Math.max(0,totalNonDiv-r.higher_limit);
  if(addl>0){h1+=bvRow('Additional rate',addl,{c:'bv-p45',t:bvRegion==='scot'?'48%':'45%'});bvBreakdownRows.push(['Additional rate band',addl]);}
  h1+=bvTot('Income tax',it);bvBreakdownRows.push(['Income tax',it]);
  var h2='';
  if(bvInc['paye']){
    var nb=Math.max(0,Math.min(payeNet,r.ni_uel)-r.ni_pt);
    if(nb>0){h2+=bvRow('Earnings &pound;12,570&ndash;&pound;50,270',nb,{c:'bv-pni',t:'8%'});bvBreakdownRows.push(['NI band 8%',nb]);}
    var nh=Math.max(0,payeNet-r.ni_uel);
    if(nh>0){h2+=bvRow('Earnings above &pound;50,270',nh,{c:'bv-p0',t:'2%'});bvBreakdownRows.push(['NI band 2%',nh]);}
  }
  if(se>r.cl4_ll){
    h2+=bvRowS('Class 2 NI',bvFmt(cl2));bvBreakdownRows.push(['Class 2 NI',cl2]);
    h2+=bvRow('Class 4 &pound;12,570&ndash;&pound;50,270',Math.max(0,Math.min(se,r.cl4_ul)-r.cl4_ll),{c:'bv-pni',t:(r.cl4_main*100)+'%'});
    if(se>r.cl4_ul){h2+=bvRow('Class 4 above &pound;50,270',se-r.cl4_ul,{c:'bv-p0',t:'2%'});}
  }
  if(ni+cl4+cl2===0) h2+=bvRowS('No NI liability',bvFmt(0));
  h2+=bvTot('Total NI',ni+cl4+cl2);bvBreakdownRows.push(['National Insurance',ni+cl4+cl2]);

  var html='<div class="bv-bdgrid">'+bvCard('Income tax',bvBH(bvDisp(it),'background:var(--bv-blue-l);color:var(--bv-blue)'),h1)+bvCard('National Insurance',bvBH(bvDisp(ni+cl4+cl2),'background:var(--bv-green-l);color:var(--bv-green)'),h2)+'</div><div class="bv-bdgrid">';

  if(divInc>0){
    var dh='';
    dh+=bvRow('Dividend income',divInc,''); bvBreakdownRows.push(['Dividend income',divInc]);
    dh+=bvRow('Dividend allowance',-r.div_allow,{c:'bv-p0',t:'0%'});
    var br=Math.max(0,37700-bandUsed),inB=Math.min(Math.max(0,divInc-r.div_allow),br);
    if(inB>0)dh+=bvRow('Basic rate dividends',inB,{c:'bv-p8',t:(r.div_basic*100).toFixed(2)+'%'});
    var inH=Math.max(0,divInc-r.div_allow-inB);
    if(inH>0)dh+=bvRow('Higher rate dividends',inH,{c:'bv-p33',t:(r.div_higher*100).toFixed(2)+'%'});
    dh+=bvTot('Dividend tax',divTax);bvBreakdownRows.push(['Dividend tax',divTax]);
    html+=bvCard('Dividend tax',bvBH(bvDisp(divTax),'background:var(--bv-blue-l);color:var(--bv-blue)'),dh);
  }
  if(savInt>0){
    var sh='';sh+=bvRow('Savings interest',savInt,'');
    var band=totalNonDiv>r.higher_limit?'additional':totalNonDiv>r.basic_limit?'higher':'basic';
    var psa=band==='additional'?0:band==='higher'?500:1000;
    sh+=bvRowS('Personal Savings Allowance','&pound;'+psa.toLocaleString('en-GB')+' ('+band+' rate)');
    sh+=bvTot('Savings tax',savTax);bvBreakdownRows.push(['Savings interest tax',savTax]);
    html+=bvCard('Savings interest tax',bvBH(bvDisp(savTax),'background:var(--bv-blue-l);color:var(--bv-blue)'),sh);
  }
  if(cgtG>0){
    var ch='';ch+=bvRow('Total gains',cgtG,'');ch+=bvRow('Annual exempt amount',-r.cgt_exempt,'');
    var cgRlbl=cgtType==='prop'?'24%':cgtType==='biz'?(bvYear==='2526'?'14% (BADR)':'10% (BADR)'):totalNonDiv>r.basic_limit?'24%':'18%';
    ch+=bvRowS('CGT rate',cgRlbl);ch+=bvTot('Capital gains tax',cgt);bvBreakdownRows.push(['Capital gains tax',cgt]);
    html+=bvCard('Capital gains tax',bvBH(bvDisp(cgt),'background:var(--bv-purple-l);color:var(--bv-purple)'),ch);
  }
  if(hicbc>0){
    var cbh='';cbh+=bvRow('Child Benefit received',cbAmt,'');cbh+=bvRowS('Adjusted net income',bvFmt(adjNet));cbh+=bvTot('Child Benefit charge',hicbc);bvBreakdownRows.push(['Child Benefit charge',hicbc]);
    html+=bvCard('High Income Child Benefit',bvBH(bvDisp(hicbc),'background:var(--bv-amber-l);color:var(--bv-amber)'),cbh);
  }
  if(bvMA||bvBPA||loan>0||totalSac>0){
    var rh='';
    if(bvMA)rh+=bvRowS('Marriage Allowance received','+&pound;1,260 PA');
    if(bvBPA)rh+=bvRowS("Blind Person's Allowance",'+&pound;2,870 PA');
    if(totalSac>0)rh+=bvRow('Total salary sacrifice',totalSac,'');
    if(loan>0){rh+=bvRow('Student loan repayment',loan,'');bvBreakdownRows.push(['Student loan',loan]);}
    rh+=bvTot('Total deductions',totalSac+loan);
    html+=bvCard('Reliefs &amp; deductions','',rh);
  }
  html+='</div>';
  bvEl('bv-bda').innerHTML=html;
  bvBreakdownRows.push(['TOTAL TAX & NI',totalTax]);
  bvBreakdownRows.push(['NET TAKE-HOME',takeHome]);

  bvLastResult={mode:'p',gross:gross,se:se,rentProfit:rentProfit,divInc:divInc,cgtG:cgtG,savInt:savInt,
    it:it+divTax+savTax,ni:ni+cl4+cl2,totalTax:totalTax,takeHome:takeHome,totalGross:totalGross,
    hicbc:hicbc,penAmt:penAmt,penPct:penPct,carScheme:car,childcare:cc,totalSac:totalSac,loan:loan,
    struct:'',vatFlag:false,corpTax:0,emps:0,totalNonDiv:totalNonDiv,effPA:effPA,mortCredit:mortCredit};
  bvDeadlines();bvForms();bvFiAssist();bvAdvice();bvEl('bv-opt').classList.add('bv-hidden');
  if(bvOpenTab==='emp')bvRenderEmp();if(bvOpenTab==='sac')bvRenderSac();
}

/* BUSINESS CALC */
function bvCalcBusiness(){
  var r=R(),st=bvStructV,takeHome=0,totalTax=0,dirIT=0,dirNI=0,empNIv=0,grossRef=0,corpTax=0,vatFlag=false;
  var mainVal=st==='sole'?bvG('b-turn'):st==='ltd'?bvG('b-ltturn'):st==='part'?bvG('b-ppart'):bvG('b-cval');
  if(!mainVal){bvShowEmpty();return;}
  var html='';bvBreakdownRows=[];
  if(st==='sole'){
    var turn=bvG('b-turn'),exp=bvG('b-exp'),capall=bvG('b-capall');
    var profit=Math.max(0,turn-exp-capall);grossRef=profit;vatFlag=bvVAT&&turn>r.vat_threshold;
    var it=bvIT(profit),cl4=bvCl4(profit),cl2=profit>6845?179.40:0;
    totalTax=it+cl4+cl2;takeHome=profit-totalTax;dirIT=it;dirNI=cl4+cl2;
    var h='';h+=bvRow('Turnover',turn,'');h+=bvRow('Allowable expenses',-exp,'');h+=bvRow('Capital allowances',-capall,'');h+=bvRow('Taxable profit',profit,'');
    var pa=profit>100000?Math.max(0,r.pa-Math.floor((profit-100000)/2)):r.pa;
    h+=bvRow('Personal allowance',-pa,{c:'bv-p0',t:'0%'});
    var b=Math.max(0,Math.min(profit,r.basic_limit)-pa);if(b>0)h+=bvRow('Basic rate',b,{c:'bv-p20',t:'20%'});
    var hh=Math.max(0,Math.min(profit,r.higher_limit)-r.basic_limit);if(hh>0)h+=bvRow('Higher rate',hh,{c:'bv-p40',t:'40%'});
    var aa=Math.max(0,profit-r.higher_limit);if(aa>0)h+=bvRow('Additional rate',aa,{c:'bv-p45',t:'45%'});
    h+=bvTot('Income tax',it);h+=bvRowS('Class 2 NI',bvFmt(cl2));h+=bvRow('Class 4 NI',Math.max(0,Math.min(profit,r.cl4_ul)-r.cl4_ll),{c:'bv-pni',t:(r.cl4_main*100)+'%'});h+=bvTot('Total tax',totalTax);
    bvBreakdownRows=[['Turnover',turn],['Expenses',exp],['Taxable profit',profit],['Income tax',it],['Class 4 NI',cl4],['Class 2 NI',cl2],['TOTAL TAX',totalTax],['NET TAKE-HOME',takeHome]];
    html='<div class="bv-bdgrid bv-full">'+bvCard('Sole trader tax',bvBH(bvDisp(totalTax),'background:var(--bv-blue-l);color:var(--bv-blue)'),h)+'</div>';
    bvLastResult={mode:'b',struct:'sole',profit:profit,turn:turn,it:it,ni:cl4+cl2,totalTax:totalTax,takeHome:takeHome,grossRef:grossRef,vatFlag:vatFlag,corpTax:0,emps:0,dirSal:0};
  } else if(st==='ltd'){
    var turn2=bvG('b-ltturn'),exp2=bvG('b-ltexp'),dirSal=bvG('b-dirsal');
    var emps=bvG('b-emps'),avgSal=bvG('b-avgsal'),rd=bvG('b-rd');vatFlag=bvLtdVAT;
    var empWage=emps*avgSal;empNIv=bvEmpNI(dirSal)+emps*bvEmpNI(avgSal);
    var empPen=dirSal*0.03+empWage*0.03,rdR=rd*0.20;
    var taxProfit=Math.max(0,turn2-exp2-dirSal-empWage-empNIv-empPen-rdR);
    var ctRate=bvCTRate(taxProfit);corpTax=taxProfit*ctRate;grossRef=turn2;
    var profAft=Math.max(0,taxProfit-corpTax),divToDr=profAft*0.80;
    dirIT=bvIT(dirSal);dirNI=bvNI(dirSal);
    var dTax2=bvDivTax(divToDr,Math.max(0,dirSal-r.pa));
    totalTax=corpTax+dirIT+dirNI+dTax2+empNIv;takeHome=dirSal-dirIT-dirNI+divToDr-dTax2;
    var h1='',h2='';
    h1+=bvRow('Company turnover',turn2,'');h1+=bvRow('Business expenses',-exp2,'');h1+=bvRow('Director salary',-dirSal,'');
    if(empWage>0)h1+=bvRow('Employee wages ('+Math.round(emps)+')',-empWage,'');
    h1+=bvRow('Employer NI',-empNIv,'');h1+=bvRow('Employer pension (3%)',-empPen,'');
    if(rdR>0)h1+=bvRow('R&D relief',-rdR,'');
    h1+=bvRow('Taxable profit',taxProfit,'');h1+=bvRowS('Corp tax rate',(ctRate*100).toFixed(1)+'%');h1+=bvTot('Corporation tax',corpTax);
    h2+=bvRow('Director salary',dirSal,'');h2+=bvRow('Income tax',-dirIT,'');h2+=bvRow('Employee NI',-dirNI,'');
    h2+=bvRow('Dividend from profits',divToDr,'');h2+=bvRow('Dividend allowance',-r.div_allow,{c:'bv-p0',t:'0%'});h2+=bvRow('Dividend tax',-dTax2,'');h2+=bvTot('Director take-home',takeHome);
    bvBreakdownRows=[['Company turnover',turn2],['Business expenses',exp2],['Director salary',dirSal],['Employee wages',empWage],['Employer NI',empNIv],['Employer pension',empPen],['Taxable profit',taxProfit],['Corporation tax',corpTax],['Director IT',dirIT],['Director NI',dirNI],['Dividend to director',divToDr],['Dividend tax',dTax2],['TOTAL TAX',totalTax],['DIRECTOR TAKE-HOME',takeHome]];
    html='<div class="bv-bdgrid">'+bvCard('Corporation tax',bvBH(bvDisp(corpTax),'background:var(--bv-amber-l);color:var(--bv-amber)'),h1)+bvCard('Director personal tax',bvBH(bvDisp(dirIT+dTax2),'background:var(--bv-blue-l);color:var(--bv-blue)'),h2)+'</div>';
    bvLastResult={mode:'b',struct:'ltd',profit:taxProfit,turn:turn2,it:dirIT+dTax2,ni:dirNI+empNIv,corpTax:corpTax,totalTax:totalTax,takeHome:takeHome,grossRef:grossRef,vatFlag:vatFlag,emps:emps,dirSal:dirSal,empNI:empNIv,empPen:empPen,divToDr:divToDr,dTax2:dTax2};
    bvRenderOpt(turn2,exp2,dirSal);
  } else if(st==='part'){
    var pp=bvG('b-ppart'),ps=bvG('b-pshare')/100,myP=pp*ps;grossRef=myP;
    var it2=bvIT(myP),cl42=bvCl4(myP),cl22=myP>6845?179.40:0;
    totalTax=it2+cl42+cl22;takeHome=myP-totalTax;dirIT=it2;dirNI=cl42+cl22;
    var h3='';h3+=bvRow('Total partnership profit',pp,'');h3+=bvRow('Your share ('+Math.round(ps*100)+'%)',myP,'');
    var pa3=myP>100000?Math.max(0,r.pa-Math.floor((myP-100000)/2)):r.pa;
    h3+=bvRow('Personal allowance',-pa3,{c:'bv-p0',t:'0%'});
    var b3=Math.max(0,Math.min(myP,r.basic_limit)-pa3);if(b3>0)h3+=bvRow('Basic rate',b3,{c:'bv-p20',t:'20%'});
    var h3h=Math.max(0,Math.min(myP,r.higher_limit)-r.basic_limit);if(h3h>0)h3+=bvRow('Higher rate',h3h,{c:'bv-p40',t:'40%'});
    h3+=bvRow('Class 4 NI',Math.max(0,Math.min(myP,r.cl4_ul)-r.cl4_ll),{c:'bv-pni',t:(r.cl4_main*100)+'%'});h3+=bvTot('Total tax',totalTax);
    bvBreakdownRows=[['Partnership profit (your share)',myP],['Income tax',it2],['Class 4 NI',cl42],['TOTAL TAX',totalTax],['NET TAKE-HOME',takeHome]];
    html='<div class="bv-bdgrid bv-full">'+bvCard('Partnership breakdown','',h3)+'</div>';
    bvLastResult={mode:'b',struct:'part',profit:myP,turn:pp,it:it2,ni:cl42+cl22,totalTax:totalTax,takeHome:takeHome,grossRef:grossRef,vatFlag:false,corpTax:0};
  } else if(st==='cont'){
    var cval=bvG('b-cval'),ir35=bvGS('b-ir35'),cexp=bvG('b-cexp');grossRef=cval;
    if(ir35==='in'){
      var deemed=cval*0.95,it3=bvIT(deemed),ni3=bvNI(deemed),eni3=bvEmpNI(deemed);
      totalTax=it3+ni3+eni3;takeHome=deemed-it3-ni3;dirIT=it3;dirNI=ni3;
      var h4='';h4+=bvRow('Contract value',cval,'');h4+=bvRow('Deemed employment (95%)',deemed,'');h4+=bvRow('Income tax',-it3,'');h4+=bvRow('Employee NI',-ni3,'');h4+=bvRowS('Employer NI (client liable)',bvFmt(eni3));h4+=bvTot('Take-home (inside IR35)',takeHome);
      bvBreakdownRows=[['Contract value',cval],['Deemed employment',deemed],['Income tax',it3],['Employee NI',ni3],['TOTAL TAX',totalTax],['TAKE-HOME',takeHome]];
      html='<div class="bv-bdgrid bv-full">'+bvCard('Inside IR35',bvBH('INSIDE','background:var(--bv-red-l);color:var(--bv-red)'),h4)+'</div>';
      bvLastResult={mode:'b',struct:'cont',ir35:'in',profit:deemed,turn:cval,it:it3,ni:ni3,totalTax:totalTax,takeHome:takeHome,grossRef:grossRef,vatFlag:false,corpTax:0};
    } else {
      var profit2=Math.max(0,cval-cexp),it4=bvIT(profit2),cl43=bvCl4(profit2);
      totalTax=it4+cl43+179.40;takeHome=profit2-totalTax;dirIT=it4;dirNI=cl43;
      var ltdP=Math.max(0,cval-cexp-r.pa),ltdCT=ltdP*r.ct_small,divPot=ltdP-ltdCT;
      var h5='',h5b='';
      h5+=bvRow('Contract value',cval,'');h5+=bvRow('Expenses',-cexp,'');h5+=bvRow('Taxable profit',profit2,'');h5+=bvRow('Income tax',-it4,'');h5+=bvRow('Class 4 NI',-cl43,'');h5+=bvTot('Take-home outside IR35',takeHome);
      h5b+=bvRow('Corp tax (19%)',ltdCT,'');h5b+=bvRow('Director salary (PA)',r.pa,'');h5b+=bvRow('Dividend pot',divPot,'');h5b+=bvTot('Via Ltd take-home',r.pa+divPot-bvDivTax(divPot,0));
      bvBreakdownRows=[['Contract value',cval],['Expenses',cexp],['Income tax',it4],['Class 4 NI',cl43],['TOTAL TAX',totalTax],['TAKE-HOME (outside IR35)',takeHome]];
      html='<div class="bv-bdgrid">'+bvCard('Outside IR35',bvBH('OUTSIDE','background:var(--bv-green-l);color:var(--bv-green)'),h5)+bvCard('Ltd comparison','',h5b)+'</div>';
      bvLastResult={mode:'b',struct:'cont',ir35:'out',profit:profit2,turn:cval,it:it4,ni:cl43,totalTax:totalTax,takeHome:takeHome,grossRef:grossRef,vatFlag:false,corpTax:0};
    }
  }
  if(bvBPV){var pinc=bvG('b-pinc');if(pinc>0){var eIT=bvIT(pinc),eNI=bvNI(pinc);totalTax+=eIT+eNI;takeHome+=pinc-eIT-eNI;}}
  bvSetSum(takeHome,dirIT,dirNI+empNIv,totalTax,grossRef||1);
  bvEl('bv-it-b').textContent=st==='ltd'?'CT+IT':'Marg.'; bvEl('bv-its').textContent=st==='ltd'?'Corp tax + director IT':'Marginal rate'; bvEl('bv-ni-b').textContent='NI';
  bvSetBar(takeHome,dirIT,dirNI+empNIv,0,0,grossRef||1);
  bvEl('bv-bda').innerHTML=html;
  bvDeadlines();bvForms();bvFiAssist();bvAdvice();
  if(st!=='ltd')bvEl('bv-opt').classList.add('bv-hidden');
  if(bvOpenTab==='emp')bvRenderEmp();if(bvOpenTab==='sac')bvRenderSac();
}

/* OPTIMISER */
function bvRenderOpt(turn,exp,curSal){
  var r=R();bvEl('bv-opt').classList.remove('bv-hidden');
  var optSal=r.pa,gP=Math.max(0,turn-exp-optSal),ct=gP*bvCTRate(gP),divPot=Math.max(0,gP-ct),optTH=optSal+divPot-bvDivTax(divPot,0);
  var curGP=Math.max(0,turn-exp-curSal),curCT=curGP*bvCTRate(curGP),curDiv=Math.max(0,curGP-curCT)*0.80;
  var curTH=curSal-bvIT(curSal)-bvNI(curSal)+curDiv-bvDivTax(curDiv,Math.max(0,curSal-r.pa));
  bvEl('bv-optg').innerHTML='<div class="bv-optitem"><div class="bv-optlbl">Optimal salary</div><div class="bv-optval bv-gold">'+bvFmt(optSal)+'</div><div class="bv-optsub">= Personal Allowance &mdash; no IT or NI</div></div><div class="bv-optitem"><div class="bv-optlbl">Dividend pot after CT</div><div class="bv-optval">'+bvFmt(divPot)+'</div><div class="bv-optsub">Available to distribute</div></div><div class="bv-optitem"><div class="bv-optlbl">Optimal take-home</div><div class="bv-optval bv-gold">'+bvFmt(optTH)+'</div><div class="bv-optsub">Current: '+bvFmt(curTH)+'</div></div>';
}

/* DEADLINES */
function bvDeadlines(){
  var r=R(),res=bvLastResult,items=[];
  bvEl('bv-dl-yr-badge').textContent=r.yr_label;
  if(res.mode==='p'){
    var needSA=bvInc['se']||bvInc['rent']||bvInc['div']||bvInc['overseas']||bvInc['cgt']||bvInc['sav']||(res.hicbc&&res.hicbc>0);
    if(needSA){items.push({d:r.sa_deadline,t:'Self Assessment return',s:'SA100 online filing deadline &mdash; '+r.yr_label,u:true});items.push({d:r.sa_deadline,t:'Tax payment due',s:'Balancing payment + 1st payment on account',u:true});items.push({d:r.poa2,t:'2nd payment on account',s:'50% of prior year liability',sn:true});items.push({d:r.sa_reg,t:'Register for Self Assessment',s:'New to SA? Notify HMRC by this date',sn:false});}
    if(bvInc['paye'])items.push({d:'31 May',t:'P60 from employer',s:'Employer must provide P60 by 31 May',sn:false});
    if(res.cgtG>0)items.push({d:'Within 60 days',t:'CGT on property &mdash; report &amp; pay',s:'Within 60 days of completion date',u:true});
    if(res.hicbc>0)items.push({d:r.sa_deadline,t:'Child Benefit charge',s:'Report via Self Assessment',u:true});
  } else {
    var st=res.struct;
    if(st==='sole'||st==='part'){items.push({d:r.sa_deadline,t:'Self Assessment return',s:'File SA100 + business pages',u:true});items.push({d:r.sa_deadline,t:'Class 4 NI payment',s:'Due with SA balancing payment',u:true});}
    if(st==='part')items.push({d:r.sa_deadline,t:'SA800 Partnership return',s:'Nominated partner must file',u:true});
    if(st==='ltd'||st==='cont'){items.push({d:'9 months + 1 day after year end',t:'Corporation tax payment',s:'Pay CT to HMRC',u:true});items.push({d:'12 months after year end',t:'CT600 return',s:'File Corporation Tax return with HMRC',sn:true});items.push({d:'9 months after year end',t:'Annual accounts &mdash; Companies House',s:'File statutory accounts',sn:true});items.push({d:'Monthly / Quarterly',t:'PAYE &amp; RTI (FPS/EPS)',s:'Real Time Information payroll submissions',sn:false});if(res.vatFlag)items.push({d:'Quarterly',t:'VAT return',s:'Submit VAT return + payment to HMRC',sn:true});items.push({d:'Annual',t:'Confirmation statement CS01',s:'Companies House annual confirmation',sn:false});}
  }
  if(items.length===0)items.push({d:r.sa_deadline,t:'Self Assessment',s:'Filing and payment deadline',u:false});
  var dlH='',shown=items.slice(0,6);
  for(var i=0;i<shown.length;i++){var cls=shown[i].u?'bv-urg':shown[i].sn?'bv-soon':'';dlH+='<div class="bv-dlitem '+cls+'"><div class="bv-dldate">'+shown[i].d+'</div><div class="bv-dltitle">'+shown[i].t+'</div><div class="bv-dlsub">'+shown[i].s+'</div></div>';}
  bvEl('bv-dlg').innerHTML=dlH;
}

/* FORMS DATA */
var BV_FORMS={
  sa100:{num:'SA100',ch:false,name:'Self Assessment Tax Return',desc:'Main personal tax return submitted to HMRC. Required when income goes beyond PAYE.',dead:'31 Jan',urg:true,gov:'https://www.gov.uk/self-assessment-tax-returns',pdf:'https://www.gov.uk/government/publications/self-assessment-tax-return-sa100'},
  sa103:{num:'SA103',ch:false,name:'Self-employment Pages',desc:'Attached to SA100 for sole traders and freelancers. Reports business income and expenses.',dead:'31 Jan',urg:true,gov:'https://www.gov.uk/self-assessment-forms-and-helpsheets',pdf:'https://www.gov.uk/government/publications/self-assessment-self-employment-short-sa103s'},
  sa105:{num:'SA105',ch:false,name:'Property Income Pages',desc:'Attached to SA100 to report rental and property income to HMRC.',dead:'31 Jan',urg:false,gov:'https://www.gov.uk/self-assessment-forms-and-helpsheets',pdf:'https://www.gov.uk/government/publications/self-assessment-uk-property-sa105'},
  sa108:{num:'SA108',ch:false,name:'Capital Gains Pages',desc:'Attached to SA100 to report capital gains from shares, property or other assets.',dead:'31 Jan',urg:false,gov:'https://www.gov.uk/self-assessment-forms-and-helpsheets',pdf:'https://www.gov.uk/government/publications/self-assessment-capital-gains-summary-sa108'},
  sa800:{num:'SA800',ch:false,name:'Partnership Return',desc:'Filed by nominated partner to report partnership income and profit shares to HMRC.',dead:'31 Jan',urg:true,gov:'https://www.gov.uk/self-assessment-forms-and-helpsheets',pdf:'https://www.gov.uk/government/publications/self-assessment-partnership-sa800'},
  ct600:{num:'CT600',ch:false,name:'Company Tax Return',desc:'Corporation tax return filed to HMRC. Due 12 months after accounting period end.',dead:'12 months after year end',urg:true,gov:'https://www.gov.uk/file-your-company-accounts-and-tax-return',pdf:'https://www.gov.uk/government/publications/corporation-tax-company-tax-return-ct600-2015-version-3'},
  ch_accounts:{num:'CH Accounts',ch:true,name:'Annual Accounts &mdash; Companies House',desc:'Statutory company accounts. Filed with Companies House 9 months after year end.',dead:'9 months after year end',urg:true,gov:'https://www.gov.uk/file-your-confirmation-statement-with-companies-house',pdf:'https://www.gov.uk/government/publications/life-of-a-company-annual-requirements'},
  cs01:{num:'CS01',ch:true,name:'Confirmation Statement',desc:'Annual Companies House filing confirming company details: officers, shareholders, SIC code.',dead:'Within 14 days of review date',urg:false,gov:'https://www.gov.uk/file-your-confirmation-statement-with-companies-house',pdf:'https://www.gov.uk/government/publications/confirmation-statement-cs01'},
  vat:{num:'VAT Return',ch:false,name:'VAT Return',desc:'Quarterly return reporting output VAT, input VAT and net amount payable to HMRC.',dead:'Quarterly (1 month + 7 days)',urg:false,gov:'https://www.gov.uk/send-vat-return',pdf:'https://www.gov.uk/vat-returns'},
  fps:{num:'FPS/EPS',ch:false,name:'PAYE Payroll &mdash; RTI',desc:'Full Payment Submission each pay run plus Employer Payment Summary for adjustments.',dead:'On or before pay day',urg:false,gov:'https://www.gov.uk/running-payroll/reporting-to-hmrc',pdf:'https://www.gov.uk/government/publications/paye-real-time-information-getting-started'},
  p11d:{num:'P11D',ch:false,name:'Benefits in Kind Report',desc:'Reports employee benefits such as company car or medical cover to HMRC when not payrolled.',dead:'6 July after tax year',urg:false,gov:'https://www.gov.uk/employer-reporting-expenses-benefits',pdf:'https://www.gov.uk/government/publications/paye-end-of-year-expenses-and-benefits-p11d'},
  p60:{num:'P60',ch:false,name:'P60 &mdash; Employee Year End',desc:'Year-end pay certificate from employer showing total pay and tax. Must be issued by 31 May.',dead:'31 May',urg:false,gov:'https://www.gov.uk/paye-forms-p45-p60-p11d/p60',pdf:'https://www.gov.uk/paye-forms-p45-p60-p11d/p60'}
};

function bvDetectForms(){
  var res=bvLastResult,needed=[];
  if(res.mode==='p'){
    var hasSA=bvInc['se']||bvInc['rent']||bvInc['div']||bvInc['overseas']||bvInc['cgt']||bvInc['sav']||(res.hicbc&&res.hicbc>0)||bvMA||bvCB;
    if(hasSA)needed.push('sa100');
    if(bvInc['se']&&bvG('p-se')>0)needed.push('sa103');
    if(bvInc['rent']&&bvG('p-rent')>0)needed.push('sa105');
    if(bvInc['cgt']&&bvG('p-cgt')>0)needed.push('sa108');
    if(bvInc['paye'])needed.push('p60');
    if(bvInc['paye']&&bvG('p-bik')>0)needed.push('p11d');
  } else {
    var st=res.struct;
    if(st==='sole'){needed.push('sa100');needed.push('sa103');if(bvVAT)needed.push('vat');}
    if(st==='part'){needed.push('sa100');needed.push('sa103');needed.push('sa800');}
    if(st==='ltd'){needed.push('ct600');needed.push('ch_accounts');needed.push('cs01');needed.push('fps');if(bvLtdVAT)needed.push('vat');if(bvG('b-emps')>0){needed.push('p60');needed.push('p11d');}}
    if(st==='cont'){if(bvGS('b-ir35')==='in')needed.push('fps');else{needed.push('sa100');needed.push('sa103');}}
  }
  return needed;
}

function bvForms(){
  var needed=bvDetectForms();
  if(needed.length===0){bvEl('bv-forms-list').innerHTML='<div style="font-size:12px;color:var(--bv-text3);padding:8px 0">Enter your details to see required filings.</div>';return;}
  var fh='';
  for(var i=0;i<needed.length;i++){
    var f=BV_FORMS[needed[i]];if(!f)continue;
    var nbg=f.ch?'background:#8b1a1a':'background:var(--bv-navy)';
    var dc=f.urg?'bv-urg':'bv-soon';
    fh+='<div class="bv-form-row"><span class="bv-form-num" style="'+nbg+'">'+f.num+'</span><div><div class="bv-form-name">'+f.name+'</div><div class="bv-form-desc">'+f.desc+'</div></div><span class="bv-form-dead '+dc+'">'+f.dead+'</span><div class="bv-form-btns"><a href="'+f.gov+'" target="_blank" class="bv-fbtn bv-fbtn-gov">GOV.UK</a><a href="'+f.pdf+'" target="_blank" class="bv-fbtn bv-fbtn-pdf">PDF / File</a></div></div>';
  }
  bvEl('bv-forms-list').innerHTML=fh;
}

/* FILING ASSISTANT */
var BV_FA={
  sa100:{num:'SA100',name:'Self Assessment Tax Return',inst:'Log in to HMRC Online at gov.uk/self-assessment. Enter these figures in the relevant pages of your return.'},
  sa103:{num:'SA103',name:'Self-employment (SA103)',inst:'Attach to your SA100. Enter turnover and allowable expenses in the self-employment pages.'},
  sa105:{num:'SA105',name:'Property Income (SA105)',inst:'Attach to your SA100. Enter rental income and expenses in the UK property pages.'},
  sa108:{num:'SA108',name:'Capital Gains (SA108)',inst:'Attach to your SA100. Enter disposal proceeds, base cost, and gain in the capital gains pages.'},
  sa800:{num:'SA800',name:'Partnership Return (SA800)',inst:'Nominated partner files at gov.uk. Includes partnership profit split and each partner allocation.'},
  ct600:{num:'CT600',name:'Company Tax Return (CT600)',inst:'File at gov.uk using HMRC online or HMRC-recognised software. Enter company profit, adjustments, and CT due.'},
  ch_accounts:{num:'CH Accounts',name:'Annual Accounts',inst:'File at Companies House using WebFiling at companies.gov.uk or via an accountant.'},
  cs01:{num:'CS01',name:'Confirmation Statement',inst:'File at companies.gov.uk. Confirm company details, officers, and share structure are correct.'},
  vat:{num:'VAT',name:'VAT Return',inst:'File via HMRC Making Tax Digital software. Report output VAT, input VAT, and net amount.'},
  fps:{num:'FPS/EPS',name:'PAYE Payroll RTI',inst:'File via payroll software. Submit Full Payment Submission on or before each pay day.'}
};

function bvFiAssist(){
  var needed=bvDetectForms(),res=bvLastResult,r=R();
  var cn=bvCN(),cr=bvCR();
  if(needed.length===0){bvEl('bv-fa-list').innerHTML='<div style="font-size:12px;color:var(--bv-text3)">Enter your details above and the system will generate pre-filled reference sheets for each required filing.</div>';return;}
  var html='';
  for(var i=0;i<needed.length;i++){
    var key=needed[i],f=BV_FA[key],fd=BV_FORMS[key];if(!f||!fd)continue;
    var fields=bvFaFields(key,res,r,cn,cr);
    var fieldHtml='';
    for(var j=0;j<fields.length;j++)fieldHtml+='<div class="bv-fa-row"><span class="bv-fa-key">'+fields[j][0]+'</span><span class="bv-fa-val">'+fields[j][1]+'</span></div>';
    var nbg=fd.ch?'background:#8b1a1a':'background:var(--bv-navy)';
    var hasData=fields.length>0;
    html+='<div class="bv-fa-form"><div class="bv-fa-hdr"><span class="bv-form-num" style="'+nbg+'">'+f.num+'</span><span class="bv-fa-title">'+f.name+'</span><span class="bv-fa-status '+(hasData?'bv-ready':'bv-review')+'">'+(hasData?'Data ready':'Needs review')+'</span><button class="bv-fa-btn" onclick="bvFaPrint(\''+key+'\')">Print sheet</button></div>';
    if(hasData)html+='<div class="bv-fa-body">'+fieldHtml+'<div class="bv-fa-instruct">'+f.inst+'<br><strong>File at: </strong><a href="'+fd.gov+'" target="_blank" style="color:var(--bv-blue)">'+fd.gov+'</a></div></div>';
    html+='</div>';
  }
  bvEl('bv-fa-list').innerHTML=html||'<div style="font-size:12px;color:var(--bv-text3)">Enter data to generate filing sheets.</div>';
}

function bvFaFields(key,res,r,cn,cr){
  var f=[],yr=r.yr_label;
  if(cn)f.push(['Client name',cn]);if(cr)f.push(['Reference',cr]);
  f.push(['Tax year',yr]);
  if(key==='sa100'||key==='sa103'){
    if(res.mode==='p'){
      if(bvInc['paye']&&bvG('p-sal')>0)f.push(['Employment income',bvFmt(bvAnnSal())]);
      if(bvInc['se']&&bvG('p-se')>0)f.push(['Self-employment profit',bvFmt(bvG('p-se'))]);
      if(bvInc['rent']&&bvG('p-rent')>0)f.push(['UK property profit',bvFmt(Math.max(0,bvG('p-rent')-bvG('p-rent-exp')))]);
      if(bvInc['div']&&bvG('p-div')>0)f.push(['Dividend income',bvFmt(bvG('p-div'))]);
      if(bvInc['sav']&&bvG('p-sav')>0)f.push(['Savings interest',bvFmt(bvG('p-sav'))]);
      if(bvInc['overseas']&&bvG('p-for')>0)f.push(['Foreign income',bvFmt(bvG('p-for'))]);
      if(bvInc['pensinc'])f.push(['Pension income',bvFmt(bvG('p-statep')+bvG('p-privp'))]);
      f.push(['Personal allowance',bvFmt(res.effPA||r.pa)]);
      f.push(['Total income tax',bvFmt(res.it||0)]);
      f.push(['Employee NI',bvFmt(res.ni||0)]);
      f.push(['Total tax due',bvFmt(res.totalTax||0)]);
      f.push(['Net take-home',bvFmt(res.takeHome||0)]);
    } else {
      if(res.profit)f.push(['Self-employed / business profit',bvFmt(res.profit)]);
      f.push(['Total tax due',bvFmt(res.totalTax||0)]);
    }
  } else if(key==='sa105'){
    f.push(['Gross rent received',bvFmt(bvG('p-rent'))]);
    f.push(['Allowable expenses',bvFmt(bvG('p-rent-exp'))]);
    f.push(['Mortgage interest',bvFmt(bvG('p-mort'))]);
    f.push(['Net property profit',bvFmt(res.rentProfit||0)]);
  } else if(key==='sa108'){
    f.push(['Total disposal proceeds','See CGT calc']);
    f.push(['Gain before exemption',bvFmt(bvG('p-cgt'))]);
    f.push(['Annual exempt amount',bvFmt(r.cgt_exempt)]);
    f.push(['Taxable gain',bvFmt(Math.max(0,bvG('p-cgt')-r.cgt_exempt))]);
    f.push(['CGT payable',bvFmt(res.cgtV||bvCGT(bvG('p-cgt'),bvGS('p-cgttype'),res.totalNonDiv||0))]);
  } else if(key==='ct600'){
    if(cr)f.push(['Company name',cr]);
    f.push(['Accounting period end','As per company records']);
    f.push(['Company turnover',bvFmt(res.turn||0)]);
    f.push(['Business expenses',bvFmt(bvG('b-ltexp'))]);
    f.push(['Director salary',bvFmt(res.dirSal||0)]);
    f.push(['Employer NI',bvFmt(res.empNI||0)]);
    f.push(['Taxable profit',bvFmt(res.profit||0)]);
    f.push(['Corporation tax rate',bvCTRate(res.profit||0)*100===19?'19% (small profits)':'25% (main rate) or marginal relief']);
    f.push(['Corporation tax due',bvFmt(res.corpTax||0)]);
    f.push(['Payment deadline','9 months + 1 day after year end']);
    f.push(['CT600 filing deadline','12 months after year end']);
  } else if(key==='ch_accounts'){
    if(cr)f.push(['Company name',cr]);
    f.push(['Company turnover',bvFmt(res.turn||0)]);
    f.push(['Corporation tax',bvFmt(res.corpTax||0)]);
    f.push(['Accounts filing deadline','9 months after year end']);
  } else if(key==='cs01'){
    if(cr)f.push(['Company name',cr]);
    f.push(['Filing deadline','Within 14 days of confirmation date']);
    f.push(['Confirm: registered address','Review at Companies House']);
    f.push(['Confirm: directors &amp; secretaries','Review at Companies House']);
    f.push(['Confirm: shareholder info','Review at Companies House']);
  } else if(key==='fps'||key==='sa800'||key==='vat'){
    f.push(['Refer to your payroll / VAT software','All figures must be submitted via HMRC-approved software']);
    if(res.dirSal)f.push(['Director salary (PAYE reference)',bvFmt(res.dirSal)]);
    if(res.ni)f.push(['Employee NI contribution',bvFmt(res.ni)]);
    if(res.empNI)f.push(['Employer NI',bvFmt(res.empNI)]);
  } else if(key==='p60'||key==='p11d'){
    f.push(['Issued by employer by','31 May '+yr.split('/')[1]]);
    if(res.gross)f.push(['Gross pay in period',bvFmt(res.gross||bvG('p-sal'))]);
    if(res.it)f.push(['Tax deducted',bvFmt(res.it||0)]);
    f.push(['Employee NI',bvFmt(res.ni||0)]);
  }
  return f;
}

/* Print individual filing sheet */
window.bvFaPrint=function(key){
  var res=bvLastResult,r=R(),f=BV_FA[key],fd=BV_FORMS[key];
  if(!f||!fd)return;
  var cn=bvCN(),cr=bvCR(),fields=bvFaFields(key,res,r,cn,cr);
  var rows='';
  for(var i=0;i<fields.length;i++){
    var bg=i%2===0?'#f8f9fa':'#fff';
    rows+='<tr style="background:'+bg+'"><td style="padding:9px 14px;border-bottom:1px solid #e8eaed;font-size:13px;color:#4a5060;">'+fields[i][0]+'</td><td style="padding:9px 14px;border-bottom:1px solid #e8eaed;font-size:13px;font-weight:700;font-family:monospace;text-align:right;">'+fields[i][1]+'</td></tr>';
  }
  var now=new Date(),ds=now.getDate()+'/'+(now.getMonth()+1)+'/'+now.getFullYear();
  var html='<!DOCTYPE html><html><head><title>Britvex &mdash; '+f.name+'</title></head><body style="font-family:system-ui,sans-serif;margin:0;padding:0;">';
  html+='<div style="background:#0f2744;padding:22px 28px;color:#fff;display:flex;align-items:center;gap:14px;">';
  html+='<div style="width:36px;height:36px;background:#fff;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#0f2744;flex-shrink:0;">BV</div>';
  html+='<div><div style="font-size:16px;font-weight:700;">Britvex Filing Reference Sheet</div><div style="font-size:12px;color:rgba(255,255,255,.55);margin-top:2px;">'+f.num+' &mdash; '+f.name+' &mdash; '+r.yr_label+'</div></div>';
  html+='<div style="margin-left:auto;font-size:11px;color:rgba(255,255,255,.45);">Generated '+ds+'</div></div>';
  html+='<div style="padding:24px 28px;">';
  html+='<table style="width:100%;border-collapse:collapse;border:1px solid #e8eaed;border-radius:8px;overflow:hidden;"><thead><tr style="background:#0f2744;"><th style="padding:10px 14px;text-align:left;color:#fff;font-size:12px;font-weight:600;">Field</th><th style="padding:10px 14px;text-align:right;color:#fff;font-size:12px;font-weight:600;">Your figure</th></tr></thead><tbody>'+rows+'</tbody></table>';
  html+='<div style="margin-top:18px;background:#dbeeff;border-radius:8px;padding:13px 16px;font-size:12px;color:#185FA5;line-height:1.6;">';
  html+='<strong>What to do next:</strong> '+f.inst+'<br><strong>File at: </strong><a href="'+fd.gov+'" style="color:#1e6fbf;">'+fd.gov+'</a></div>';
  html+='<div style="margin-top:18px;padding-top:14px;border-top:1px solid #e8eaed;display:flex;justify-content:space-between;font-size:11px;color:#8a909a;">';
  html+='<span>Britvex UK Tax Calculator &mdash; <a href="https://www.britvex.com" style="color:#1e6fbf;">www.britvex.com</a></span>';
  html+='<span>Need help filing? <a href="https://www.britvex.com/contact-us" style="color:#1e6fbf;">britvex.com/contact-us</a></span></div></div></body></html>';
  var win=window.open('','_blank');if(win){win.document.write(html);win.document.close();setTimeout(function(){win.print();},400);}
};

/* ADVICE */
function bvAdvice(){
  var res=bvLastResult,r=R(),advEl=bvEl('bv-acc-adv');
  if(!advEl)return;
}

/* EMPLOYER COST TOOL */
function bvRenderEmp(){
  var r=R(),res=bvLastResult;
  var sal=0,lbl='';
  if(res.mode==='p'&&bvAnnSal()>0){sal=bvAnnSal();lbl='PAYE gross salary';}
  else if(res.mode==='b'&&res.struct==='ltd'){sal=bvG('b-dirsal');lbl='Director salary';}
  else if(res.mode==='b'&&res.struct==='sole'){sal=Math.max(0,bvG('b-turn')-bvG('b-exp'));lbl='Sole trader profit';}
  if(sal<=0){bvEl('bv-emp-content').innerHTML='<div style="font-size:12px;color:var(--bv-text3)">Enter a salary or profit to calculate.</div>';return;}
  var eni=bvEmpNI(sal),ep=sal*0.03,total=sal+eni+ep;
  var th=res.takeHome||Math.max(0,sal-bvIT(sal)-bvNI(sal));
  var ratio=th>0?(total/th).toFixed(2):'n/a';
  var html='<div class="bv-emp-grid">';
  html+='<div class="bv-emp-card bv-emp-hi"><div class="bv-emp-lbl">Total employer cost</div><div class="bv-emp-val">'+bvFmt(total)+'</div><div class="bv-emp-sub">'+bvFmt(total/12)+' /month</div></div>';
  html+='<div class="bv-emp-card"><div class="bv-emp-lbl">'+lbl+'</div><div class="bv-emp-val">'+bvFmt(sal)+'</div><div class="bv-emp-sub">'+bvFmt(sal/12)+' /month</div></div>';
  html+='<div class="bv-emp-card"><div class="bv-emp-lbl">Employer NI (13.8%)</div><div class="bv-emp-val">'+bvFmt(eni)+'</div><div class="bv-emp-sub">Above &pound;'+r.emp_ni_st.toLocaleString('en-GB')+' secondary threshold</div></div>';
  html+='<div class="bv-emp-card"><div class="bv-emp-lbl">Employer pension (3% min)</div><div class="bv-emp-val">'+bvFmt(ep)+'</div><div class="bv-emp-sub">Auto-enrolment minimum</div></div>';
  html+='<div class="bv-emp-card"><div class="bv-emp-lbl">Cost per &pound;1 take-home</div><div class="bv-emp-val">&pound;'+ratio+'</div><div class="bv-emp-sub">Employer spends this per &pound;1 net pay</div></div>';
  html+='<div class="bv-emp-card"><div class="bv-emp-lbl">Employee take-home</div><div class="bv-emp-val">'+bvFmt(th)+'</div><div class="bv-emp-sub">'+bvFmt(th/12)+' /month net</div></div>';
  html+='</div>';
  var brows=[['Gross salary / profit',bvFmt(sal)],['Employer NI (13.8% above &pound;'+r.emp_ni_st.toLocaleString('en-GB')+')',bvFmt(eni)],['Employer pension (3%)',bvFmt(ep)]];
  for(var i=0;i<brows.length;i++)html+='<div class="bv-row"><span class="bv-rl">'+brows[i][0]+'</span><span class="bv-rr">'+brows[i][1]+'</span><span class="bv-rmo">'+bvFmt(parseFloat(brows[i][1].replace(/[^0-9]/g,''))/12)+'/mo</span></div>';
  html+='<div class="bv-rowt"><span>Total employer cost</span><span class="bv-rr">'+bvFmt(total)+'</span><span class="bv-rmo">'+bvFmt(total/12)+'/mo</span></div>';
  bvEl('bv-emp-content').innerHTML=html;
}

/* SALARY SACRIFICE TOOL */
function bvRenderSac(){
  var res=bvLastResult;
  if(res.mode!=='p'||!bvAnnSal()){bvEl('bv-sac-content').innerHTML='<div style="font-size:12px;color:var(--bv-text3)">Available for PAYE income. Enter salary in Personal tab.</div>';return;}
  var gross=bvAnnSal(),penPct=bvG('p-pen'),penAmt=gross*(penPct/100),car=bvG('p-car'),cc=bvG('p-childcare'),totalSac=penAmt+car+cc;
  if(totalSac===0){bvEl('bv-sac-content').innerHTML='<div style="font-size:12px;color:var(--bv-text3)">Enter pension %, car/cycle scheme, or childcare vouchers in the sidebar to see comparison.</div>';return;}
  var itBef=bvIT(gross),niBef=bvNI(gross),takeBef=gross-itBef-niBef;
  var aftGross=Math.max(0,gross-totalSac),itAft=bvIT(aftGross),niAft=bvNI(aftGross),takeAft=aftGross-itAft-niAft;
  var taxSav=(itBef-itAft)+(niBef-niAft);
  var html='<div class="bv-sac-grid">';
  html+='<div class="bv-sac-card bv-before"><div class="bv-sac-lbl">Without sacrifice</div><div class="bv-sac-val">'+bvFmt(takeBef)+'</div><div class="bv-sac-sub">Annual take-home &mdash; '+bvFmt(takeBef/12)+'/month</div></div>';
  html+='<div class="bv-sac-card bv-after"><div class="bv-sac-lbl">With sacrifice</div><div class="bv-sac-val">'+bvFmt(takeAft)+'</div><div class="bv-sac-sub">Annual take-home &mdash; '+bvFmt(takeAft/12)+'/month</div></div>';
  html+='</div><div class="bv-sac-metrics">';
  html+='<div class="bv-sac-met"><div class="bv-sac-met-lbl">Tax &amp; NI saving</div><div class="bv-sac-met-val bv-saving">'+bvFmt(taxSav)+'</div></div>';
  html+='<div class="bv-sac-met"><div class="bv-sac-met-lbl">Total sacrifice value</div><div class="bv-sac-met-val">'+bvFmt(totalSac)+'</div></div>';
  if(penAmt>0)html+='<div class="bv-sac-met"><div class="bv-sac-met-lbl">Pension ('+penPct+'%)</div><div class="bv-sac-met-val">'+bvFmt(penAmt)+'</div></div>';
  if(car>0)html+='<div class="bv-sac-met"><div class="bv-sac-met-lbl">Car / cycle scheme</div><div class="bv-sac-met-val">'+bvFmt(car)+'</div></div>';
  if(cc>0)html+='<div class="bv-sac-met"><div class="bv-sac-met-lbl">Childcare vouchers</div><div class="bv-sac-met-val">'+bvFmt(cc)+'</div></div>';
  html+='<div class="bv-sac-met"><div class="bv-sac-met-lbl">Net take-home difference</div><div class="bv-sac-met-val" style="color:var(--bv-amber)">'+bvFmt(Math.abs(takeBef-takeAft))+'</div></div>';
  html+='</div>';
  bvEl('bv-sac-content').innerHTML=html;
}

/* ACCORDION */
var BV_ACC_TABS=['dl','forms','fa','download','emp','sac'];
window.bvAcc=function(tab){
  var opening=bvOpenTab!==tab;
  BV_ACC_TABS.forEach(function(t){bvEl('bv-acc-'+t).classList.remove('bv-open');var btn=bvEl('bv-bt-'+t);if(btn)btn.classList.remove('bv-on');});
  if(opening){bvOpenTab=tab;bvEl('bv-acc-'+tab).classList.add('bv-open');var ab=bvEl('bv-bt-'+tab);if(ab)ab.classList.add('bv-on');if(tab==='emp')bvRenderEmp();if(tab==='sac')bvRenderSac();}
  else bvOpenTab='';
};

/* DOWNLOAD CSV */
window.bvDLCSV=function(){
  var res=bvLastResult,r=R(),cn=bvCN(),cr=bvCR();
  var lines=['sep=,'];
  lines.push('"Britvex UK Tax Calculator","'+r.yr_label+'"');
  if(cn)lines.push('"Client name","'+cn+'"');if(cr)lines.push('"Reference","'+cr+'"');
  lines.push('"Region","'+(bvRegion==='scot'?'Scotland':'England / Wales / N. Ireland')+'"');
  lines.push('"Mode","'+(bvModeV==='personal'?'Personal':'Business &mdash; '+bvStructV)+'"');
  lines.push('""');
  lines.push('"Description","Annual","Monthly"');
  for(var i=0;i<bvBreakdownRows.length;i++){
    var lbl=bvBreakdownRows[i][0],val=Math.max(0,Math.round(bvBreakdownRows[i][1])),mo=Math.max(0,Math.round(val/12));
    lines.push('"'+lbl+'","'+val+'","'+mo+'"');
  }
  lines.push('""');lines.push('"REQUIRED FILINGS",""');lines.push('"Form","Deadline","Submit to"');
  var needed=bvDetectForms();
  for(var j=0;j<needed.length;j++){var fd=BV_FORMS[needed[j]];if(fd)lines.push('"'+fd.num+' &mdash; '+fd.name.replace(/&mdash;/g,'-')+'","'+fd.dead+'","'+(fd.ch?'Companies House':'HMRC')+'"');}
  var csv=lines.join('\n').replace(/&mdash;/g,'-').replace(/&amp;/g,'&').replace(/&pound;/g,'GBP').replace(/&ndash;/g,'-');
  var blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
  var url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='britvex-tax-'+r.yr_label.replace('/','_')+'.csv';
  document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
};

/* DOWNLOAD PDF */
window.bvDLPDF=function(){
  var res=bvLastResult,r=R(),cn=bvCN(),cr=bvCR();
  var now=new Date(),ds=now.getDate()+'/'+(now.getMonth()+1)+'/'+now.getFullYear();
  var region=bvRegion==='scot'?'Scotland':'England / Wales / N. Ireland';
  var modeLabel=bvModeV==='personal'?'Personal Tax Summary':('Business &mdash; '+(bvStructV==='sole'?'Sole Trader':bvStructV==='ltd'?'Limited Company (Ltd)':bvStructV==='part'?'Partnership':'Contractor/IR35'));
  var eff=res.totalGross>0?((res.totalTax/res.totalGross)*100).toFixed(1)+'%':'n/a';

  /* Summary cards */
  var cards='<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:12px;margin-bottom:20px;">';
  var cardData=[['Take-home pay',res.takeHome,'#0f2744','#fff'],['Total tax & NI',res.totalTax,'#fff','#1a1e28'],['Income tax',res.it,'#fff','#1a1e28'],['National Insurance',res.ni,'#fff','#1a1e28']];
  for(var c=0;c<cardData.length;c++){
    var bg=cardData[c][2],col=cardData[c][3];
    cards+='<div style="background:'+bg+';border:1px solid #e0e3e8;border-radius:8px;padding:14px;">';
    cards+='<div style="font-size:10px;color:'+(bg==='#0f2744'?'rgba(255,255,255,.5)':'#8a909a')+';text-transform:uppercase;letter-spacing:.04em;margin-bottom:5px;">'+cardData[c][0]+'</div>';
    cards+='<div style="font-size:20px;font-weight:700;font-family:monospace;color:'+col+';">'+bvFmt(cardData[c][1]||0)+'</div>';
    cards+='<div style="font-size:10px;color:'+(bg==='#0f2744'?'rgba(255,255,255,.4)':'#8a909a')+';margin-top:3px;">'+bvFmt((cardData[c][1]||0)/12)+' /month</div>';
    cards+='</div>';
  }
  cards+='</div>';

  /* Breakdown table */
  var trs='';
  for(var i=0;i<bvBreakdownRows.length;i++){
    var lbl=bvBreakdownRows[i][0],val=bvBreakdownRows[i][1];
    var bg2=i%2===0?'#f8f9fa':'#fff';
    var isTot=lbl.indexOf('TOTAL')===0||lbl.indexOf('NET')===0||lbl.indexOf('TAKE-HOME')===0||lbl.indexOf('DIRECTOR')===0;
    var fw=isTot?'font-weight:700;border-top:2px solid #e0e3e8;':'';
    trs+='<tr style="background:'+bg2+'"><td style="padding:8px 12px;border-bottom:1px solid #e8eaed;font-size:12px;'+fw+'color:#4a5060;">'+lbl+'</td><td style="padding:8px 12px;border-bottom:1px solid #e8eaed;font-size:12px;font-family:monospace;text-align:right;'+fw+'color:#1a1e28;">'+bvFmt(val)+'</td><td style="padding:8px 12px;border-bottom:1px solid #e8eaed;font-size:11px;font-family:monospace;text-align:right;color:#8a909a;">'+bvFmt(val/12)+'/mo</td></tr>';
  }

  /* Forms table */
  var needed=bvDetectForms(),ftrs='';
  for(var j=0;j<needed.length;j++){
    var fd=BV_FORMS[needed[j]];if(!fd)continue;
    var dest=fd.ch?'Companies House':'HMRC';
    ftrs+='<tr style="background:'+(j%2===0?'#f8f9fa':'#fff')+'"><td style="padding:8px 12px;border-bottom:1px solid #e8eaed;font-size:12px;font-weight:700;color:#0f2744;">'+fd.num+'</td><td style="padding:8px 12px;border-bottom:1px solid #e8eaed;font-size:12px;color:#4a5060;">'+fd.name.replace(/&mdash;/g,'—').replace(/&amp;/g,'&')+'</td><td style="padding:8px 12px;border-bottom:1px solid #e8eaed;font-size:11px;color:#b86800;font-weight:600;">'+fd.dead+'</td><td style="padding:8px 12px;border-bottom:1px solid #e8eaed;font-size:11px;color:#4a5060;">'+dest+'</td></tr>';
  }

  var html='<!DOCTYPE html><html><head><title>Britvex Tax Report &mdash; '+r.yr_label+'</title></head><body style="font-family:system-ui,sans-serif;margin:0;padding:0;font-size:13px;color:#1a1e28;">';
  html+='<div style="background:#0f2744;padding:24px 30px;color:#fff;">';
  html+='<div style="display:flex;align-items:center;gap:14px;margin-bottom:14px;">';
  html+='<div style="width:38px;height:38px;background:#fff;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#0f2744;flex-shrink:0;">BV</div>';
  html+='<div><div style="font-size:18px;font-weight:700;">Britvex Tax Report</div><div style="font-size:12px;color:rgba(255,255,255,.55);margin-top:2px;">Full tax summary &mdash; '+modeLabel+'</div></div></div>';
  html+='<div style="display:grid;grid-template-columns:repeat(5,auto);gap:20px;font-size:11px;color:rgba(255,255,255,.6);">';
  if(cn)html+='<span>Client: <strong style="color:#fff;">'+cn+'</strong></span>';
  if(cr)html+='<span>Ref: <strong style="color:#fff;">'+cr+'</strong></span>';
  html+='<span>Tax year: <strong style="color:#fff;">'+r.yr_label+'</strong></span>';
  html+='<span>Region: <strong style="color:#fff;">'+region+'</strong></span>';
  html+='<span>Date: <strong style="color:#fff;">'+ds+'</strong></span>';
  html+='<span>Effective rate: <strong style="color:#fff;">'+eff+'</strong></span></div></div>';
  html+='<div style="padding:24px 30px;">';
  html+=cards;
  html+='<h3 style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#8a909a;margin-bottom:10px;">Full breakdown</h3>';
  html+='<table style="width:100%;border-collapse:collapse;margin-bottom:22px;"><thead><tr style="background:#0f2744;"><th style="padding:9px 12px;text-align:left;color:#fff;font-size:11px;font-weight:600;">Description</th><th style="padding:9px 12px;text-align:right;color:#fff;font-size:11px;font-weight:600;">Annual</th><th style="padding:9px 12px;text-align:right;color:#fff;font-size:11px;font-weight:600;">Monthly</th></tr></thead><tbody>'+trs+'</tbody></table>';
  if(ftrs){
    html+='<h3 style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#8a909a;margin-bottom:10px;">Required filings</h3>';
    html+='<table style="width:100%;border-collapse:collapse;margin-bottom:22px;"><thead><tr style="background:#0f2744;"><th style="padding:9px 12px;text-align:left;color:#fff;font-size:11px;">Form</th><th style="padding:9px 12px;text-align:left;color:#fff;font-size:11px;">Description</th><th style="padding:9px 12px;text-align:left;color:#fff;font-size:11px;">Deadline</th><th style="padding:9px 12px;text-align:left;color:#fff;font-size:11px;">Submit to</th></tr></thead><tbody>'+ftrs+'</tbody></table>';
  }
  html+='<div style="background:#e8f0f7;border-radius:8px;padding:13px 16px;font-size:11px;color:#185FA5;line-height:1.6;margin-bottom:18px;"><strong>Disclaimer:</strong> These are estimates only based on information provided and HMRC '+r.yr_label+' rates. Not financial or tax advice. Consult a qualified adviser before making decisions.</div>';
  html+='<div style="display:flex;justify-content:space-between;align-items:center;padding-top:14px;border-top:1px solid #e0e3e8;font-size:11px;color:#8a909a;">';
  html+='<span>Britvex UK Tax Calculator &mdash; <a href="https://www.britvex.com" style="color:#1e6fbf;">www.britvex.com</a></span>';
  html+='<span>Professional tax help: <a href="https://www.britvex.com/contact-us" style="color:#1e6fbf;">britvex.com/contact-us</a></span></div></div></body></html>';
  var win=window.open('','_blank');if(win){win.document.write(html);win.document.close();setTimeout(function(){win.print();},500);}
};

/* UI HANDLERS */
window.bvMode=function(m){bvModeV=m;bvEl('bv-pp').classList.toggle('bv-hidden',m!=='personal');bvEl('bv-bp').classList.toggle('bv-hidden',m!=='business');bvEl('bv-btn-p').classList.toggle('bv-on',m==='personal');bvEl('bv-btn-b').classList.toggle('bv-on',m==='business');bvEl('bv-title').textContent=m==='personal'?'Personal Tax Summary':'Business Tax Summary';bvCalc();};
window.bvTogInc=function(btn){var inc=btn.getAttribute('data-inc');if(bvInc[inc]){if(Object.keys(bvInc).length===1)return;delete bvInc[inc];btn.classList.remove('bv-on');}else{bvInc[inc]=true;btn.classList.add('bv-on');}bvEl('bv-inc-'+inc).classList.toggle('bv-show',!!bvInc[inc]);bvCalc();};
window.bvStruct=function(){bvStructV=bvGS('b-struct');['sole','ltd','part','cont'].forEach(function(s){bvEl('bv-biz-'+s).classList.toggle('bv-show',s===bvStructV);});bvCalc();};
window.bvSetVAT=function(v){bvVAT=v;bvEl('bv-vat-y').classList.toggle('bv-on',v);bvEl('bv-vat-n').classList.toggle('bv-on',!v);bvCalc();};
window.bvSetLtdVAT=function(v){bvLtdVAT=v;bvEl('bv-ltdvat-y').classList.toggle('bv-on',v);bvEl('bv-ltdvat-n').classList.toggle('bv-on',!v);bvCalc();};
window.bvSetDTA=function(v){bvDTA=v;bvEl('bv-dta-y').classList.toggle('bv-on',v);bvEl('bv-dta-n').classList.toggle('bv-on',!v);bvCalc();};
window.bvSetBP=function(v){bvBPV=v;bvEl('bv-bpp-y').classList.toggle('bv-on',v);bvEl('bv-bpp-n').classList.toggle('bv-on',!v);bvEl('bv-bpf').classList.toggle('bv-show',v);bvCalc();};
window.bvSetMA=function(v){bvMA=v;bvEl('bv-ma-y').classList.toggle('bv-on',v);bvEl('bv-ma-n').classList.toggle('bv-on',!v);bvCalc();};
window.bvSetBPA=function(v){bvBPA=v;bvEl('bv-bpa-y').classList.toggle('bv-on',v);bvEl('bv-bpa-n').classList.toggle('bv-on',!v);bvCalc();};
window.bvSetCB=function(v){bvCB=v;bvEl('bv-cb-y').classList.toggle('bv-on',v);bvEl('bv-cb-n').classList.toggle('bv-on',!v);bvEl('bv-cb-f').classList.toggle('bv-show',v);bvCalc();};
window.bvSetRAR=function(v){bvRAR=v;bvEl('bv-rar-y').classList.toggle('bv-on',v);bvEl('bv-rar-n').classList.toggle('bv-on',!v);bvCalc();};
window.bvSetTA=function(v){bvTA=v;bvEl('bv-ta-y').classList.toggle('bv-on',v);bvEl('bv-ta-n').classList.toggle('bv-on',!v);bvCalc();};
window.bvSetYear=function(y){bvYear=y;bvEl('bv-yr-2425').classList.toggle('bv-yr-on',y==='2425');bvEl('bv-yr-2526').classList.toggle('bv-yr-on',y==='2526');bvEl('bv-subtitle').textContent=(bvRegion==='scot'?'Scotland':'England / Wales / N. Ireland')+' \u00b7 '+(y==='2425'?'2024/25':'2025/26');bvCalc();};
window.bvSetPeriod=function(p){bvPeriod=p;bvEl('bv-per-a').classList.toggle('bv-on',p==='a');bvEl('bv-per-m').classList.toggle('bv-on',p==='m');bvCalc();};
/* region listener registered in bvReadyRun */
window.bvCalc=function(){if(bvModeV==='personal')bvCalcPersonal();else bvCalcBusiness();};

/* CLEAR ALL */
window.bvClearAll=function(){
  var numIds=['p-sal','p-pen','p-car','p-childcare','p-bik','p-se','p-rent','p-rent-exp','p-mort','p-div','p-sav','p-for','p-fortax','p-statep','p-privp','p-cgt','p-giftaid','p-cb','b-turn','b-exp','b-capall','b-ltturn','b-ltexp','b-dirsal','b-emps','b-avgsal','b-rd','b-ppart','b-pshare','b-npart','b-cval','b-cexp','b-pinc','bv-cname','bv-cref'];
  for(var i=0;i<numIds.length;i++){var el=document.getElementById(numIds[i]);if(el)el.value='';}
  bvMA=false;bvBPA=false;bvCB=false;bvRAR=false;bvTA=false;bvDTA=false;bvVAT=false;bvLtdVAT=false;bvBPV=false;
  var togglePairs=[['bv-ma-y','bv-ma-n'],['bv-bpa-y','bv-bpa-n'],['bv-cb-y','bv-cb-n'],['bv-rar-y','bv-rar-n'],['bv-ta-y','bv-ta-n'],['bv-dta-y','bv-dta-n'],['bv-vat-y','bv-vat-n'],['bv-ltdvat-y','bv-ltdvat-n'],['bv-bpp-y','bv-bpp-n']];
  for(var j=0;j<togglePairs.length;j++){var y=document.getElementById(togglePairs[j][0]),n=document.getElementById(togglePairs[j][1]);if(y)y.classList.remove('bv-on');if(n)n.classList.add('bv-on');}
  document.getElementById('bv-cb-f').classList.remove('bv-show');
  document.getElementById('bv-bpf').classList.remove('bv-show');
  bvLastResult={};bvBreakdownRows=[];
  bvShowEmpty();
};

function bvShowEmpty(){
  bvEl('bv-bda').innerHTML='<div class="bv-empty-state"><div class="bv-empty-icon">&#128221;</div><div class="bv-empty-title">Enter your income details</div><div class="bv-empty-sub">Use the sidebar to enter salary, income sources or business details.<br>Results update live as you type.</div></div>';
  bvEl('bv-th').textContent='-';bvEl('bv-thmo').textContent='';
  bvEl('bv-totax').textContent='-';bvEl('bv-totaxmo').textContent='';
  bvEl('bv-itax').textContent='-';bvEl('bv-itaxmo').textContent='';
  bvEl('bv-ni').textContent='-';bvEl('bv-nimo').textContent='';
  bvEl('bv-effr').textContent='Effective rate -';bvEl('bv-eff-b').textContent='-%';
  bvEl('bv-b0').style.width='0%';bvEl('bv-b1').style.width='0%';bvEl('bv-b2').style.width='0%';bvEl('bv-b3').style.width='0%';bvEl('bv-b4').style.width='0%';
  bvEl('bv-dlg').innerHTML='<div style="font-size:12px;color:var(--bv-text3);grid-column:1/-1">Enter your details to see filing deadlines.</div>';
  bvEl('bv-forms-list').innerHTML='<div style="font-size:12px;color:var(--bv-text3)">Enter your details to see required filings.</div>';
  bvEl('bv-fa-list').innerHTML='<div style="font-size:12px;color:var(--bv-text3)">Enter your details to generate filing reference sheets.</div>';
  bvEl('bv-emp-content').innerHTML='<div style="font-size:12px;color:var(--bv-text3)">Enter a salary to see employer cost.</div>';
  bvEl('bv-sac-content').innerHTML='<div style="font-size:12px;color:var(--bv-text3)">Enter pension % or sacrifice amounts to see comparison.</div>';
  bvEl('bv-opt').classList.add('bv-hidden');
}

bvShowEmpty();
bvEl('bv-region').addEventListener('change',function(){
  bvRegion=this.value;
  bvEl('bv-subtitle').textContent=(bvRegion==='scot'?'Scotland':'England / Wales / N. Ireland')+' \u00b7 '+(bvYear==='2425'?'2024/25':'2025/26');
  bvCalc();
});
})();