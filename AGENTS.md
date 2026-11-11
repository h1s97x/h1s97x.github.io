# H1S97X's Blog - Agent 规范

## 项目概述

Astro 静态博客，使用 Fuwari 主题。主题已抽离为独立 npm 包 `astro-theme-fuwari`（CNB 制品库发布，MIT；原作者 saicaca/fuwari），博客仓仅保留内容与最少配置。由 Hexo 迁移而来，详见 docs/MIGRATION_ASTRO.md。

**项目愿景**: 将此项目打造成 Astro 生态的标杆博客，具备流程规范、代码高质量、高可维护性和高解耦架构。

## 技术栈

- **框架**: Astro 5.x（目标 7，见 Roadmap；TypeScript，构建基于 Vite）
- **主题**: Fuwari（saicaca/fuwari，MIT），以独立包 `astro-theme-fuwari` 经 CNB 制品库引入，博客仓不持有主题代码
- **语言**: Node.js >= 20.19.0；内容用 Markdown/MDX
- **包管理器**: pnpm（强制使用，禁止 npm/Yarn；preinstall 有 only-allow 校验）

## 核心设计原则

### 简洁务实

- 内容用 Markdown 写在 `src/content/posts/`，单页写在 `src/content/spec/`
- 主题代码（路由/布局/组件/样式）在 `astro-theme-fuwari` 包内，由 `astro.config.mjs` 通过集成注入；定制主题在主题仓库进行
- 迁移/工具脚本放在 `tools/` 目录
- 站点配置集中在 `astro.config.mjs`（集成/重定向/评论）；内容集合 schema 见 `src/content/config.ts`

## Git 工作流

### 分支管理

| 分支类型 | 命名格式                  | 示例                     |
| -------- | ------------------------- | ------------------------ |
| feature  | `feature/<ticket>-<描述>` | `feature/123-add-plugin` |
| fix      | `fix/<ticket>-<描述>`     | `fix/456-fix-render`     |
| hotfix   | `hotfix/<ticket>-<描述>`  | `hotfix/789-fix-deploy`  |
| refactor | `refactor/<描述>`         | `refactor/plugins`       |

### Commit Message 规范

```
<type>(<scope>): <subject>

type: feat | fix | docs | style | refactor | perf | test | chore
```

### PR 流程

1. 从 `main` 创建功能分支（如 `feature/astro-migration`）
2. 开发 + 本地 `pnpm build` 验证
3. 提交 PR 到 `main`
4. Code Review
5. Squash and merge
6. 合并后由 `.cnb.yml` rebase 同步到 GitHub，触发 GitHub Actions 部署到 Pages

## CI/CD 要求

- 所有 CI 必须使用 pnpm
- GitHub Actions（`.github/workflows/`）：
  - `ci.yml` — PR 触发，单 Node 22，`pnpm install --frozen-lockfile` + `astro check` + `astro build`
  - `deploy.yml` — `main` 推送后 `actions/deploy-pages` 部署到 `github-pages` 环境（Pages 源 = GitHub Actions）
- `ci.yml` / `deploy.yml` 均注入 `CNB_TOKEN`（Secrets），用于从 CNB 制品库安装私有主题包
- 分支命名与 commit message 规范见上

## 当前状态

### 已完成 ✅

- **框架迁移**: Hexo + Almagest → Astro 5 + Fuwari
- **内容迁移**: 158 篇内容迁入 `src/content/posts/`（含图片资源），frontmatter 标准化
- **主题抽离**: Fuwari 抽成独立包 `astro-theme-fuwari`（CNB npm 制品库），博客依赖当前 `0.1.7`
- **路由统一**: 单流 `/posts/<slug>/`；旧 `/blog/`、`/notes/`、`/coding/` 路由已不再维护（迁移完成，旧链未保留 301，直接 404）
- **功能补齐**: Giscus 评论（已显式写入 `astro.config.mjs`）、Pagefind 搜索、sitemap、RSS、明暗主题切换
- **站点增强**: 全站 footer 的 Not-by-AI 徽章（`0.1.3`）、右下角「随机文章」浮动按钮（`0.1.4`）
- **部署链路**: `.cnb.yml` rebase 同步到 GitHub → GitHub Actions 部署 Pages（Actions 模式）

### 待处理 / Roadmap

> **决策（方案 C）**：Astro 7 升级**前置**到多语言 i18n 之前。主题包是版本硬卡点（`peerDependencies: astro: ^5.0.0` + Astro-5 时代集成 `@astrojs/svelte@7`/`tailwind@6`/`rss@4`/`sitemap@3`），必须先升主题、发新包、再升博客。i18n 依赖 Astro 6 的 **Content Layer**，故在 Astro 7 落地后紧接着做。所有阶段均开独立分支，**门禁（构建绿 + 全站视觉/功能回归）通过才合 `main`**。

#### 1) Astro 7 迁移（主题仓 → 博客仓，跨两个大版本，顺序不可跳）

**阶段 0 — 预检 / 门禁**
- 确认 CI Node ≥ 22.12（Astro 6 要求）。
- 审计主题包命中项：① `[...slug].astro` 的 `entry.render()`（v6 删除）→ 改 `import { render } from "astro:content"`；② 内容集合 schema（`type: 'content'` → Content Layer `glob()` loader，去掉 `type`）；③ Zod 校验器（v6 用 Zod 4：`z.string().email()` → `z.email()`）；④ `experimental` 标志；⑤ `astro:transitions` 内部常量（v7 移除）。
- 优先策略：主题仓**同步上游 Fuwari 最新 Astro-7 分支**，再把本仓 3 个定制补丁（tailwind content glob、giscus 容器、stylus 自包含预处理）rebase 回去，比手搓迁移更稳。
- 门禁：命中项清单建档；分支 `feature/astro7-migration` 已建。

**阶段 1 — 主题 → Astro 6**
- 升 `astro` 及 `@astrojs/svelte`/`tailwind`/`rss`/`sitemap` 到适配 6 的 major。
- 内容集合迁 Content Layer：`src/content.config.ts` + `glob()` loader，去 `type`。
- `entry.render()` → `render(entry)`。Zod 4 适配。
- 门禁：`pnpm build` 全绿（含 `astro check`）→ 发主题（v6 线，如 `0.2.0`）。

**阶段 2 — 主题 → Astro 7**
- 升 `astro@7` + 适配 7 的集成 major。
- Markdown：默认 Sätteri；若用 remark/rehype 插件则装 `@astrojs/markdown-remark` + `unified()`。
- 配置：移除 `experimental` 标志，`cache`/`routeRules` 上提顶层；按需处理 `compressHTML`（默认 `'jsx'`，需时回到 `true`）。
- Rust 编译器：修复组件 HTML 未闭合/非法嵌套（构建会报错）。
- 门禁：`pnpm build` 全绿 → 发主题（v7 线，如 `0.3.0`）。

**阶段 3 — 博客 → Astro 7**
- `astro` 升 7；`pnpm update astro-theme-fuwari` 拉到 v7 线；提交 `package.json` + `pnpm-lock.yaml`（同步提交 lockfile，防 CI frozen 失败）。
- 门禁：`pnpm install --frozen-lockfile` 通过 + `pnpm build` 全绿。

**阶段 4 — 全站回归 / 门禁（关键）**
- 158 篇文章渲染核对（Sätteri 与压缩变化可能引发细微差异：代码块、图片、内联空白）。
- 功能回归：搜索（Pagefind）、RSS、sitemap、301 重定向、Giscus、随机文章按钮、Not-by-AI 徽章、明暗主题、移动端布局。
- 门禁：本地 + PR 预览逐项通过，再合 `main` 部署。

#### 2) 多语言 i18n（紧随 Astro 7）

- 博客 `astro.config.mjs` 开原生 i18n 路由：`{ defaultLocale: "zh-CN", locales: ["zh-CN","en"], routing: { prefixDefaultLocale: false } }`。
- 主题改造（发新版）：`translation.ts` 的 `i18n()` 从 `siteConfig.lang` 改读 `Astro.currentLocale`；`Layout.astro` 的 `<html lang>` 同步；`getSortedPosts` / `[...slug].astro` 按 locale 生成 `/en/...` 前缀、按语言过滤、加同文切换器。
- 内容：文章按 locale 分目录（`src/content/posts/zh/`、`/en/`）或加 `lang` 前端字段。
- 起步 `zh-CN + en`；其余 9 种 UI 文案主题已自带，加语言近乎零成本。
- UI 翻译用主题既有 TS 模块（新增语言 = 加 `xx.ts` + `map` 一行），**不引入 YAML**（内容 frontmatter 已是 YAML 子集）。
- 门禁：双语首页/文章/归档/关于均渲染正常，切换器工作，sitemap/RSS 按 locale 产出 alternates。

#### 3) 其他待办
- 主题视觉/配色定制（在 `astro-theme-fuwari` 仓库进行）。
- Dependabot 的 `astro` 5→7 提醒：当前保持关闭，待阶段 1–4 完成后重新评估。

详见: `docs/MIGRATION_ASTRO.md`

## 目录结构 (当前)

```
.
├── .cnb.yml                 # CNB 流水线（同步到 GitHub / PR 处理人）
├── .github/workflows/       # GitHub Actions（ci.yml / deploy.yml）
├── src/
│   ├── content/
│   │   ├── posts/           # 文章（Content Collections）：按 notebook 分 coding/ notes/ blog/ 三目录
│   │   ├── spec/            # 关于页等单页
│   │   └── config.ts        # 内容集合 schema 定义（re-export 主题 collections）
│   ├── styles/              # 站点自有样式（转载声明卡等，经 astro.config.mjs 注入）
│   └── （无 pages/components/layouts —— 主题代码在 astro-theme-fuwari 包内）
├── astro.config.mjs         # Astro 配置（主题集成注入 / 评论 / 站点样式）
├── pagefind.yml             # Pagefind 搜索索引配置
└── package.json
```

### 内容分离策略

| 类型      | 目录                 | 用途                     |
| --------- | -------------------- | ------------------------ |
| **Posts** | `src/content/posts/` | 全部文章（生活/技术/题解） |
| **Spec**  | `src/content/spec/`  | 关于页等单页             |

> 内容由迁移脚本 `tools/migrate-fuwari.mjs` 从 Hexo 迁移而来；脚本会清空并重建 `src/content/posts/`，因此**手写新文章要放在该目录之外的备份，或改脚本行为后再增删**。

### 路由结构

```
/              - 首页（文章分页流）
/archive/      - 归档（按年份 + 标签/分类筛选）
/posts/<slug>/ - 文章详情
/about/        - 关于页面
```

## 运行命令

| 命令                | 说明                                       |
| ------------------- | ------------------------------------------ |
| `pnpm dev`          | 启动本地预览（默认 4321）                  |
| `pnpm build`        | 构建（`dist/`）并生成 Pagefind 搜索索引    |
| `pnpm check`        | `astro check` 类型与内容检查               |
| `pnpm lint`         | Biome 检查                                 |
| `pnpm type-check`   | `tsc --noEmit` 类型检查                    |

## 图片与图床（重要）

**所有文章配图走图床仓库 [h1s97x/Pixy](https://github.com/h1s97x/Pixy)，博客仓不再存放图片**（`public/` 已清空）。转载文章的图同样进图床，但用 `reprint-` 前缀与自有图区分。

引用一律用 GitHub raw 域名，**不要用 `cnb.cool`**：

```text
✅ https://raw.githubusercontent.com/h1s97x/Pixy/main/images/<文件名>
❌ https://cnb.cool/h1s97x/Pixy/-/git/raw/main/images/<文件名>
   —— 响应带 Cross-Origin-Resource-Policy: same-origin，浏览器直接拦截，图片全是空图
❌ https://cnb.cool/h1s97x/Pixy/-/raw/main/images/<文件名>
   —— 返回 text/html（登录页），同样出不来图
```

> `/-/git/raw/` 在 `curl` 下返回 200，很容易误判「链接是好的」；只有浏览器里才会暴露。
> 校验图片链接时务必用浏览器（或检查 `Cross-Origin-Resource-Policy` / `Content-Type`），别只看状态码。

### 转载文章

转载文章的**徽章用 shields.io 静态徽章**（`img.shields.io`，与 README 同一套），不自己画 PNG：

```markdown
[![转载](https://img.shields.io/badge/%E6%9C%AC%E6%96%87%E4%B8%BA%E8%BD%AC%E8%BD%BD-%E9%9D%9E%E5%8E%9F%E5%88%9B-orange?style=flat-square)](<原文链接>)
```

声明卡（原文链接 / 协议 / 转载说明）用 `<div class="reprint-note">` 包住，样式在 `src/styles/reprint-css.ts`，由 `astro.config.mjs` 注入（`head-inline` 注入的是 `<script>`，CSS 必须自己建 `<style>` 元素，否则样式不生效）。

### 图床命名

命名遵循图床仓的 [NORMALIZING.md](https://github.com/h1s97x/Pixy/blob/main/NORMALIZING.md)：`<语义名>-<YYYYMMDD>.<ext>`，全小写、`-` 分隔；转载图以 `reprint-` 开头。上传前跑图床仓的 `scripts/validate-images.sh`。

## 常见问题

1. **主题（Fuwari）**: 独立包 `astro-theme-fuwari`（CNB 制品库）。改主题 → 主题仓升版 `npm publish` → 博客 `pnpm update astro-theme-fuwari` 并提交 lockfile。
2. **构建失败**: 先 `pnpm install` 再 `pnpm build`；Content Collections 的 frontmatter 校验失败会直接报错。CI 装包需 `CNB_TOKEN`，本地 shell 也需该环境变量。
3. **样式偶发报错 `The \`link\` class does not exist`**: 起因是主题包 ≤ 0.1.5 的 CSS 只被 `ImageWrapper.astro` 里过宽的 `import.meta.glob("../../**")` 顺带加载，`markdown.css` 的 `@apply link` 依赖 `main.css` 先加载。主题包 0.1.6 起已显式按序加载样式并展开跨文件 `@apply`；博客仓已升级到 0.1.7 并移除 `patches/astro-theme-fuwari.patch` 与 `themeCssOrderFix()` 兜底，无需再打补丁。

## Coze 平台配置

- **preview_enable**: enabled
- **端口**: 5000
- **deploy.kind**: service
- **deploy.flavor**: web
