# Repository Settings 阶段 5+6(Security / Integrations)Implementation Plan(随实现同步)

> 契约级计划,与实现同 PR 落地;四层管线与 UI 模式同阶段 2-4。

## 阶段 5:Security(`settingsSecurity`,tab:Advanced Security | Deploy keys | Secrets & variables)

- **api `repository-settings.security.ts`**:`getSecurityOverview`(security_and_analysis 三开关 + vulnerability-alerts(204/404)+ automated-security-fixes + private-vulnerability-reporting,均容错 null/unavailable);`updateSecurityAndAnalysis`(PATCH /repos security_and_analysis);三个 set* 开关(PUT/DELETE);deploy keys list/add/delete;secrets(actions/codespaces/dependabot 三作用域,`sealSecret` 提取到 `modules/seal-secret.ts` 与 user-settings 共用,PUT 前对各自 public-key 做 sealed-box 加密);actions variables CRUD。测试 6 例(sealSecret mock 验证 encrypted_value/key_id)。
- **UI**:`advanced-security-panel`(开关组,unavailable 隐藏,底部 ↗ security_analysis);`deploy-keys-panel`(框外添加表单 + bordered 列表,删除重建);`secrets-panel`(SegmentedControl 切三作用域;secret 只写:名称+值表单,编辑=同名覆盖;actions 作用域附 Variables 列表 CRUD)。
- 环境级 secrets/variables 暂缓(环境编辑对话框已提示去 GitHub;后续迭代可加)。

## 阶段 6:Integrations(`settingsIntegrations`,tab:Autolinks | GitHub Apps↗ | Email notifications↗)

- **api `repository-settings.integrations.ts`**:autolinks list/create(key_prefix、url_template 含 `<num>` 校验在 UI 层、is_alphanumeric)/delete(不可编辑)。
- **UI**:`integrations-section.vue` 单文件(TabSwitcher 含两个 ↗ 外链 tab,点击开浏览器不切换;autolinks 添加表单 + 列表)。
- 收尾:所有分类原生化后删除 `settings-links.ts` 外链壳与 `repository.settings.externalHint` 文案。

## 验证

- api:`repository-settings.security.test.ts`(6)+ `repository-settings.integrations.test.ts`(1,3 断言组)全绿;api 227 全绿。
- client:123 测试全绿,typecheck 干净。
- playwright 实测:settings-security / settings-integrations 页 tab 渲染与 sub 路由(与阶段 4 同脚本模式)。
