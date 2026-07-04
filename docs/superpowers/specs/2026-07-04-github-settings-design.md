# Settings 窗口新增 GitHub 账号设置(镜像 github.com/settings)设计

日期:2026-07-04
状态:已确认

## 目标

在现有 settings 弹窗中镜像 GitHub web 个人设置(github.com/settings):

- 有 API 支持的分类做成**应用内可交互 tab**(8 个);
- 没有 API 的分类保留侧边栏入口,点击**直接打开浏览器**到对应 settings 页(带 ↗ 图标);
- 侧边栏按 GitHub web 自身的分组结构组织(Account / Access / Code & automation / Security / Integrations / Archives / Developer settings),自然融入,不打统一的「GitHub」大标签;
- 扩充 OAuth scopes 使可写项真正可编辑;老 token 显示重新授权横幅。

明确去掉的项:web 端 Appearance、Accessibility(桌面应用内已有自己的外观设置,放着违和)。

## 关键 API 事实(调研结论,已逐条对照 docs.github.com 核实)

### 文档明确支持(OAuth app token + classic scope)

| 分类 | 端点 | 所需 classic scope |
|---|---|---|
| Public profile | `GET/PATCH /user`(字段:name, email, blog, twitter_username, company, location, hireable, bio);social accounts `GET/POST/DELETE /user/social_accounts` | 读 `read:user`;写 `user` |
| Emails | `GET /user/emails`、`POST/DELETE /user/emails`、`PATCH /user/email/visibility` | 读 `user:email`;写 `user`(visibility 端点未标注 classic scope,预期 `user`) |
| SSH keys | `GET/POST/DELETE /user/keys` | `read:`/`write:`/`admin:public_key` |
| GPG keys | `GET/POST/DELETE /user/gpg_keys` | `read:`/`write:`/`admin:gpg_key` |
| SSH signing keys | `GET/POST/DELETE /user/ssh_signing_keys` | `read:`/`write:`/`admin:ssh_signing_key` |
| Codespaces secrets | `GET/PUT/DELETE /user/codespaces/secrets/*` + public-key + 仓库访问管理 | `codespace` 或 `codespace:secrets` |

### API 存在但 OAuth app token 支持未在文档标注(实现时先实测)

- **Blocked users**:`GET /user/blocks`、`GET/PUT/DELETE /user/blocks/{username}`。页面无 classic scope 说明,预期 `user` 可用。
- **Interaction limits**:`GET/PUT/DELETE /user/interaction-limits`(limit: `existing_users|contributors_only|collaborators_only`,expiry: `one_day|three_days|one_week|one_month|six_months`)。同上。
- **Organizations**:读 `GET /user/memberships/orgs`(现有 `read:org` 即可);写只有接受邀请(`PATCH /user/memberships/orgs/{org}` 仅接受 `state:"active"`)和公开/隐藏自己的成员身份(`PUT/DELETE /orgs/{org}/public_members/{me}`),疑似需 `write:org` — **不加该 scope**,实测 `user` 不行就降级为 ↗。
- **Saved replies**:GraphQL `viewer.savedReplies` 只读;schema 中确认**无任何** create/update/delete mutation。现有 `read:user` 即可读。

### 完全没有 API(全部做成 ↗ 浏览器跳转项)

Account(改名/删号/导出,`/settings/admin`)、Notifications 偏好路由(`/settings/notifications`)、Billing(`/settings/billing`,用量 GET 仅支持 GitHub App token/fine-grained PAT,OAuth token 不可用,不做)、Password & authentication(`/settings/security`)、Sessions(`/settings/sessions`)、Code review limits(`/settings/code_review_limits`)、Repositories 新仓库默认分支名(`/settings/repositories`)、Packages(`/settings/packages`)、Copilot(`/settings/copilot`)、Pages(`/settings/pages`)、Code security(`/settings/security_analysis`)、Applications(`/settings/installations`,写操作仅 classic PAT 或 app 自身凭据可做)、Scheduled reminders(`/settings/reminders`)、Security log(`/settings/security-log`)、Sponsorship log(`/settings/sponsors-log`)、Developer settings(`/settings/apps`)。

其他要点:

- **换 primary email 无 API**;头像上传无 API;key 类无编辑端点(删除重加)。
- Codespaces secret 值须用 libsodium sealed-box(`crypto_box_seal`)以账号 public key 加密后 base64 上传。
- GitHub 在 2025-09 关停了旧版按产品 billing 端点。

## OAuth scope 扩充与重新授权

`defaultGitHubOAuthScopes`(`packages/api/src/modules/auth.ts`)追加 5 个,原列表保持不动:

```
user, admin:public_key, admin:gpg_key, admin:ssh_signing_key, codespace:secrets
```

(`user` 覆盖 `read:user`/`user:email`/`user:follow`,保留旧项无害。)

- token 实际 scopes 已由 `client/src/main/auth.ts` 持久化。
- 每个应用内 tab 声明所需 scopes;打开 tab 时若当前激活账号 token 缺失,tab 顶部显示「需要重新授权才能编辑」横幅 + 重新登录按钮;有读权限的内容照常展示(如 Emails 用 `user:email` 就能读列表)。不做静默打断式弹窗。

## 侧边栏结构

现有 `Interface` 组(Appearance/Keyboard/About)保持第一组不动。之后新增分组(命名与 GitHub web 一致;`←` 为应用内 tab,`↗` 为浏览器跳转):

```
Account
  Public profile ←        Account ↗          Notifications ↗
Access
  Billing and licensing ↗  Emails ←          Password & authentication ↗
  Sessions ↗               SSH & GPG keys ←  Organizations ←
  Blocked users ←          Interaction limits ←  Code review limits ↗
Code & automation
  Repositories ↗   Codespaces ←   Packages ↗   Copilot ↗   Pages ↗   Saved replies ←
Security
  Code security ↗
Integrations
  Applications ↗   Scheduled reminders ↗
Archives
  Security log ↗   Sponsorship log ↗
Developer settings ↗
```

- ↗ 项点击调用现有 `links:open-external-url`,不切换 tab,右侧 external-link 小图标。
- 未登录 GitHub 时新分组整体置灰并显示登录引导。
- `settings-tabs.ts` 的 `SettingsTabId` 增加 8 个应用内 tab id;↗ 项不进 tab id(纯动作)。

## 架构

沿用四层结构,不引入新模式:

1. **`packages/api/src/modules/user-settings.ts`** — 新 `UserSettingsApi` 类,聚合 8 个分类的端点(REST 为主 + saved replies GraphQL 查询),配套 `user-settings.test.ts`(mock octokit,跟随现有模式)。libsodium 加密逻辑放这一层。
2. **`client/src/main/user-settings.ts`** — 注册 `user-settings:*` IPC handler,取当前激活账号 token。
3. **preload** — 暴露 `window.ohMyGithub.userSettings.*`。
4. **renderer** — `composables/github/use-user-settings.ts`(pinia-colada query/mutation,mutation 后失效对应 query key);页面组件放 `pages/settings/components/github/`,复用 `settings-section`/`settings-block`/`settings-row` 原语。

## 8 个应用内 tab

1. **Public profile**:表单 Name、Bio(160 字计数)、Pronouns(预设下拉+自定义)、URL、Company、Location、Hireable 勾选、Public email(下拉:已验证邮箱 + private);Social accounts 列表(≤4,即时增删);头像仅展示,点击 ↗。底部「Update profile」统一提交 `PATCH /user`。
2. **Emails**:邮箱列表(primary/visibility/verified 徽章);添加(提示收验证邮件)、删除(primary 禁删);「Keep my email addresses private」开关;换 primary 放 ↗ 链接。
3. **SSH & GPG keys**:三分区(Authentication keys / Signing keys / GPG keys),每区列表(title、指纹、添加时间、最后使用)+「New key」对话框(title + key 粘贴)+ 删除(二次确认)。无编辑。
4. **Organizations**:组织列表(头像、名称、角色、成员身份公开状态);pending 邀请显示「Accept」(实测不可用则换 ↗);「Leave」等破坏性操作不做,放 ↗。
5. **Blocked users**:列表 + 按用户名屏蔽(确认后 PUT)+ 解除屏蔽。实测不可用则整 tab 降级为 ↗ 项。
6. **Interaction limits**:单选 No limits / Existing users / Contributors only / Collaborators only + 时长下拉;展示当前生效限制与剩余时间。实测同上。
7. **Codespaces**:secrets 列表(名称、更新时间、可访问仓库数)+ 新建/更新对话框(名称、值、仓库选择),值 sealed-box 加密后 PUT;底部一条 ↗ 说明(编辑器/region 等偏好无 API)。
8. **Saved replies**:只读列表(标题 + Markdown 预览);页头说明 API 不支持编辑,附 ↗。

## 通用规则、错误处理与测试

- 缺 scope → tab 顶部重新授权横幅(见上)。403/404 且响应 `X-OAuth-Scopes` 缺所需 scope 时归一化为「缺权限」错误驱动横幅。
- 破坏性操作(删 key、删邮箱、屏蔽用户)一律二次确认。
- 文案全部 i18n(en/zh),遵守 `@` 需写成 `{'@'}` 的规则(locales.test.ts 已守护)。
- API 层单测跟随现有 `*.test.ts` 模式;实测类端点(blocks、interaction-limits、org 邀请)在实现阶段先用真实 token 冒烟验证,再定 UI 形态。

## 实现顺序建议

1. scope 扩充 + 重新授权横幅基础设施;
2. 侧边栏分组重构 + ↗ 跳转项(独立可交付);
3. 文档明确支持的 4 个 tab:Public profile → Emails → SSH & GPG keys → Codespaces;
4. 实测后落地 4 个待验证 tab:Blocked users → Interaction limits → Organizations → Saved replies。
