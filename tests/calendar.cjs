const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync('index.html','utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
class Element{
 constructor(){this.value='';this.checked=false;this.style={width:'0%'};this.children=[];this.listeners={};this.classes=new Set();this.classList={add:x=>this.classes.add(x),toggle:(x,v)=>v?this.classes.add(x):this.classes.delete(x)};}
 addEventListener(k,f){this.listeners[k]=f;}setAttribute(k,v){this[k]=v;}replaceChildren(){this.children=[];}append(b){this.children.push(b);}querySelector(){return null;}
}
const elements={};for(const [,id] of html.matchAll(/id="([^"]+)"/g))elements[id]=new Element();
for(const [id,val] of Object.entries({speed:'5',advance:'reveal',hold:'2',minYear:'1900',maxYear:'2099'}))elements[id].value=val;
elements.working.checked=true;
const tabs=['year','month','century','date'].map(mode=>Object.assign(new Element(),{dataset:{mode}}));
let now=0;const document={getElementById:id=>elements[id],querySelectorAll:()=>tabs,createElement:()=>new Element(),addEventListener(){}};
const context=vm.createContext({document,localStorage:{getItem:()=>null,setItem(){}},performance:{now:()=>now},requestAnimationFrame(){},console});
vm.runInContext(script,context);const run=s=>vm.runInContext(s,context);
let dates=0;const dt=new Date(0);for(let y=2000;y<2400;y++){for(let m=0;m<12;m++){dt.setUTCFullYear(y,m+1,0);const max=dt.getUTCDate();assert.equal(run(`daysInMonth(${y},${m})`),max);for(let d=1;d<=max;d++){dt.setUTCFullYear(y,m,d);assert.equal(run(`weekday(${y},${m},${d})`),dt.getUTCDay(),`${y}-${m+1}-${d}`);dates++;}}}
for(let n=0;n<100;n++){dt.setUTCFullYear(2000+n,2,1);const expected=(dt.getUTCDay()-1-3-6+21)%7;assert.equal(run(`yearCode(${n})`),expected);}
assert.equal(run('yearCode(1949)'),5);
elements.reveal.onclick();assert.equal(run('revealed'),true);elements.next.onclick();assert.equal(run('revealed'),false);
elements.play.onclick();assert.equal(run('running'),true);now=5001;run('tick()');assert.equal(run('revealed'),true);now=7002;run('tick()');assert.equal(run('revealed'),false);
elements.advance.value='skip';elements.advance.listeners.change();now=12003;const before=run('cardCount');run('tick()');assert.equal(run('cardCount'),before+1);assert.equal(run('revealed'),false);
elements.play.onclick();const paused=run('cardCount');now+=90000;run('tick()');assert.equal(run('cardCount'),paused);
tabs[3].onclick();assert.equal(elements.choices.children.length,7);run('choose(result()[0])');assert.equal(run('correct'),1);assert.equal(run('total'),1);run('choose(0)');assert.equal(run('total'),1);elements.next.onclick();run('choose((result()[0]+1)%7)');assert.equal(run('correct'),1);assert.equal(run('total'),2);
elements.minYear.value='2099';elements.maxYear.value='1900';assert.equal(run('validRange()'),false);elements.minYear.value='1949';elements.maxYear.value='1949';elements.minYear.listeners.change();tabs[0].onclick();assert.equal(run('card.y'),1949);assert.equal(run('result()[0]'),5);
for(const mode of tabs){mode.onclick();assert.ok(elements.prompt.textContent||elements.prompt.innerHTML);elements.reveal.onclick();assert.ok(elements.answer.innerHTML);}
assert.ok(!/<(?:script|link)[^>]+(?:src|href)=["']https?:/i.test(html));
console.log(`PASS: ${dates.toLocaleString()} Gregorian dates (2000–2399), all 100 year codes, leap month lengths, 1949=5, all four modes, reveal/next, timed reveal, timed skip, pause, correct/incorrect scoring, duplicate answer guard, and year range validation. No external assets.`);

assert.equal((elements.yearTable.innerHTML.match(/scope="row"/g)||[]).length,100);
assert.equal((elements.monthTable.innerHTML.match(/scope="row"/g)||[]).length,12);
assert.ok(elements.yearTable.innerHTML.includes('>49</th><td>5</td>'));
console.log('PASS: cheat sheet has all year and month codes.');