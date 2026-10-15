function _formatCstDateFromIso(v){if(!v)return null;let d=new Date(v);if(Number.isNaN(d.getTime()))return v.split("T",1)[0]||null;let p=new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Shanghai",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(d),y="",m="",day="";for(let x of p){if(x.type==="year")y=x.value;if(x.type==="month")m=x.value;if(x.type==="day")day=x.value;}return y+"-"+m+"-"+day;};module.exports=[198535,e=>e.a(async(t,s)=>{try{var a=e.i(89171),n=e.i(238521),o=e.i(748648),r=e.i(403122),i=e.i(151205),c=e.i(125852),u=e.i(235328),E=e.i(126603),l=e.i(956382),p=t([n,o,c,u,l]);function d(e){return e.map(e=>{if(!Array.isArray(e.models))return e;let t=e.models.filter(e=>{if(!e||"object"!=typeof e||"combo-ref"===e.kind)return!0;let t="string"==typeof e.model?e.model.trim():"";if(!t)return!0;let s="string"==typeof e.providerId&&e.providerId.trim()||"string"==typeof e.provider&&e.provider.trim()||(t.includes("/")?t.split("/")[0]:"");if(!s)return!0;if(!(0,l.providerHasFreeModels)(s))return!1;let a=t.startsWith(`${s}/`)?t.slice(s.length+1):t;return(0,l.isFreeModel)(s,{id:a})});return{...e,models:t}})}async function C(e){if(await (0,u.isAuthRequired)(e)&&!await (0,u.isAuthenticated)(e))return a.NextResponse.json({error:"Unauthorized"},{status:401});try{let t=new URL(e.url),s="true"===t.searchParams.get("includeHistory"),u=await (0,n.getSettings)(),{password:l,requireLogin:p,...C}=u,_=await (0,o.getProviderConnections)(),S=await (0,r.getCachedProviderNodes)(),L=await (0,i.getCombos)(),O=await (0,c.getApiKeys)(),R=!0===u.hidePaidModels?d(L):L,A={settings:C,providerConnections:_,providerNodes:S,combos:R,apiKeys:O,_meta:{exportedAt:new Date().toISOString(),version:"omniroute-v3-legacy-export",includesHistory:s}};return s&&(A.usageHistory=(0,E.getAllUsageHistory)(),A.domainCostHistory=(0,E.getAllDomainCostHistory)(),A.domainBudgets=(0,E.getAllDomainBudgets)()),new a.NextResponse(JSON.stringify(A,null,2),{status:200,headers:{"Content-Type":"application/json","Content-Disposition":`attachment; filename="omniroute-legacy-backup-${new Date().toISOString().replace(/[:.]/g,"-")}.json"`}})}catch(e){return console.error("[API] Error exporting JSON backup:",e),a.NextResponse.json({error:"Failed to export JSON"},{status:500})}}[n,o,c,u,l]=p.then?(await p)():p,e.s(["GET",0,C,"filterPaidComboSteps",0,d]),s()}catch(e){s(e)}},!1),315638,e=>{"use strict";var t=e.i(747909),s=e.i(174017),a=e.i(996250),n=e.i(759756),o=e.i(561916),r=e.i(174677),i=e.i(869741),c=e.i(316795),u=e.i(487718),E=e.i(995169),l=e.i(47587),p=e.i(666012),d=e.i(570101),C=e.i(626937),_=e.i(10372),S=e.i(193695);e.i(52474);var L=e.i(600220);let O=new t.AppRouteRouteModule({definition:{kind:s.RouteKind.APP_ROUTE,page:"/api/settings/export-json/route",pathname:"/api/settings/export-json",filename:"route",bundlePath:""},distDir:".build/next",relativeProjectDir:"",resolvedPagePath:"[project]/src/app/api/settings/export-json/route.ts",nextConfigOutput:"standalone",userland:()=>e.r(198535),...{}}),{workAsyncStorage:R,workUnitAsyncStorage:A,serverHooks:g}=O;async function k(e,t,a){a.requestMeta&&(0,n.setRequestMeta)(e,a.requestMeta),O.isDev&&(0,n.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let R="/api/settings/export-json/route";R=R.replace(/\/index$/,"")||"/";let A=await O.prepare(e,t,{srcPage:R,multiZoneDraftMode:!1});if(!A)return t.statusCode=400,t.end("Bad Request"),null==a.waitUntil||a.waitUntil.call(a,Promise.resolve()),null;let{buildId:g,deploymentId:k,params:m,nextConfig:T,parsedUrl:v,isDraftMode:y,prerenderManifest:U,routerServerContext:h,isOnDemandRevalidate:M,revalidateOnlyGenerated:I,resolvedPathname:N,clientReferenceManifest:D,serverActionsManifest:f}=A,b=(0,i.normalizeAppPath)(R),w=!!(U.dynamicRoutes[b]||U.routes[N]),F=async()=>((null==h?void 0:h.render404)?await h.render404(e,t,v,!1):t.end("This page could not be found"),null);if(w&&!y){let e=!!U.routes[N],t=U.dynamicRoutes[b];if(t&&!1===t.fallback&&!e){if(T.adapterPath)return await F();throw new S.NoFallbackError}}let q=null;!w||O.isDev||y||(q="/index"===(q=N)?"/":q);let P=!0===O.isDev||!w,W=w&&!P;f&&D&&(0,r.setManifestsSingleton)({page:R,clientReferenceManifest:D,serverActionsManifest:f});let x=e.method||"GET",H=(0,o.getTracer)(),B=H.getActiveScopeSpan(),G=!!(null==h?void 0:h.isWrappedByNextServer),Y=!!(0,n.getRequestMeta)(e,"minimalMode"),K=(0,n.getRequestMeta)(e,"incrementalCache")||await O.getIncrementalCache(e,T,U,Y);null==K||K.resetRequestCache(),globalThis.__incrementalCache=K;let $={params:m,previewProps:U.preview,renderOpts:{experimental:{authInterrupts:!!T.experimental.authInterrupts,useCacheTimeout:T.experimental.useCacheTimeout},cacheComponents:!!T.cacheComponents,validationLevel:T.experimental.instantInsights.validationLevel,supportsDynamicResponse:P,incrementalCache:K,hmrRefreshHash:(0,n.getRequestMeta)(e,"hmrRefreshHash"),cacheLifeProfiles:T.cacheLife,staticPageGenerationTimeout:T.staticPageGenerationTimeout,waitUntil:a.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,s,a,n)=>O.onRequestError(e,t,a,n,h)},sharedContext:{buildId:g,deploymentId:k}},j=new c.NodeNextRequest(e),X=new c.NodeNextResponse(t),V=u.NextRequestAdapter.fromNodeNextRequest(j,(0,u.signalFromNodeResponse)(t)),J=async({previousCacheEntry:s})=>{try{if(!Y&&M&&I&&!s)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let n=await O.handle(V,$);e.fetchMetrics=$.renderOpts.fetchMetrics;let o=$.renderOpts.pendingWaitUntil;o&&a.waitUntil&&(a.waitUntil(o),o=void 0);let r=$.renderOpts.collectedTags;if(!w)return await (0,p.sendResponse)(j,X,n,o),null;{let e=await n.blob(),t=(0,d.toNodeOutgoingHttpHeaders)(n.headers);r&&(t[_.NEXT_CACHE_TAGS_HEADER]=r),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let s=void 0!==$.renderOpts.collectedRevalidate&&!($.renderOpts.collectedRevalidate>=_.INFINITE_CACHE)&&$.renderOpts.collectedRevalidate,a=void 0===$.renderOpts.collectedExpire||$.renderOpts.collectedExpire>=_.INFINITE_CACHE?!1!==s&&s>0?T.expireTime:void 0:$.renderOpts.collectedExpire;return{value:{kind:L.CachedRouteKind.APP_ROUTE,status:n.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:s,expire:a}}}}catch(t){throw(null==s?void 0:s.isStale)&&await O.onRequestError(e,t,{routerKind:"App Router",routePath:R,routeType:"route",revalidateReason:(0,l.getRevalidateReason)({isStaticGeneration:W,isOnDemandRevalidate:M})},!1,h),t}},z=async(n,r)=>{try{var i,c;let n=await O.handleResponse({req:e,nextConfig:T,cacheKey:q,routeKind:s.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:U,isRoutePPREnabled:!1,isOnDemandRevalidate:M,revalidateOnlyGenerated:I,responseGenerator:J,waitUntil:a.waitUntil,isMinimalMode:Y});if(!w)return;if((null==n||null==(i=n.value)?void 0:i.kind)!==L.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==n||null==(c=n.value)?void 0:c.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});Y||t.setHeader("x-nextjs-cache",M?"REVALIDATED":n.isMiss?"MISS":n.isStale?"STALE":"HIT"),y&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let o=(0,d.fromNodeOutgoingHttpHeaders)(n.value.headers);Y&&w||o.delete(_.NEXT_CACHE_TAGS_HEADER),!n.cacheControl||t.getHeader("Cache-Control")||o.get("Cache-Control")||o.set("Cache-Control",(0,C.getCacheControlHeader)(n.cacheControl)),await (0,p.sendResponse)(j,X,new Response(n.value.body,{headers:o,status:n.value.status||200}));return}catch(t){if(t instanceof S.NoFallbackError||await O.onRequestError(e,t,{routerKind:"App Router",routePath:b,routeType:"route",revalidateReason:(0,l.getRevalidateReason)({isStaticGeneration:W,isOnDemandRevalidate:M})},!1,h),w)throw t;await (0,p.sendResponse)(j,X,new Response(null,{status:500}));return}finally{(()=>{if(!n)return;let e=t.statusCode;n.setAttributes({"http.status_code":e,"next.rsc":!1}),e&&e>=500&&(n.setStatus({code:o.SpanStatusCode.ERROR}),n.setAttribute("error.type",e.toString()));let s=H.getRootSpanAttributes();if(!s)return;if(s.get("next.span_type")!==E.BaseServerSpan.handleRequest)return console.warn(`Unexpected root span type '${s.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let a=s.get("next.route")||b,i=`${x} ${a}`;n.setAttributes({"next.route":a,"http.route":a,"next.span_name":i}),n.updateName(i),r&&r!==n&&(r.setAttribute("http.route",a),r.updateName(i))})()}};if(G&&B)await z(B,void 0);else{let t=H.getActiveScopeSpan();await H.withPropagatedContext(e.headers,()=>H.trace(E.BaseServerSpan.handleRequest,{spanName:`${x} ${R}`,kind:o.SpanKind.SERVER,attributes:{"http.method":x,"http.target":e.url}},e=>z(e,t)),void 0,!G)}}e.s(["handler",0,k,"patchFetch",0,function(){return(0,a.patchFetch)({workAsyncStorage:R,workUnitAsyncStorage:A})},"routeModule",0,O,"serverHooks",0,g,"workAsyncStorage",0,R,"workUnitAsyncStorage",0,A])},126603,e=>{"use strict";var t=e.i(899378);e.s(["getAccountCostRows",0,function(e,s){return(0,t.getDbInstance)().prepare(`
      WITH account_events AS (
        SELECT
          COALESCE(
            NULLIF(usage_history.account_key, ''),
            'connection:' || COALESCE(LOWER(usage_history.provider), 'unknown') || ':' || COALESCE(NULLIF(TRIM(usage_history.connection_id), ''), 'unknown')
          ) as resolved_account_key,
          usage_history.provider,
          usage_history.model,
          usage_history.service_tier,
          usage_history.timestamp,
          usage_history.tokens_input,
          usage_history.tokens_output,
          usage_history.tokens_cache_read,
          usage_history.tokens_cache_creation,
          usage_history.tokens_reasoning
        FROM usage_history
        ${e}
      )
      SELECT
        account_events.resolved_account_key as accountKey,
        LOWER(account_events.provider) as provider,
        LOWER(account_events.model) as model,
        COALESCE(NULLIF(account_events.service_tier, ''), 'standard') as serviceTier,
        COALESCE(SUM(account_events.tokens_input), 0) as promptTokens,
        COALESCE(SUM(account_events.tokens_output), 0) as completionTokens,
        COALESCE(SUM(account_events.tokens_cache_read), 0) as cacheReadTokens,
        COALESCE(SUM(account_events.tokens_cache_creation), 0) as cacheCreationTokens,
        COALESCE(SUM(account_events.tokens_reasoning), 0) as reasoningTokens
      FROM account_events
      GROUP BY DATE(account_events.timestamp, '+8 hours'), accountKey, LOWER(account_events.provider), LOWER(account_events.model), serviceTier
    `).all(s)},"getAccountUsageRows",0,function(e,s){return(0,t.getDbInstance)().prepare(`
      WITH account_events AS (
        SELECT
          usage_history.*,
          COALESCE(NULLIF(usage_history.account_key, ''), 'connection:' || COALESCE(LOWER(usage_history.provider), 'unknown') || ':' || COALESCE(NULLIF(TRIM(usage_history.connection_id), ''), 'unknown')) as resolved_account_key
        FROM usage_history
        ${e}
      ),
      stable_account_keys AS (
        SELECT DISTINCT account_key
        FROM account_events
        WHERE account_key > ''
      ),
      stable_labels AS (
        SELECT
          stable_account_keys.account_key,
          (
            SELECT TRIM(usage_history.account_label)
            FROM usage_history
            WHERE usage_history.account_key = stable_account_keys.account_key
              AND NULLIF(TRIM(usage_history.account_label), '') IS NOT NULL
            ORDER BY COALESCE(usage_history.account_label_priority, 0) DESC,
                     usage_history.timestamp DESC,
                     usage_history.id DESC
            LIMIT 1
          ) as account_label
        FROM stable_account_keys
      ),
      legacy_labels AS (
        SELECT account_key, account_label
        FROM (
          SELECT
            account_events.resolved_account_key as account_key,
            TRIM(account_events.account_label) as account_label,
            ROW_NUMBER() OVER (
              PARTITION BY account_events.resolved_account_key
              ORDER BY COALESCE(account_events.account_label_priority, 0) DESC,
                       account_events.timestamp DESC,
                       account_events.id DESC
            ) as label_rank
          FROM account_events
          WHERE (account_events.account_key IS NULL OR account_events.account_key = '')
            AND NULLIF(TRIM(account_events.account_label), '') IS NOT NULL
        )
        WHERE label_rank = 1
      ),
      selected_labels AS (
        SELECT account_key, account_label FROM stable_labels
        UNION ALL
        SELECT account_key, account_label FROM legacy_labels
      )
      SELECT
        account_events.resolved_account_key as accountKey,
        COALESCE(NULLIF(TRIM(selected_labels.account_label), ''), NULLIF(TRIM(account_events.connection_id), ''), 'unknown') as account,
        COUNT(account_events.id) as requests,
        COALESCE(SUM(account_events.tokens_input), 0) as promptTokens,
        COALESCE(SUM(account_events.tokens_output), 0) as completionTokens,
        COALESCE(SUM(account_events.tokens_input + account_events.tokens_output), 0) as totalTokens,
        COALESCE(AVG(account_events.latency_ms), 0) as avgLatencyMs,
        COALESCE(MAX(account_events.timestamp), '') as lastUsed
      FROM account_events
      LEFT JOIN selected_labels
        ON selected_labels.account_key = account_events.resolved_account_key
      GROUP BY accountKey
      ORDER BY requests DESC
      LIMIT 50
    `).all(s)},"getAllDomainBudgets",0,function(){return(0,t.getDbInstance)().prepare("SELECT * FROM domain_budgets").all()},"getAllDomainCostHistory",0,function(){return(0,t.getDbInstance)().prepare("SELECT * FROM domain_cost_history").all()},"getAllUsageHistory",0,function(){return(0,t.getDbInstance)().prepare("SELECT * FROM usage_history").all()},"getApiKeyMetadataRows",0,function(e,s){return(0,t.getDbInstance)().prepare(`
      SELECT
        NULLIF(api_key_id, '') as apiKeyId,
        NULLIF(api_key_name, '') as apiKeyName,
        COALESCE(NULLIF(api_key_id, ''), NULLIF(api_key_name, ''), 'unknown') as apiKeyGroupKey,
        MAX(timestamp) as lastUsed
      FROM usage_history
      ${e}
      GROUP BY NULLIF(api_key_id, ''), NULLIF(api_key_name, '')
      ORDER BY lastUsed DESC
    `).all(s)},"getApiKeyUsageRows",0,function(e,s){return(0,t.getDbInstance)().prepare(`
      SELECT
        NULLIF(api_key_id, '') as apiKeyId,
        COALESCE(NULLIF(api_key_id, ''), NULLIF(api_key_name, ''), 'unknown') as apiKeyGroupKey,
        LOWER(provider) as provider,
        LOWER(model) as model,
        COALESCE(NULLIF(service_tier, ''), 'standard') as serviceTier,
        COUNT(*) as requests,
        COALESCE(SUM(tokens_input), 0) as promptTokens,
        COALESCE(SUM(tokens_output), 0) as completionTokens,
        COALESCE(SUM(tokens_cache_read), 0) as cacheReadTokens,
        COALESCE(SUM(tokens_cache_creation), 0) as cacheCreationTokens,
        COALESCE(SUM(tokens_reasoning), 0) as reasoningTokens,
        COALESCE(SUM(tokens_input + tokens_output), 0) as totalTokens
      FROM usage_history
      ${e}
      GROUP BY DATE(timestamp, '+8 hours'), COALESCE(NULLIF(api_key_id, ''), NULLIF(api_key_name, ''), 'unknown'), NULLIF(api_key_id, ''), LOWER(provider), LOWER(model), serviceTier
    `).all(s)},"getDailyCostRows",0,function(e,s){return(0,t.getDbInstance)().prepare(`
      SELECT
        DATE(timestamp, '+8 hours') as date,
        LOWER(provider) as provider,
        LOWER(model) as model,
        COALESCE(NULLIF(service_tier, ''), 'standard') as serviceTier,
        COALESCE(SUM(tokens_input), 0) as promptTokens,
        COALESCE(SUM(tokens_output), 0) as completionTokens,
        COALESCE(SUM(tokens_cache_read), 0) as cacheReadTokens,
        COALESCE(SUM(tokens_cache_creation), 0) as cacheCreationTokens,
        COALESCE(SUM(tokens_reasoning), 0) as reasoningTokens,
        COALESCE(SUM(stored_cost), 0.0) as storedCost,
        MAX(is_aggregated) as isAggregated
      FROM ${e} AS _u
      GROUP BY DATE(timestamp, '+8 hours'), LOWER(provider), LOWER(model), serviceTier
      ORDER BY date ASC
    `).all(s)},"getDailyUsage",0,function(e,s){return(0,t.getDbInstance)().prepare(`
      SELECT
        DATE(timestamp, '+8 hours') as date,
        COALESCE(SUM(requests), 0) as requests,
        COALESCE(SUM(tokens_input), 0) as promptTokens,
        COALESCE(SUM(tokens_output), 0) as completionTokens,
        COALESCE(SUM(tokens_input + tokens_output), 0) as totalTokens
      FROM ${e} AS _u
      GROUP BY DATE(timestamp, '+8 hours')
      ORDER BY date ASC
    `).all(s)},"getHeatmapRows",0,function(e,s){return(0,t.getDbInstance)().prepare(`
      SELECT
        DATE(timestamp, '+8 hours') as date,
        COALESCE(SUM(tokens_input + tokens_output), 0) as totalTokens
      FROM usage_history
      WHERE ${e.join(" AND ")}
      GROUP BY DATE(timestamp, '+8 hours')
      ORDER BY date ASC
    `).all(s)},"getModelUsageRows",0,function(e,s){return(0,t.getDbInstance)().prepare(`
      SELECT
        LOWER(model) as model,
        LOWER(provider) as provider,
        COALESCE(NULLIF(service_tier, ''), 'standard') as serviceTier,
        COALESCE(SUM(requests), 0) as requests,
        COALESCE(SUM(tokens_input), 0) as promptTokens,
        COALESCE(SUM(tokens_output), 0) as completionTokens,
        COALESCE(SUM(tokens_cache_read), 0) as cacheReadTokens,
        COALESCE(SUM(tokens_cache_creation), 0) as cacheCreationTokens,
        COALESCE(SUM(tokens_reasoning), 0) as reasoningTokens,
        COALESCE(SUM(tokens_input + tokens_output), 0) as totalTokens,
        COALESCE(AVG(latency_ms), 0) as avgLatencyMs,
        COALESCE(SUM(CASE WHEN success = 1 THEN requests ELSE 0 END), 0) as successfulRequests,
        COALESCE(MAX(timestamp), '') as lastUsed,
        COALESCE(SUM(stored_cost), 0.0) as storedCost,
        MAX(is_aggregated) as isAggregated
      FROM ${e} AS _u
      -- Keep cost inputs separated by day. Historical provider rows do not
      -- always use one cache-token convention, and computeCostFromPricing's
      -- non-cached-input clamp is intentionally non-linear across those rows.
      GROUP BY DATE(timestamp, '+8 hours'), LOWER(model), LOWER(provider), serviceTier
      ORDER BY requests DESC
    `).all(s)},"getPresetCostModelRows",0,function(e,s){return(0,t.getDbInstance)().prepare(`
      SELECT
        LOWER(model) as model,
        LOWER(provider) as provider,
        COALESCE(NULLIF(service_tier, ''), 'standard') as serviceTier,
        COALESCE(SUM(tokens_input), 0) as promptTokens,
        COALESCE(SUM(tokens_output), 0) as completionTokens,
        COALESCE(SUM(tokens_cache_read), 0) as cacheReadTokens,
        COALESCE(SUM(tokens_cache_creation), 0) as cacheCreationTokens,
        COALESCE(SUM(tokens_reasoning), 0) as reasoningTokens,
        COALESCE(SUM(stored_cost), 0.0) as storedCost,
        MAX(is_aggregated) as isAggregated
      FROM ${e} AS _pu
      GROUP BY DATE(timestamp, '+8 hours'), LOWER(model), LOWER(provider), serviceTier
    `).all(s)},"getProviderCostRows",0,function(e,s){return(0,t.getDbInstance)().prepare(`
      SELECT
        LOWER(provider) as provider,
        LOWER(model) as model,
        COALESCE(NULLIF(service_tier, ''), 'standard') as serviceTier,
        COALESCE(SUM(tokens_input), 0) as promptTokens,
        COALESCE(SUM(tokens_output), 0) as completionTokens,
        COALESCE(SUM(tokens_cache_read), 0) as cacheReadTokens,
        COALESCE(SUM(tokens_cache_creation), 0) as cacheCreationTokens,
        COALESCE(SUM(tokens_reasoning), 0) as reasoningTokens,
        COALESCE(SUM(stored_cost), 0.0) as storedCost,
        MAX(is_aggregated) as isAggregated
      FROM ${e} AS _u
      GROUP BY DATE(timestamp, '+8 hours'), LOWER(provider), LOWER(model), serviceTier
    `).all(s)},"getProviderDailyUsageRows",0,function(e,s){return(0,t.getDbInstance)().prepare(`
      SELECT
        DATE(timestamp, '+8 hours') as date,
        LOWER(provider) as provider,
        COUNT(*) as requests,
        COALESCE(SUM(tokens_input), 0) as promptTokens,
        COALESCE(SUM(tokens_output), 0) as completionTokens,
        COALESCE(SUM(tokens_input + tokens_output), 0) as totalTokens
      FROM ${e} AS _u
      GROUP BY DATE(timestamp, '+8 hours'), LOWER(provider)
      ORDER BY date DESC, requests DESC
    `).all(s)},"getProviderUsageRows",0,function(e,s){return(0,t.getDbInstance)().prepare(`
      SELECT
        LOWER(provider) as provider,
        COALESCE(SUM(requests), 0) as requests,
        COALESCE(SUM(tokens_input), 0) as promptTokens,
        COALESCE(SUM(tokens_output), 0) as completionTokens,
        COALESCE(SUM(tokens_input + tokens_output), 0) as totalTokens,
        COALESCE(AVG(latency_ms), 0) as avgLatencyMs,
        COALESCE(SUM(CASE WHEN success = 1 THEN requests ELSE 0 END), 0) as successfulRequests
      FROM ${e} AS _u
      GROUP BY LOWER(provider)
      ORDER BY requests DESC
    `).all(s)},"getServiceTierUsageRows",0,function(e,s){return(0,t.getDbInstance)().prepare(`
      SELECT
        COALESCE(NULLIF(service_tier, ''), 'standard') as serviceTier,
        LOWER(provider) as provider,
        LOWER(model) as model,
        COALESCE(NULLIF(service_tier, ''), 'standard') as serviceTier,
        COALESCE(SUM(requests), 0) as requests,
        COALESCE(SUM(tokens_input), 0) as promptTokens,
        COALESCE(SUM(tokens_output), 0) as completionTokens,
        COALESCE(SUM(tokens_cache_read), 0) as cacheReadTokens,
        COALESCE(SUM(tokens_cache_creation), 0) as cacheCreationTokens,
        COALESCE(SUM(tokens_reasoning), 0) as reasoningTokens,
        COALESCE(SUM(tokens_input + tokens_output), 0) as totalTokens,
        COALESCE(SUM(stored_cost), 0.0) as storedCost,
        MAX(is_aggregated) as isAggregated
      FROM ${e} AS _u
      GROUP BY DATE(timestamp, '+8 hours'), serviceTier, LOWER(provider), LOWER(model)
    `).all(s)},"getUsageSummary",0,function(e,s){return(0,t.getDbInstance)().prepare(`
      SELECT
        COALESCE(SUM(requests), 0) as totalRequests,
        COALESCE(SUM(tokens_input), 0) as promptTokens,
        COALESCE(SUM(tokens_output), 0) as completionTokens,
        COALESCE(SUM(tokens_input + tokens_output), 0) as totalTokens,
        COUNT(DISTINCT model) as uniqueModels,
        COUNT(DISTINCT COALESCE(NULLIF(account_key, ''), NULLIF(connection_id, ''))) as uniqueAccounts,
        COUNT(DISTINCT COALESCE(NULLIF(api_key_id, ''), NULLIF(api_key_name, ''))) as uniqueApiKeys,
        COALESCE(SUM(CASE WHEN success = 1 THEN requests ELSE 0 END), 0) as successfulRequests,
        COALESCE(AVG(latency_ms), 0) as avgLatencyMs,
        COALESCE(MIN(timestamp), '') as firstRequest,
        COALESCE(MAX(timestamp), '') as lastRequest
      FROM ${e} AS _u
    `).get(s)??{totalRequests:0,promptTokens:0,completionTokens:0,totalTokens:0,uniqueModels:0,uniqueAccounts:0,uniqueApiKeys:0,successfulRequests:0,avgLatencyMs:0,firstRequest:"",lastRequest:""}},"getWeeklyPatternRows",0,function(e,s){return(0,t.getDbInstance)().prepare(`
      SELECT
        dayOfWeek,
        COUNT(*) as days,
        COALESCE(SUM(requests), 0) as requests,
        COALESCE(SUM(totalTokens), 0) as totalTokens
      FROM (
        SELECT
          DATE(timestamp, '+8 hours') as date,
          strftime('%w', timestamp, '+8 hours') as dayOfWeek,
          COALESCE(SUM(requests), 0) as requests,
          COALESCE(SUM(tokens_input + tokens_output), 0) as totalTokens
        FROM ${e} AS _u
        GROUP BY DATE(timestamp, '+8 hours'), strftime('%w', timestamp, '+8 hours')
      )
      GROUP BY dayOfWeek
      ORDER BY dayOfWeek ASC
    `).all(s)}])}];

//# sourceMappingURL=_0da5f8i._.js.map