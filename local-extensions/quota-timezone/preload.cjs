'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto'),Module=require('node:module');
const root=__dirname,config=JSON.parse(fs.readFileSync(path.join(root,'config.json'),'utf8'));
if(config.enabled&&process.env.OMNI_LOCAL_EXTENSIONS!=='0'){
 process.env.TZ=config.timeZone;process.env.OMNIROUTE_WARMUP_TIMEZONE=config.timeZone;
 const rules=JSON.parse(fs.readFileSync(path.join(root,'timezone-rules.json'),'utf8'));
 const stats={version:config.version,timeZone:config.timeZone,weeklyModules:0,timezoneModules:0,htmlInjected:0};
 const compile=Module.prototype._compile;
 Module.prototype._compile=function(code,file){if(file.includes('/.build/next/server/')&&file.endsWith('.js')){
  let original=code;
  for(const rule of rules){if(code.includes(rule.before))code=code.split(rule.before).join(rule.after)}
  // SQL day bucketing is scoped to analytics/usage modules, not unrelated tables.
  if(/getHeatmapRows|aggregateQuotaSnapshots|aggregateUsageHistory|aggregateUsage|getUsageStats/.test(code)){
   code=code.replace(/\bDATE\((timestamp|created_at|account_events\.timestamp)\)/g,"DATE($1, '+8 hours')").replace(/strftime\('%w', timestamp\)/g,"strftime('%w', timestamp, '+8 hours')");
  }
  if(code!==original)stats.timezoneModules++;
  code=code.replace(/(\w+)\.s\(\["isRecord",0,(\w+),"isUsageQuotaKeyAllowed",0,(\w+)/g,(match,owner,record,allowed)=>{stats.weeklyModules++;return `var __omniOriginalQuotaAllowed=${allowed};${allowed}=function(provider,key){return((provider==="antigravity"||provider==="agy")&&/^(gemini|claude_gpt)_weekly$/.test(key))||__omniOriginalQuotaAllowed(provider,key)};`+match});
 }
 return compile.call(this,code,file)};
 const originalEmit=http.Server.prototype.emit;
 http.Server.prototype.emit=function(event,req,res){if(event!=='request'||!req||!res)return originalEmit.apply(this,arguments);
  const pathname=(req.url||'').split('?')[0];
  if(req.method==='GET'&&pathname==='/__omni_local/quota-hud.js'){const js=fs.readFileSync(path.join(root,'quota-hud.js'));res.writeHead(200,{'Content-Type':'application/javascript; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(js);return true}
  if(req.method==='GET'&&pathname==='/__omni_local/status'){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(stats));return true}
  if(req.method==='GET'&&/^(\/dashboard(?:\/|$)|\/home$|\/login$|\/$)/.test(pathname)&&!req.headers.rsc&&!req.url.includes('_rsc=')&&(req.headers.accept||'').includes('text/html')){
   delete req.headers['accept-encoding'];
   const write=res.write,end=res.end,head=res.writeHead;let chunks=[],size=0,passthrough=false;
   res.writeHead=function(status,msg,headers){if(typeof msg==='object')headers=msg;res.statusCode=status;if(typeof msg==='string')res.statusMessage=msg;if(headers)for(const[k,v]of Object.entries(headers))res.setHeader(k,v);return res};
   res.write=function(chunk,encoding,callback){if(passthrough)return write.call(this,chunk,encoding,callback);const b=Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk,typeof encoding==='string'?encoding:'utf8');chunks.push(b);size+=b.length;if(size>8*1024*1024){passthrough=true;res.writeHead=head;for(const x of chunks)write.call(res,x);chunks=[]}const cb=typeof encoding==='function'?encoding:callback;if(cb)queueMicrotask(cb);return true};
   res.end=function(chunk,encoding,callback){if(passthrough)return end.call(this,chunk,encoding,callback);if(chunk)this.write(chunk,encoding);let body=Buffer.concat(chunks);const type=String(this.getHeader('Content-Type')||'');if(type.includes('text/html')&&!this.getHeader('Content-Encoding')){let html=body.toString('utf8');if(html.includes('</body>')){const version=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'quota-hud.js'))).digest('hex').slice(0,12);html=html.replace('</body>',`<script defer src="/__omni_local/quota-hud.js?v=${version}" data-omni-local-extension="${config.version}"></script></body>`);body=Buffer.from(html);stats.htmlInjected++}}
    this.removeHeader('Content-Length');this.removeHeader('ETag');this.setHeader('Cache-Control','no-store');this.writeHead=head;this.write=write;this.end=end;return end.call(this,body,typeof encoding==='function'?encoding:callback)};
  }
  return originalEmit.apply(this,arguments)};
}
