const fs=require('fs'),vm=require('vm'),assert=require('assert');
class Element{
 constructor(){this.value='';this.checked=false;this.style={width:'0%'};this.children=[];this.listeners={};this.classList={add(){},toggle(){}};}
 addEventListener(k,f){this.listeners[k]=f;}setAttribute(k,v){this[k]=v;}replaceChildren(){this.children=[];}append(b){this.children.push(b);}querySelector(){return null;}
}
const html=fs.readFileSync(process.argv[2]||'index.html','utf8'),script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const elements={};for(const [,id] of html.matchAll(/id="([^"]+)"/g))elements[id]=new Element();
Object.entries({speed:'1',advance:'reveal',hold:'2',minYear:'1900',maxYear:'2099',audioLanguage:'off'}).forEach(([k,v])=>elements[k].value=v);
const tabs=['year','month','century','date'].map(mode=>Object.assign(new Element(),{dataset:{mode}}));
let now=0,sources=[],decodes=0,failDecode=false;
class MockBuffer{constructor(length){this.length=length;this.data=new Float32Array(length);}getChannelData(){return this.data;}}
class AudioContext{
 constructor(){this.state='running';this.sampleRate=24000;this.destination={};}
 async resume(){}
 async decodeAudioData(bytes){assert.ok(bytes.byteLength>500);decodes++;if(failDecode)throw Error('decode');return new MockBuffer(24000);}
 createBuffer(channels,length){return new MockBuffer(length);}
 createBufferSource(){const source={connect(){},start(){this.started=true;},stop(){this.stopped=true;}};sources.push(source);return source;}
}
const document={getElementById:id=>elements[id],querySelectorAll:()=>tabs,createElement:()=>new Element(),addEventListener(){}};
const context=vm.createContext({document,AudioContext,Uint8Array,atob:s=>Buffer.from(s,'base64').toString('binary'),setTimeout:()=>0,localStorage:{getItem:()=>null,setItem(){}},performance:{now:()=>now},requestAnimationFrame(){},console});
vm.runInContext(script,context);const run=s=>vm.runInContext(s,context);
async function main(){
 for(const lang of ['nb-NO','en-GB']){
  for(let m=0;m<12;m++)for(let d=1;d<=new Date(2000,m+1,0).getDate();d++)assert.ok(run(`NEURAL_AUDIO['${lang}']['date-${m}-${d}']`));
  for(let y=1;y<=9999;y++)assert.ok(run(`dateAudioKeys({y:${y},m:0,d:1},'${lang}').every(key=>!!NEURAL_AUDIO['${lang}'][key])`));
 }
 run("mode='date';card={y:1949,m:4,d:21};");elements.audioLanguage.value='nb-NO';await run('speakDate()');assert.ok(sources.at(-1).started);assert.equal(run('speechBusy'),true);
 run('running=true;');now=99999;const before=run('cardCount');run('tick()');assert.equal(run('cardCount'),before);sources.at(-1).onended();assert.equal(run('speechBusy'),false);assert.equal(run('remaining'),1000);
 const previous=sources.at(-1);await run('speakDate()');const first=sources.at(-1);await run('speakDate()');assert.equal(first.stopped,true);
 elements.audioLanguage.value='en-GB';await run('speakDate()');assert.ok(sources.at(-1).started);
 const count=sources.length;elements.audioLanguage.value='off';await run('speakDate()');assert.equal(sources.length,count);assert.equal(run('speechBusy'),false);
 elements.audioLanguage.value='nb-NO';run('mode="year"');await run('speakDate()');assert.equal(sources.length,count);
 run('mode="date";decodedAudio.clear();');failDecode=true;await run('speakDate()');assert.equal(run('speechBusy'),false);assert.ok(elements.speechStatus.textContent.includes('Could not play'));failDecode=false;
 run('decodedAudio.clear();');const pending=run('speakDate()');run('stopSpeech()');await pending;assert.equal(run('speechBusy'),false);
 elements.audioLanguage.value='en-GB';const autoCount=sources.length;elements.next.onclick();await new Promise(setImmediate);assert.equal(sources.length,autoCount+1);assert.equal(run('speechBusy'),true);
 run('running=true');elements.play.onclick();assert.equal(run('running'),false);assert.equal(run('speechBusy'),false);assert.equal(sources.at(-1).stopped,true);
 elements.audioLanguage.value='off';elements.audioLanguage.listeners.change();assert.equal(elements.speechControls.hidden,true);
 assert.ok(!script.includes('speechSynthesis'));assert.ok(!script.includes('fetch('));
 console.log('PASS: every day/month including February 29; audio coverage for years 1–9999 in both languages; offline embedded clips; playback, replay, cancellation, language changes, timer protection, error recovery, and silent non-quiz modes.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
