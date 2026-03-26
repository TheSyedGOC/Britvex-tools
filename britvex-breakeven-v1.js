(function(){
function beG(id){return parseFloat(document.getElementById(id).value)||0;}
function beEl(id){return document.getElementById(id);}
function beFmt(v){return '\u00a3'+Math.max(0,Math.round(v)).toLocaleString('en-GB');}
function beFmtD(v){return '\u00a3'+(Math.max(0,v)).toLocaleString('en-GB',{minimumFractionDigits:2,maximumFractionDigits:2});}

function beCalc(){
  var fixed=beG('be-fixed'),varCost=beG('be-var'),price=beG('be-price');
  var target=beG('be-target'),currentUnits=beG('be-current');

  if(fixed<=0||price<=0){
    beEl('be-result').innerHTML='<div style="text-align:center;padding:40px 20px;color:#8a909a"><div style="font-size:32px;margin-bottom:10px">📉</div><div style="font-size:14px;font-weight:600;margin-bottom:5px">Enter your costs and price</div><div style="font-size:12px">Fill in fixed costs, variable cost per unit and selling price.</div></div>';
    return;
  }

  if(price<=varCost){
    beEl('be-result').innerHTML='<div style="background:#fdecea;border:1px solid #f5a9a3;border-radius:8px;padding:14px;color:#c0392b;font-size:13px"><strong>Error:</strong> Selling price must be higher than variable cost per unit. At current prices every unit sold makes a loss.</div>';
    return;
  }

  var contribution=price-varCost;
  var cmRatio=contribution/price;
  var beUnits=fixed/contribution;
  var beRevenue=beUnits*price;
  var targetUnits=target>0?(fixed+target)/contribution:0;
  var targetRevenue=targetUnits*price;

  // Current performance
  var currentRevenue=currentUnits*price;
  var currentProfit=currentUnits>0?currentRevenue-fixed-(currentUnits*varCost):0;
  var marginOfSafety=currentUnits>0?Math.max(0,(currentUnits-beUnits)/currentUnits):0;
  var mosRevenue=currentUnits>0?Math.max(0,currentRevenue-beRevenue):0;

  var html='';

  // Cards
  html+='<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin-bottom:14px">';
  html+=beCard('Break-even units',Math.ceil(beUnits).toLocaleString('en-GB')+' units','Units to cover all costs','bv-pri');
  html+=beCard('Break-even revenue',beFmt(beRevenue),'Revenue needed to break even','');
  html+=beCard('Contribution margin',beFmtD(contribution)+' / unit','('+Math.round(cmRatio*100)+'% of price)','');
  html+='</div>';

  if(currentUnits>0){
    html+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">';
    html+='<div style="background:#fff;border:1px solid var(--bv-border,#e0e3e8);border-radius:8px;padding:12px 14px">';
    html+='<div style="font-size:10px;color:#8a909a;font-weight:600;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px">Current profit / loss</div>';
    html+='<div style="font-size:20px;font-weight:700;font-family:monospace;color:'+(currentProfit>=0?'#1a7a4a':'#c0392b')+'">'+beFmt(Math.abs(currentProfit))+'</div>';
    html+='<div style="font-size:10px;color:#8a909a;margin-top:3px">'+(currentProfit>=0?'Profit at '+currentUnits.toLocaleString()+' units':'Loss at '+currentUnits.toLocaleString()+' units')+'</div></div>';
    html+='<div style="background:#fff;border:1px solid var(--bv-border,#e0e3e8);border-radius:8px;padding:12px 14px">';
    html+='<div style="font-size:10px;color:#8a909a;font-weight:600;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px">Margin of safety</div>';
    html+='<div style="font-size:20px;font-weight:700;font-family:monospace;color:#1e6fbf">'+Math.round(marginOfSafety*100)+'%</div>';
    html+='<div style="font-size:10px;color:#8a909a;margin-top:3px">'+beFmt(mosRevenue)+' buffer above break-even</div></div>';
    html+='</div>';
  }

  // Breakdown table
  html+='<div style="background:#fff;border:1px solid var(--bv-border,#e0e3e8);border-radius:10px;padding:14px 16px;margin-bottom:12px">';
  html+='<div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#8a909a;margin-bottom:10px">Full breakdown</div>';
  var rows=[
    ['Selling price per unit',beFmtD(price),''],
    ['Variable cost per unit',beFmtD(varCost),'red'],
    ['Contribution per unit',beFmtD(contribution),'grn'],
    ['Contribution margin ratio',Math.round(cmRatio*100)+'%',''],
    ['Fixed costs (annual)',beFmt(fixed),''],
    ['Break-even units',Math.ceil(beUnits).toLocaleString('en-GB')+' units',''],
    ['Break-even revenue',beFmt(beRevenue),'']
  ];
  if(currentUnits>0){
    rows.push(['Current units sold',currentUnits.toLocaleString('en-GB')+' units','']);
    rows.push(['Current revenue',beFmt(currentRevenue),'']);
    rows.push(['Current profit / loss',beFmt(Math.abs(currentProfit)),currentProfit>=0?'grn':'red']);
    rows.push(['Margin of safety',Math.round(marginOfSafety*100)+'%','']);
  }
  if(target>0){
    rows.push(['Target profit',beFmt(target),'']);
    rows.push(['Units needed for target',Math.ceil(targetUnits).toLocaleString('en-GB')+' units','amb']);
    rows.push(['Revenue needed for target',beFmt(targetRevenue),'amb']);
  }
  for(var i=0;i<rows.length;i++){
    html+='<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f5f6f8;font-size:12px"><span style="color:#4a5060">'+rows[i][0]+'</span><span style="font-family:monospace;font-weight:600;color:'+(rows[i][2]==='grn'?'#1a7a4a':rows[i][2]==='red'?'#c0392b':rows[i][2]==='amb'?'#b86800':'#1a1e28')+'">'+rows[i][1]+'</span></div>';
  }
  html+='</div>';

  // Visual bar showing cost structure
  var totalAtBE=beRevenue;
  var fixedPct=totalAtBE>0?fixed/totalAtBE*100:0;
  var varPct=totalAtBE>0?(beUnits*varCost)/totalAtBE*100:0;
  html+='<div style="background:#fff;border:1px solid var(--bv-border,#e0e3e8);border-radius:10px;padding:14px 16px;margin-bottom:12px">';
  html+='<div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#8a909a;margin-bottom:10px">Cost structure at break-even</div>';
  html+='<div style="height:10px;border-radius:99px;overflow:hidden;display:flex;margin-bottom:10px">';
  html+='<div style="width:'+fixedPct.toFixed(1)+'%;background:#0f2744;border-radius:99px 0 0 99px"></div>';
  html+='<div style="width:'+varPct.toFixed(1)+'%;background:#1e6fbf"></div>';
  html+='</div>';
  html+='<div style="display:flex;gap:14px;flex-wrap:wrap"><div style="display:flex;align-items:center;gap:5px;font-size:11px;color:#4a5060"><div style="width:9px;height:9px;border-radius:50%;background:#0f2744"></div>Fixed costs '+Math.round(fixedPct)+'%</div>';
  html+='<div style="display:flex;align-items:center;gap:5px;font-size:11px;color:#4a5060"><div style="width:9px;height:9px;border-radius:50%;background:#1e6fbf"></div>Variable costs '+Math.round(varPct)+'%</div></div></div>';

  if(marginOfSafety>0&&marginOfSafety<0.15){
    html+='<div style="background:#fff3d6;border:1px solid #f0c87a;border-radius:8px;padding:10px 13px;font-size:12px;color:#b86800;margin-bottom:10px">⚠️ <strong>Low margin of safety ('+Math.round(marginOfSafety*100)+'%)</strong> &mdash; A small drop in sales would put the business below break-even. Consider ways to reduce fixed costs or increase contribution margin.</div>';
  }
  if(cmRatio<0.2){
    html+='<div style="background:#fff3d6;border:1px solid #f0c87a;border-radius:8px;padding:10px 13px;font-size:12px;color:#b86800;margin-bottom:10px">⚠️ <strong>Low contribution margin ('+Math.round(cmRatio*100)+'%)</strong> &mdash; Variable costs are high relative to price. Consider whether pricing can be increased or variable costs reduced.</div>';
  }

  html+='<div style="text-align:center;padding:6px 0"><a href="https://www.britvex.com/contact-us" target="_blank" style="display:inline-block;background:#0f2744;color:#fff;font-size:12px;font-weight:700;padding:10px 20px;border-radius:6px;text-decoration:none">Discuss your business financials with Britvex &rarr;</a></div>';

  beEl('be-result').innerHTML=html;
}

function beCard(lbl,val,sub,cls){
  var bg=cls==='bv-pri'?'background:#0f2744;border-color:#0f2744':'background:#fff;border-color:#e0e3e8';
  var tc=cls==='bv-pri'?'color:#fff':'color:#1a1e28';
  var sc=cls==='bv-pri'?'color:rgba(255,255,255,.4)':'color:#8a909a';
  var lc=cls==='bv-pri'?'color:rgba(255,255,255,.5)':'color:#8a909a';
  return '<div style="'+bg+';border:1px solid;border-radius:10px;padding:13px;box-shadow:0 1px 3px rgba(0,0,0,.05)"><div style="font-size:10px;font-weight:500;text-transform:uppercase;letter-spacing:.04em;'+lc+';margin-bottom:4px">'+lbl+'</div><div style="font-size:18px;font-weight:700;font-family:monospace;'+tc+'">'+val+'</div><div style="font-size:10px;'+sc+';margin-top:3px">'+sub+'</div></div>';
}

window.beCalc=beCalc;
})();
