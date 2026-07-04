# Repo 页新增 Engagement section 设计

日期：2026-07-05
状态：已确认

## 目标

在 repo 页 sidebar 新增 **Engagement（互动）** section，位于 releases 与 contributors 之间（即 contributors 上方）。页面用共享 `TabSwitcher` 在三个子 tab 间切换：

- **Stargazers**：star 了该仓库的人
- **Forks**：fork 出去的仓库（含 fork 的人）
- **Watchers**：watch 该仓库的人

已确认的命名与形态决策：

- section id：`engagement`；英文 "Engagement"，中文「互动」。
- Forks 子 tab 一行是一个 **fork 仓库行**（owner 头像 + `owner/repo` + 描述 + star 数 + 更新时间），点击打开该 fork 的仓库 tab；不做「人的行 + fork 链接」形态。
- Stargazers / Watchers 是用户行，与 account 页 followers 行同构。

## 关键 API 事实

- REST `GET /repos/{owner}/{repo}/stargazers`：simple user 列表，page/per_page（最大 100），Link header 分页。
- REST `GET /repos/{owner}/{repo}/subscribers`：watchers 列表（注意 repo 字段里 `watchers_count` 是 star 数别名，真正的 watch 数是 `subscribers_count`，`repositories.ts:1746` 已正确映射）。
- REST `GET /repos/{owner}/{repo}/forks`：返回完整 repo 对象（owner、description、stargazers_count、pushed_at 等），支持 `sort=newest`。
- 三个列表均无 viewer 关系与 bio；stargazers/watchers 需复用 accounts 模块的 GraphQL `repositoryOwner` aliased enrich（批量 100 login/次）补 `name / bio / viewerIsFollowing / viewerCanFollow / isFollowingViewer`。forks 行不需要 enrich。
- 总数已现成可用：`GitHubRepositoryOverviewCounts` 的 `stars / watchers / forks`（types.ts:320），repo 页 overview counts 已加载，直接喂 TabSwitcher 徽标。

## 架构（followers 封顶窗口模式）

沿用四层结构：renderer composable（pinia-colada）→ preload bridge → main IPC → `@oh-my-github/api`。

### 数据层（`packages/api/src/modules/repositories.ts` 扩展，或按体量拆 `repositories.engagement.ts`）

三个新方法：`listRepositoryStargazers` / `listRepositoryWatchers` / `listRepositoryForks`，统一模式（同 accounts 的 follows 实现）：

- 首页探测 Link header 的 lastPage；超过 `MAX_PAGES = 10`（页大小 100）时只取**最新 10 页**（尾部窗口），返回 `truncated: true`；列表按最新在前排序（REST 返回升序，取尾部后 reverse）。
- 返回 `{ items, totalCount, truncated }`。totalCount 由 lastPage 推算（同 follows）。
- stargazers/watchers 的 item 结构对齐 `GitHubAccountFollowUser`（复用 enrich 与映射）；forks 的 item 为 `{ owner, ownerAvatarUrl, name, fullName, description, stars, pushedAt }`。

preload / main IPC 各加三个透传通道，命名跟随现有 `repositories:*` 约定。

### renderer

- `composables/github/use-repositories.ts` 新增 `useRepositoryStargazersQuery` / `useRepositoryWatchersQuery` / `useRepositoryForksQuery`，enabled 由「section 激活 && 对应子 tab 激活」控制（懒加载），staleTime 跟随现有列表 query 约定。
- 新组件 `pages/repository/components/engagement/section.vue`，结构照搬 `account-followers-section.vue`：
  - 顶部一行：TabSwitcher（⭐ Stargazers / 🍴 Forks / 👁 Watchers，count 取 overview counts）+ 右侧搜索框（300ms debounce，本地过滤）。
  - 用户行：头像、name、login、bio、`isFollowingViewer` 徽标、follow/unfollow 按钮（复用 `setAccountFollowed` + override 乐观更新）；点击行 emit 打开账号 tab。
  - fork 仓库行：owner 头像、`owner/repo`、描述、⭐ 数、pushed 相对时间；点击行 emit 打开仓库 tab（repository-page 已有打开 repo/account tab 的事件路径，跟随 contributors/overview 的既有 emit 约定）。
  - truncated 提示、骨架屏、错误态（重试按钮）、空态、`AppPagination`（PER_PAGE = 20，本地分页）——全部同 followers section 形态。
  - 子 tab 状态仅内存，不进 URL。

### 导航与类型

- `pages/workspace/types.ts` 的 `RepositoryTabId` 在 `'releases'` 与 `'contributors'` 之间插入 `'engagement'`。
- `repository-page.vue`：sections 数组同位置注册（icon 用 lucide `Sparkles`）；渲染分支加 `EngagementSection`。
- sidebar 徽标计数：`repository-section-counts.ts` 不动（engagement 不在 sidebar 显示 count，与 contributors 一致；count 在 section 内 TabSwitcher 上展示）。
- workspace URL：`repositorySection` 随 `RepositoryTabId` 类型扩展自动覆盖，`workspace-url.ts` 若有 section 白名单需同步。

### i18n

- en/zh 补 `repository.engagement.*`：tab 标签（Stargazers/互动等）、搜索占位、空态（每个子 tab 一组）、错误态、truncated 提示、分页 summary。
- 注意 vue-i18n 中 bare `@` 需写成 `{'@'}`；key 完整性由 locales.test.ts 兜底。

## 测试

- `packages/api/src/modules/repositories.engagement.test.ts`：
  - 窗口截断（lastPage > 10 时取尾部窗口、truncated 标记、totalCount 推算）。
  - stargazers/watchers 的 enrich 合并与字段映射；enrich 失败时降级为无 bio/关系。
  - forks 行字段映射（owner、stars、pushedAt）。
- locale key 由现有 `locales.test.ts` 自动覆盖。

## 明确不做（YAGNI）

- 不做 GraphQL cursor 真分页（followers 同款封顶窗口已够用）。
- 不做 forks 的 sort 切换 UI（固定 newest）。
- 不做概览页的 engagement 卡片（遵循「新 tab 不加概览卡片」约定）。
- 子 tab 不持久化到 URL。
