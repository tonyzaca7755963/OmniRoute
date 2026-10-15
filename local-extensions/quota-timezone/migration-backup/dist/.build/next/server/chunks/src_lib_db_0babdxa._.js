function _formatCstDateFromIso(v){if(!v)return null;let d=new Date(v);if(Number.isNaN(d.getTime()))return v.split("T",1)[0]||null;let p=new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Shanghai",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(d),y="",m="",day="";for(let x of p){if(x.type==="year")y=x.value;if(x.type==="month")m=x.value;if(x.type==="day")day=x.value;}return y+"-"+m+"-"+day;};module.exports=[126603,e=>{"use strict";var t=e.i(899378);e.s(["getAccountCostRows",0,function(e,s){return(0,t.getDbInstance)().prepare(`
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
    `).all(s)}])},154945,e=>{"use strict";e.s(["buildPresetUnifiedSource",0,function(e){let{sinceIso:t,untilIso:s,rawCutoffDate:a,apiKeyWhere:o,apiKeyParams:n}=e,c=_formatCstDateFromIso(t)??null,r=(!c||c<a)&&!o,i={},E=[];r?(E.push("timestamp >= @presetRawCutoff"),i.presetRawCutoff=new Date(a+"T00:00:00.000+08:00").toISOString()):t&&(E.push("timestamp >= @presetSince"),i.presetSince=t),o&&(E.push(o),Object.assign(i,n));let u=E.length>0?`WHERE ${E.join(" AND ")}`:"",_=[];r&&(t&&(_.push("date >= @presetSinceDate"),i.presetSinceDate=c),_.push("date < @presetRawCutoffDate"),i.presetRawCutoffDate=a);let C=_.length>0?`WHERE ${_.join(" AND ")}`:"";return{unifiedSource:r?`(
        SELECT timestamp, provider, model, service_tier,
          tokens_input, tokens_output,
          tokens_cache_read, tokens_cache_creation, tokens_reasoning,
          0.0 as stored_cost, 0 as is_aggregated
        FROM usage_history
        ${u}
        UNION ALL
        SELECT
          date || 'T12:00:00.000Z' as timestamp,
          provider, model,
          'standard' as service_tier,
          total_input_tokens as tokens_input,
          total_output_tokens as tokens_output,
          0 as tokens_cache_read,
          0 as tokens_cache_creation,
          0 as tokens_reasoning,
          COALESCE(total_cost, 0.0) as stored_cost,
          1 as is_aggregated
        FROM daily_usage_summary
        ${C}
      )`:`(SELECT timestamp, provider, model, service_tier,
          tokens_input, tokens_output,
          tokens_cache_read, tokens_cache_creation, tokens_reasoning,
          0.0 as stored_cost, 0 as is_aggregated
        FROM usage_history
        ${u}
      )`,unifiedParams:i}},"buildUnifiedSource",0,function(e){let{sinceIso:t,untilIso:s,rawCutoffDate:a,apiKeyWhere:o,apiKeyParams:n}=e,c=_formatCstDateFromIso(t)??null,r=(!c||c<a)&&!o,i={},E=[];r?(E.push("timestamp >= @rawCutoff"),i.rawCutoff=new Date(a+"T00:00:00.000+08:00").toISOString()):t&&(E.push("timestamp >= @since"),i.since=t),s&&(E.push("timestamp <= @until"),i.until=s),o&&(E.push(o),Object.assign(i,n));let u=E.length>0?`WHERE ${E.join(" AND ")}`:"",_=[];r&&(t&&(_.push("date >= @sinceDate"),i.sinceDate=c),s&&(_.push("date <= @untilDate"),i.untilDate=(_formatCstDateFromIso(s)||"")),_.push("date < @rawCutoffDate"),i.rawCutoffDate=a);let C=_.length>0?`WHERE ${_.join(" AND ")}`:"";return{unifiedSource:r?`(
        SELECT
          timestamp,
          provider,
          model,
          tokens_input,
          tokens_output,
          tokens_cache_read,
          tokens_cache_creation,
          tokens_reasoning,
          service_tier,
          success,
          latency_ms,
          connection_id,
          account_key,
          api_key_id,
          api_key_name,
          0.0 as stored_cost,
          0 as is_aggregated,
          1 as requests
        FROM usage_history
        ${u}
        UNION ALL
        SELECT
          date || 'T12:00:00.000Z' as timestamp,
          provider,
          model,
          total_input_tokens as tokens_input,
          total_output_tokens as tokens_output,
          0 as tokens_cache_read,
          0 as tokens_cache_creation,
          0 as tokens_reasoning,
          'standard' as service_tier,
          1 as success,
          NULL as latency_ms,
          NULL as connection_id,
          NULL as account_key,
          NULL as api_key_id,
          NULL as api_key_name,
          COALESCE(total_cost, 0.0) as stored_cost,
          1 as is_aggregated,
          total_requests as requests
        FROM daily_usage_summary
        ${C}
       )`:`(SELECT
          timestamp, provider, model,
          tokens_input, tokens_output,
          tokens_cache_read, tokens_cache_creation, tokens_reasoning,
          service_tier, success, latency_ms,
          connection_id, account_key, api_key_id, api_key_name,
          0.0 as stored_cost, 0 as is_aggregated,
          1 as requests
        FROM usage_history
        ${u}
      )`,unifiedParams:i}}])}];

//# sourceMappingURL=src_lib_db_0babdxa._.js.map