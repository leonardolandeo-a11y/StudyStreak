import assert from 'node:assert/strict';
import { test } from 'node:test';
import { confirmGoalWrite, validateGoalDifficulty, GoalWriteUnconfirmedError } from '../src/utils/goalWrite.ts';
const goal={id:7,topic:'Test',frequency:3,duration:25,completed:false};
test('confirms each chosen difficulty from the authoritative GET, not from local state',async()=>{
 for(const difficulty of ['TRIVIAL','EASY','INTERMEDIATE','HARD']){
  let calls=0;
  const persisted=await confirmGoalWrite({...goal,difficulty},{...goal,difficulty},async id=>{calls++;assert.equal(id,7);return {...goal,difficulty};});
  assert.equal(persisted.difficulty,difficulty);assert.equal(calls,1);
 }
});
test('a legacy 2xx missing difficulty never confirms the write or invents the requested value',async()=>{
 await assert.rejects(confirmGoalWrite(goal,{...goal,difficulty:'EASY'},async()=>goal),e=>e instanceof GoalWriteUnconfirmedError&&e.goalId===7);
 await assert.rejects(confirmGoalWrite({...goal,difficulty:'HARD'},{...goal,difficulty:'HARD'},async()=>({...goal,difficulty:null})),GoalWriteUnconfirmedError);
});
test('mismatch, wrong ID, failed readback or missing response ID remain unconfirmed',async()=>{
 for(const read of [async()=>({...goal,difficulty:'EASY'}),async()=>({...goal,id:8,difficulty:'HARD'}),async()=>{throw Error('network');}])
  await assert.rejects(confirmGoalWrite({...goal,difficulty:'HARD'},{...goal,difficulty:'HARD'},read),GoalWriteUnconfirmedError);
 await assert.rejects(confirmGoalWrite({...goal,id:undefined},{...goal,difficulty:'HARD'},async()=>goal),e=>e instanceof GoalWriteUnconfirmedError&&e.goalId===null);
});
test('historical absence stays absence; unknown non-null values never become Sin dificultad',async()=>{
 assert.equal(validateGoalDifficulty(goal),goal);assert.equal(validateGoalDifficulty({...goal,difficulty:null}).difficulty,null);
 for(const difficulty of ['UNKNOWN','',0,false])assert.throws(()=>validateGoalDifficulty({...goal,difficulty}));
 let read=false;await confirmGoalWrite(goal,goal,async()=>{read=true;return goal;});assert.equal(read,false);
});
