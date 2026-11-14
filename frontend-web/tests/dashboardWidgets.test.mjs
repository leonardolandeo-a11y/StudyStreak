import test from 'node:test';
import assert from 'node:assert/strict';
const { defaultWidgets, parseWidgets, moveWidget, widgetKey, createWidgetStore } = await import('../src/features/dashboard/widgetPreferences.ts');
test('layouts normalize corrupt, partial, duplicate and unknown entries without retaining private fields', () => {
 for(const raw of [null,'bad','null','{}','42']) assert.deepEqual(parseWidgets(raw),defaultWidgets());
 const rows=parseWidgets(JSON.stringify([{id:'quick',visible:false,token:'never persist'}, {id:'quick',visible:true},{id:'invented',visible:true},null,{id:'streak',visible:'false'}]));
 assert.equal(rows.length,9);assert.deepEqual(rows[0],{id:'quick',visible:false});assert.equal(new Set(rows.map(r=>r.id)).size,9);
 assert.equal(rows.find(r=>r.id==='streak').visible,true);assert.ok(!JSON.stringify(rows).includes('token'));
});
test('accessible moves, visibility and default restoration preserve every widget', () => {
 const original=defaultWidgets();assert.equal(moveWidget(original,original[0].id,-1),original);
 const moved=moveWidget(original,'quick',-1);assert.equal(moved[6].id,'quick');assert.equal(original[7].id,'quick');
 assert.deepEqual(parseWidgets(JSON.stringify(original.map(r=>({...r,visible:false})))).map(r=>r.visible),Array(9).fill(false));
 assert.deepEqual(defaultWidgets(),original);
});
test('storage isolates accounts, survives a new instance and serializes writes', async () => {
 const disk=new Map(),writes=[];
 const store=id=>createWidgetStore({read:async()=>disk.get(widgetKey(id))??null,write:async raw=>{writes.push(id);await Promise.resolve();disk.set(widgetKey(id),raw);}});
 const a=store(101),b=store(202);await Promise.all([a.hydrate(),b.hydrate()]);
 const changed=moveWidget(defaultWidgets(),'quick',-1).map(r=>r.id==='goals'?{...r,visible:false}:r);
 await Promise.all([a.save(defaultWidgets()),a.save(changed)]);assert.deepEqual(b.getSnapshot().rows,defaultWidgets());
 const restored=store(101);await restored.hydrate();assert.deepEqual(restored.getSnapshot().rows,changed);assert.deepEqual(writes,[101,101]);
 assert.throws(()=>widgetKey(0));assert.throws(()=>widgetKey(NaN));
});
test('late hydration cannot replace a preview and storage failure remains explicit and retryable', async () => {
 let resolveRead,fail=true;
 const store=createWidgetStore({read:()=>new Promise(r=>resolveRead=r),write:async()=>{if(fail)throw Error('blocked');}});
 const hydration=store.hydrate();const next=moveWidget(defaultWidgets(),'quick',-1);
 await store.save(next);assert.match(store.getSnapshot().error,/could not be saved/);
 resolveRead(JSON.stringify(defaultWidgets()));await hydration;assert.deepEqual(store.getSnapshot().rows,next);
 fail=false;await store.save(next);assert.equal(store.getSnapshot().error,null);
});
test('legacy Mobile layouts migrate on Web without changing old order or visibility',async()=>{
 const mobile=await import('../../frontend-mobile/src/features/dashboard/widgetPreferences.ts');
 const legacy=mobile.defaultWidgets().reverse().map(row=>({...row,visible:row.id!=='goals'}));
 const migrated=parseWidgets(JSON.stringify(legacy));
 assert.deepEqual(migrated.slice(0,legacy.length),legacy);
 assert.deepEqual(migrated.at(-1),{id:'calendar',visible:false});
 assert.equal(widgetKey(101),mobile.widgetKey(101));
});
