const fs=require('fs'),vm=require('vm'),assert=require('assert');
const script=fs.readFileSync('index.html','utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
const html=fs.readFileSync('index.html','utf8');
function setup(storage=new Map(),audio=false,failStorage=false){
 class Element{
  constructor(){this.value='';this.checked=false;this.hidden=false;this.style={};this.children=[];this.listeners={};this.classList={add(){},toggle(){}};}
  addEventListener(k,f){this.listeners[k]=f;}setAttribute(k,v){this[k]=v;}replaceChildren(){this.children=[];}append(b){this.children.push(b);}querySelector(){return null;}
 }
 const elements={};for(const [,id] of html.matchAll(/id="([^"]+)"/g))elements[id]=new Element();
 Object.entries({speed:'1',advance:'reveal',hold:'2',minYear:'1900',maxYear:'2099',audioLanguage:'off'}).forEach(([k,v])=>elements[k].value=v);
 const tabs=['year','month','century','date'].map(mode=>Object.assign(new Element(),{dataset:{mode}}));
 const document={hidden:false,listeners:{},getElementById:id=>elements[id],querySelectorAll:()=>tabs,createElement:()=>new Element(),addEventListener(k,f){this.listeners[k]=f;}};
 let now=0,id=0;const timers=new Map(),sources=[];
 class BufferMock{constructor(length){this.length=length;this.data=new Float32Array(length);}getChannelData(){return this.data;}}
 class AudioContext{
  constructor(){this.state='running';this.sampleRate=24000;this.destination={};}async resume(){}async decodeAudioData(){return new BufferMock(24000);}
  createBuffer(c,n){return new BufferMock(n);}createBufferSource(){const source={connect(){},start(){},stop(){this.stopped=true;}};sources.push(source);return source;}
 }
 const context=vm.createContext({document,console,Uint8Array,atob:s=>Buffer.from(s,'base64').toString('binary'),...(audio?{AudioContext}:{}),performance:{now:()=>now},requestAnimationFrame(){},setTimeout(f,ms){timers.set(++id,{f,ms});return id;},clearTimeout(id){timers.delete(id);},localStorage:{getItem:key=>storage.get(key)||null,setItem(key,value){if(failStorage)throw Error('quota');storage.set(key,value);}}});
 vm.runInContext(script,context);const run=s=>vm.runInContext(s,context);
 return {elements,tabs,document,storage,sources,run,advance:ms=>now+=ms,next(){const timer=[...timers.entries()].find(([,v])=>v.ms===1200);assert.ok(timer,'next-date timer');timers.delete(timer[0]);timer[1].f();}};
}
const KEY='daykeeper-challenge-best-v1';
function complete(app,correctCount=10,ms=2000){
 app.run('startChallenge()');
 for(let i=0;i<10;i++){
  app.advance(ms+(i>=correctCount?5000:0));
  app.run(`choose(${i<correctCount?'result()[0]':'(result()[0]+1)%7'})`);
  if(i>=correctCount)break;
  if(i<9)app.next();
 }
 assert.equal(app.run('challenge'),null);
}
async function main(){
 const a=setup();complete(a);assert.equal(JSON.parse(a.storage.get(KEY)).averageMs,2000);assert.ok(a.elements.challengeResult.textContent.includes('10/10 correct'));
 complete(a,10,3000);assert.equal(JSON.parse(a.storage.get(KEY)).averageMs,2000);
 complete(a,10,1000);assert.equal(JSON.parse(a.storage.get(KEY)).averageMs,1000);
 const saved=a.storage.get(KEY);complete(a,7,500);assert.equal(a.storage.get(KEY),saved);assert.ok(a.elements.challengeResult.textContent.includes('Stopped on date 8'));assert.ok(a.elements.answer.innerHTML.includes('mod 7'));assert.equal(a.run('revealed'),true);
 complete(a,0);assert.equal(a.storage.get(KEY),saved);assert.ok(a.elements.challengeResult.textContent.includes('Stopped on date 1'));assert.ok(a.elements.answer.innerHTML.includes('mod 7'));
 complete(a,9);assert.equal(a.storage.get(KEY),saved);assert.ok(a.elements.challengeResult.textContent.includes('Stopped on date 10'));
 const wrong=setup();wrong.run('startChallenge()');wrong.advance(500);const wrongCard=wrong.run('cardCount');wrong.run('choose((result()[0]+1)%7)');assert.equal(wrong.run('challenge'),null);assert.throws(()=>wrong.next(),/next-date timer/);assert.equal(wrong.run('cardCount'),wrongCard);assert.equal(wrong.elements.startChallenge.disabled,false);
 const reloaded=setup(a.storage);assert.equal(reloaded.run('bestChallenge.averageMs'),1000);assert.ok(reloaded.elements.challengeBest.textContent.includes('1.00 s'));
 a.run('startChallenge()');const first=a.run('cardCount');a.run('next();showAnswer();');assert.equal(a.run('cardCount'),first);assert.equal(a.run('revealed'),false);
 a.advance(500);a.run('choose(result()[0]);choose(result()[0]);');assert.equal(a.run('challenge.answers.length'),1);
 a.run('cancelChallenge()');assert.equal(a.storage.get(KEY),saved);
 a.run('startChallenge()');a.document.hidden=true;a.document.listeners.visibilitychange();assert.equal(a.run('challenge'),null);assert.equal(a.storage.get(KEY),saved);
 const interrupted=setup();interrupted.run('startChallenge()');interrupted.advance(1000);interrupted.run('choose(result()[0])');assert.equal(interrupted.storage.has(KEY),false);assert.equal(setup(interrupted.storage).run('challenge'),null);
 const failed=setup(new Map(),false,true);complete(failed);assert.equal(failed.run('bestChallenge'),null);assert.ok(failed.elements.challengeResult.textContent.includes('could not save'));
 const invalid=setup(new Map([[KEY,'{"averageMs":-1}']]));assert.equal(invalid.run('bestChallenge'),null);
 const audio=setup(new Map(),true);audio.elements.audioLanguage.value='nb-NO';audio.run('startChallenge()');await new Promise(setImmediate);
 assert.equal(audio.run('speechBusy'),true);audio.advance(4000);audio.run('choose(result()[0])');assert.equal(audio.run('challenge.answers.length'),0);
 audio.sources.at(-1).onended();audio.advance(1000);await audio.run('speakDate()');audio.advance(3000);audio.sources.at(-1).onended();audio.advance(2000);audio.run('choose(result()[0])');assert.equal(audio.run('challenge.answers[0].ms'),3000);
 const stale=audio.sources.at(-1);audio.run('cancelChallenge()');assert.equal(audio.storage.has(KEY),false);
 // Changing modes cancels any queued advance and leaves ordinary practice usable.
 const switched=setup();switched.run('startChallenge()');switched.advance(500);switched.run('choose(result()[0])');switched.tabs[0].onclick();assert.equal(switched.run('challenge'),null);assert.equal(switched.run('mode'),'year');assert.equal(switched.elements.next.disabled,false);
 console.log('PASS: perfect-only high score, faster/slower runs, correct-only averages, zero correct, persistence/reload, incomplete/cancelled/hidden runs, storage failures, duplicate answers, no skips/reveals, automatic progression, and exclusion of initial/replayed audio.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
