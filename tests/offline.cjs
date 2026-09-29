const fs=require('fs'),vm=require('vm'),assert=require('assert');
const scope='https://vidarsveen.github.io/date_trainer/';
const listeners={},stored=new Map(),deleted=[];let fetched=0,offline=false,installed=[],claimed=false;
const cachedHome={body:'cached app'},fresh={ok:true,body:'new app',clone(){return this;}};
const cache={async addAll(files){installed=files;stored.set(scope,cachedHome);},async put(key,value){stored.set(key,value);}};
const caches={async open(){return cache;},async keys(){return ['daykeeper-/date_trainer/-v0','daykeeper-/other-app/-v0'];},async delete(key){deleted.push(key);},async match(request){return stored.get(typeof request==='string'?request:request.url);}};
const self={registration:{scope},location:{origin:new URL(scope).origin},addEventListener:(name,fn)=>listeners[name]=fn,async skipWaiting(){},clients:{async claim(){claimed=true;}}};
vm.runInNewContext(fs.readFileSync('sw.js','utf8'),{self,caches,URL,fetch:async()=>{fetched++;if(offline)throw Error('offline');return fresh;}});
async function main(){
 let task;listeners.install({waitUntil:p=>task=p});await task;assert.equal(installed.filter(file=>file==='./'||file==='./index.html').length,1);
 listeners.activate({waitUntil:p=>task=p});await task;assert.deepEqual(deleted,['daykeeper-/date_trainer/-v0']);assert.equal(claimed,true);
 async function request(url,mode='navigate'){
  let response,background;listeners.fetch({request:{url,method:'GET',mode},respondWith:p=>response=p,waitUntil:p=>background=p});const value=await response;if(background)await background;return value;
 }
 assert.equal(await request(scope),fresh);assert.equal(stored.get(scope),fresh);
 offline=true;assert.equal(await request(scope),fresh);assert.equal(await request(scope+'index.html'),fresh);
 const count=fetched;assert.equal(await request('https://example.org/'),undefined);assert.equal(fetched,count);
 assert.equal(await request('https://vidarsveen.github.io/other-app/'),undefined);assert.equal(fetched,count);
 const manifest=JSON.parse(fs.readFileSync('manifest.webmanifest','utf8'));assert.equal(manifest.start_url,'./');assert.equal(manifest.scope,'./');assert.ok(fs.existsSync(manifest.icons[0].src));
 console.log('PASS: single HTML cache entry, offline navigation, fresh online updates, isolated cache cleanup, and relative project paths.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
