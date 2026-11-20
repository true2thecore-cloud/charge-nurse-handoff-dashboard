import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { stripTypeScriptTypes } from 'node:module';
function load(file) {
  const context = vm.createContext({ console, Date, JSON, Set, Number, Array, String, Error, ExcelScript:{ClearApplyTo:{contents:'contents'},CalculationType:{full:'full'}} });
  vm.runInContext(stripTypeScriptTypes(fs.readFileSync(new URL('../scripts/'+file,import.meta.url),'utf8')),context);
  return context;
}
function sheet(seed={}) {
  const cells={...seed}; const writes=[];
  return {cells,writes,getRange(a){return {getValue:()=>cells[a]??'',getValues:()=>cells[a]??[['']],getTexts:()=>cells[a],setValue:v=>{cells[a]=v;writes.push(a)},setValues:v=>{cells[a]=v;writes.push(a)},setNumberFormatLocal(){},clear(){writes.push('clear:'+a)}};}};
}
const e=load('ExportStaffing.ts'); const u=load('UpdateDashboard.ts'); const i=load('ImportStaffing.ts');
test('Friday, weekends, month and year boundaries choose next weekday',()=>{
  for(const [a,b]of [['2026-11-20','2026-11-23'],['2026-11-21','2026-11-23'],['2026-11-22','2026-11-23'],['2026-01-30','2026-02-02'],['2027-12-31','2028-01-03'],['2028-02-28','2028-02-29']])assert.equal(e.chooseDate(a,'next-business-day',''),b);
});
test('same and explicit dates allow weekend staffing',()=>{
  assert.equal(e.chooseDate('2026-11-21','same-date',''),'2026-11-21');
  assert.equal(e.chooseDate('2026-11-20','explicit-date','2026-11-22'),'2026-11-22');
  assert.equal(e.formatTab('2026-11-23'),'11-23-26');
  assert.throws(()=>e.chooseDate('2026-02-30','same-date',''),/Invalid calendar/);
  assert.throws(()=>e.chooseDate('2026-11-20','wrong',''),/Use next/);
});
test('export fails on missing or stale tab, includes L46',()=>{
  assert.throws(()=>e.main({getWorksheet:()=>undefined},'2026-11-20'),/not found/);
  const s=sheet({B1:'2026-11-16'});
  const wb={getWorksheet:()=>s,getApplication:()=>({calculate(){}})};
  assert.throws(()=>e.main(wb,'2026-11-20'),/B1 must match/);
  s.cells.B1='2026-11-23'; s.cells['A1:L46']=Array.from({length:46},()=>Array(12).fill(''));s.cells['A1:L46'][45][11]='Name CST 01';
  const p=JSON.parse(e.main(wb,'2026-11-20'));assert.equal(p.values[45][11],'Name CST 01');assert.equal(p.sourceSheet,'11-23-26');
});
test('latest response follows timestamp rather than worksheet row order',()=>{
  const s={ResponseIdHeader:'ResponseId',TimestampHeader:'SubmittedUtc',TimestampMode:'iso'};
  const p={headers:['ResponseId','SubmittedUtc'],rows:[['new','2026-11-20T15:00:00Z'],['old','2026-11-19T15:00:00Z']]};
  assert.equal(u.selectLatest(p,s,'old')[0],'new');
  assert.throws(()=>u.selectLatest(p,s,'missing'),/not visible yet/);
  p.rows.push(['missing-time','']);assert.throws(()=>u.selectLatest(p,s,''),/ISO timestamp/);
});
test('UTC and offset timestamps agree and ambiguous local times fail',()=>{
  assert.equal(u.parseTimestamp('2026-11-20T15:00:00Z','iso'),u.parseTimestamp('2026-11-20T10:00:00-05:00','iso'));
  assert.equal(u.parseTimestamp(25569,'excel-utc'),0);
  assert.throws(()=>u.parseTimestamp('11/20/2026 10:00 AM','iso'),/ISO timestamp/);
});
test('blank and uncertain answers are never marked complete',()=>{
  assert.equal(u.status('','yes-good'),'NOT REPORTED');assert.equal(u.status('Maybe','yes-good'),'REVIEW RESPONSE');
  assert.equal(u.status('Yes','no-good'),'ACTION NEEDED');assert.equal(u.status('No','no-good'),'COMPLETE');
  assert.equal(u.status('None','info'),'REPORTED');
  assert.equal(u.safeText('=HYPERLINK("x")'),'\'=HYPERLINK("x")');
});
test('mapping validation rejects missing columns, repeated destinations and unknown rules',()=>{
  const m={header:'CallOuts',label:'Call outs',slot:'callouts',rule:'no-good'};
  assert.throws(()=>u.validateMappings([m],[]),/missing/);assert.throws(()=>u.validateMappings([m,m],['CallOuts']),/Duplicate/);
  assert.throws(()=>u.validateMappings([{...m,rule:'guess'}],['CallOuts']),/Unknown alert/);
});
test('full dashboard run uses configured destinations, keeps source and staffing unchanged',()=>{
  const dash=sheet(); const setup=sheet({'A4:B9':[['ResponseTable','HandoffResponses'],['TimestampHeader','SubmittedUtc'],['ResponseIdHeader','ResponseId'],['TimestampMode','iso'],['DisplayTimeZone','America/New_York']]});
  const headers=['ResponseId','SubmittedUtc','Reporter','Shift','CallOuts','CallOutNames','Comments','Issues','PutBacks','AddOns'];
  const source=[['R1','2026-11-20T15:00:00Z','Name RN','Night','Yes','Name CST','Review equipment','Supply issue','No','Yes']];
  const maps=[['Reporter','Reporter','reporter','info','Yes'],['Shift','Shift','shift','info','Yes'],['CallOuts','Call-outs','callouts','no-good','Yes'],['CallOutNames','Staff called out','calloutNames','info','Yes'],['Comments','Notes','comments','info','Yes'],['Issues','Issues','issues','info','Yes'],['PutBacks','Put-backs','putbacks','yes-good','Yes'],['AddOns','Add-ons','addons','yes-good','Yes']];
  const before=JSON.stringify(source);
  const wb={getWorksheet:n=>n==='Setup'?setup:dash,getTable:n=>({getRowCount:()=>n==='DashboardMap'?maps.length:source.length,getRangeBetweenHeaderAndTotal:()=>({getValues:()=>n==='DashboardMap'?maps:source}),getHeaderRowRange:()=>({getTexts:()=>[headers]})})};
  assert.equal(JSON.parse(u.main(wb,'R1')).responseId,'R1');
  assert.equal(dash.cells.B5,'Name RN');assert.equal(dash.cells.F5,'Night');assert.equal(dash.cells.A18,'Name CST');assert.equal(dash.cells.A22,'Review equipment');assert.equal(dash.cells.A26,'Supply issue');assert.equal(dash.cells.A30,'No');assert.equal(dash.cells.D11,'Yes');
  assert.equal(dash.cells.G10,'ACTION NEEDED');assert.equal(JSON.stringify(source),before);
  assert.ok(!dash.writes.some(a=>['B34','B35','A36'].includes(a)));
  u.main(wb,'R1');assert.equal(dash.cells.A18,'Name CST');
});
test('import validates shape before writing and rejects an older snapshot',()=>{
  const view=sheet();const dash=sheet();const wb={getWorksheet:n=>n==='Staffing View'?view:dash};
  const p={version:1,sourceSheet:'11-23-26',staffingDate:'2026-11-23',capturedUtc:'2026-11-20T19:45:00Z',values:Array.from({length:46},()=>Array(12).fill(''))};
  p.values[45][11]='Name RN 05';p.values[3][2]='=malicious';i.main(wb,JSON.stringify(p));assert.equal(view.cells['A7:L52'][45][11],'Name RN 05');assert.equal(view.cells['A7:L52'][3][2],"'=malicious");
  const before=JSON.stringify(view.cells['A7:L52']);p.capturedUtc='2026-11-19T19:45:00Z';assert.throws(()=>i.main(wb,JSON.stringify(p)),/older snapshot/);assert.equal(JSON.stringify(view.cells['A7:L52']),before);
  p.values.pop();assert.throws(()=>i.main(wb,JSON.stringify(p)),/46 rows/);
});
