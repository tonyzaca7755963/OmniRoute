# Omni 本机扩展：账号额度与中国时区

扩展位置：`/Users/macos/.omniroute/local-extensions/quota-timezone`
版本：1.0.0。独立于 npm 安装目录；升级不需要再次修改官方构建文件。

## 启动和组成

`/Users/macos/.omniroute/start-internal-service.sh` 通过 `NODE_OPTIONS=--require=…/preload.cjs` 加载扩展。现有 macOS LaunchAgent、内存保护、端口和认证入口继续使用。

- `quota-hud.js`：独立浏览器界面，通过同源、已登录的 `/api/providers` 与 `/api/usage/provider-limits` 读取账号及额度。使用账号优先级匹配可见行；匹配不唯一时不显示，避免把别人的额度放错位置。保留最近有效额度，按分钟刷新，没有背景模糊、SVG 发光或悬停提示。
- `preload.cjs`：在 HTML 文档响应中加载界面脚本；对官方后端模块仅在内存中修正周窗口过滤和时区。普通模型请求、WebSocket 和流式响应不经过 HTML 缓冲路径。HTML 最大缓冲 8 MiB，超过后直接透传。
- `timezone-rules.json`：保留此前中国时区修正的适配规则；不依赖构建文件名。SQL 日期分桶还有按功能识别的 UTC+8 适配。
- `config.json`：开关、Asia/Shanghai 时区、扩展版本。
- `verify.cjs`：测试不同构建文件名、周窗口、日期 SQL、HTML 注入、SSE 透传，且验证官方文件字节不改变。

扩展文件本身不会被官方升级覆盖。它仍依赖现有 API、账号行结构及后端模块导出约定；官方改变这些接口时需要调整适配器，不能保证所有未来版本永久兼容。

## 升级后验收

1. 按正常方式升级 Omni，重启原 LaunchAgent；加载入口会自动继承。
2. `node --require /Users/macos/.omniroute/local-extensions/quota-timezone/preload.cjs /Users/macos/.omniroute/local-extensions/quota-timezone/verify.cjs`
3. 打开原账号页，确认 21 个账号的当前和周额度，排序/筛选/换行正确。
4. `http://127.0.0.1:20128/__omni_local/status` 应报告 1.0.0 与 Asia/Shanghai；访问额度接口后 weeklyModules 应大于 0，访问用量图表后 timezoneModules 应大于 0。该入口只输出扩展状态，没有认证材料。
5. 页面控制台 `window.__omniLocalQuota` 应报告 active；如果是 waiting-for-account-layout，先检查官方 UI 是否改变。用量日期必须按 UTC+8 的跨午夜边界验证。

## 禁用和回滚

把 `config.json` 的 enabled 改为 false，重启 `com.omniroute.router` 即可回到官方行为；不需要修改 npm 包。恢复 true 并重启即可重新启用。

迁移前的相关官方文件和启动脚本保存在 `migration-backup/`。`migrate.py` 仅用于本次迁移，不是升级脚本；不要升级后重新运行它。

## 本次验收

官方安装包的本次额度和时区直接补丁已撤回，运行时通过独立扩展提供功能。不同构建文件名模拟测试通过；真实周额度接口保留 Gemini/Claude 两个周窗口；UTC+8 跨日边界测试通过。真实账号页独立脚本可用，旧 React HUD 已退出。

### 2026-10-08 前端兼容修复（1.0.1）

旧版官方静态资源可能仍留在浏览器缓存中。独立扩展通过 CSS 隐藏旧 `[data-agy-quota-hud]` 节点，保留 React 对它们的管理；每个账号仅保留一个扩展自有额度框。普通刷新即可加载新版扩展，无需清除登录态或修改官方资源。
