module.exports=[315056,e=>{"use strict";var t=e.i(830471);e.i(417358);var o=e.i(642259);async function r(e){let r=(0,t.getDbInstance)(),s={processed:0,inserted:0,errors:0};try{let t=r.prepare(`SELECT
          LOWER(provider) as provider,
          LOWER(model) as model,
          DATE(timestamp, '+8 hours') as date,
          COALESCE(NULLIF(service_tier, ''), 'standard') as serviceTier,
          COUNT(*) as totalRequests,
          COALESCE(tokens_input, 0) as requestInputTokens,
          COALESCE(tokens_output, 0) as requestOutputTokens,
          COALESCE(tokens_cache_read, 0) as requestCacheReadTokens,
          COALESCE(tokens_cache_creation, 0) as requestCacheCreationTokens,
          COALESCE(tokens_reasoning, 0) as requestReasoningTokens,
          COALESCE(SUM(tokens_input), 0) as inputTokens,
          COALESCE(SUM(tokens_output), 0) as outputTokens,
          COALESCE(SUM(tokens_cache_read), 0) as cacheReadTokens,
          COALESCE(SUM(tokens_cache_creation), 0) as cacheCreationTokens,
          COALESCE(SUM(tokens_reasoning), 0) as reasoningTokens
        FROM usage_history
        WHERE timestamp < ?
          AND provider IS NOT NULL AND provider != ''
          AND model IS NOT NULL AND model != ''
        GROUP BY LOWER(provider), LOWER(model), DATE(timestamp, '+8 hours'), serviceTier,
          requestInputTokens, requestOutputTokens, requestCacheReadTokens,
          requestCacheCreationTokens, requestReasoningTokens`).all(e),n=await Promise.all(t.map(async e=>({...e,totalCost:await (0,o.calculateCost)(e.provider,e.model,{input:e.requestInputTokens,output:e.requestOutputTokens,cacheRead:e.requestCacheReadTokens,cacheCreation:e.requestCacheCreationTokens,reasoning:e.requestReasoningTokens},{provider:e.provider,model:e.model,serviceTier:e.serviceTier,flatRateAsZero:!1})*e.totalRequests}))),a=Array.from(n.reduce((e,t)=>{let o=`${t.provider}\u0000${t.model}\u0000${t.date}`,r=e.get(o);return r?(r.totalRequests+=t.totalRequests,r.inputTokens+=t.inputTokens,r.outputTokens+=t.outputTokens,r.totalCost+=t.totalCost):e.set(o,{provider:t.provider,model:t.model,date:t.date,totalRequests:t.totalRequests,inputTokens:t.inputTokens,outputTokens:t.outputTokens,totalCost:t.totalCost}),e},new Map).values()),i=r.prepare(`INSERT INTO daily_usage_summary
        (provider, model, date, total_requests, total_input_tokens, total_output_tokens, total_cost)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(provider, model, date) DO UPDATE SET
        total_requests = excluded.total_requests,
        total_input_tokens = excluded.total_input_tokens,
        total_output_tokens = excluded.total_output_tokens,
        total_cost = excluded.total_cost`),u=r.transaction(e=>e.reduce((e,t)=>e+i.run(t.provider,t.model,t.date,t.totalRequests,t.inputTokens,t.outputTokens,t.totalCost).changes,0));s.processed=t.length,s.inserted=u(a),console.log(`[Aggregation] usage_history rollup: ${s.inserted} rows for dates before ${e}`)}catch(e){console.error("[Aggregation] usage_history rollup error:",e),s.errors++}return s}e.s(["rollupUsageHistoryBeforeDate",0,r])},642259,e=>{"use strict";var t=e.i(611704);let o=new Set(["minimax","kimi-coding","kimi-coding-apikey","muse-code","xiaomi-mimo","bailian-coding-plan","qwen-cloud-token-plan","glm","glm-cn","claude","cc","opencode-go"]);function r(e){if(!e||!e.includes("/"))return e;let t=e.split("/");return t[t.length-1]}function s(e){let t=e?.cost_in_usd_ticks;return"number"==typeof t&&Number.isFinite(t)&&t>=0?t/1e10:null}function n(e,t=0){if("number"==typeof e&&Number.isFinite(e))return e;if("string"==typeof e&&e.trim().length>0){let o=Number(e);return Number.isFinite(o)?o:t}return t}function a(e){return"string"==typeof e?e.trim().toLowerCase():""}function i(e){return e.replace(/-(?:ultra|max|xhigh|high|medium|low|none)$/i,"")}async function u(c,l,p,d={}){if(!p||!c||!l)return{costUsd:0,priced:!0};let k=s(p);if(null!==k)return{costUsd:k,priced:!0};try{let{getPricingForModel:u}=await e.A(136388),k=await u(c,l);if(!k){let e=r(l);e!==l&&(k=await u(c,e));let t=a(c);if(!k&&("codex"===t||"cx"===t)){let t=i(e);t!==e&&(k=await u(c,t))}}if(!k)return{costUsd:0,priced:!1};let _=k&&"object"==typeof k&&!Array.isArray(k)?k:{};return{costUsd:function(e,u,c={}){if(!u)return 0;let l=s(u);if(null!==l)return l;if(!e||c.flatRateAsZero&&function(e){if(!e||"string"!=typeof e)return!1;let r=e.trim().toLowerCase();return!!r&&(!!o.has(r)||Object.prototype.hasOwnProperty.call(t.WEB_COOKIE_PROVIDERS,r))}(c.provider))return 0;let p=n(e.input,0),d=n(e.cached,p),k=n(e.output,0),_=n(e.reasoning,k),g=n(e.cache_creation,p),m=0,C=u.input??u.prompt_tokens??u.input_tokens??0,T=u.cacheRead??u.cached_tokens??u.cache_read_input_tokens??0,f=u.cacheCreation??u.cache_creation_input_tokens??0;m+=p/1e6*Math.max(0,C-T-f),T>0&&(m+=d/1e6*T),m+=k/1e6*(u.output??u.completion_tokens??u.output_tokens??0);let E=u.reasoning??u.reasoning_tokens??0;return E>0&&void 0!==e.reasoning&&null!==e.reasoning&&(m+=(_-k)/1e6*E),f>0&&(m+=g/1e6*f),m*function(e,t,o){let s=a(e),n=a(o);if("codex"!==s&&"cx"!==s)return 1;if("flex"===n)return .5;if("priority"!==n&&"fast"!==n)return 1;let u=i(r(String(t||"")).toLowerCase()),c=u.replace(/-/g,"");return/^gpt-6-(?:astra|sol|luna)$/.test(u)||/^gpt6(?:astra|sol|luna)$/.test(c)?2.5:/^gpt-5\.6-(?:sol|terra|luna)$/.test(u)||/^gpt5\.6(?:sol|terra|luna)$/.test(c)?1.5:"gpt-5.5"===u||"gpt5.5"===c?2.5:"gpt-5.4"===u||"gpt5.4"===c?2:1}(c.provider,c.model,c.serviceTier)}(_,p,{provider:c,model:l,...d}),priced:!0}}catch(e){return console.error("Error calculating cost:",e),{costUsd:0,priced:!1}}}async function c(e,t,o,r={}){return(await u(e,t,o,r)).costUsd}e.s(["calculateCost",0,c],642259)}];

//# sourceMappingURL=src_lib_usage_03e7ouz._.js.map