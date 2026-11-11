import { defineConfig } from "astro/config";
import fuwariTheme, { fuwariIntegrations } from "astro-theme-fuwari";

// 转载声明卡的样式：主题包只管通用排版，这类「本站内容约定」留在博客仓，
// 因此以独立 CSS 字符串注入，避免为了一个 class 去 fork 主题组件。
import { reprintCss } from "./src/styles/reprint-css.ts";
import { siteStyles } from "./src/styles/site-styles-integration.ts";
// https://astro.build/config
export default defineConfig({
	site: "https://h1s97x.github.io/",
	trailingSlash: "always",
	integrations: [
		// 主题包：拥有布局/组件/路由/集合 schema 与 markdown 配置，博客只提供内容
		fuwariTheme({
			// 侧栏个人链接。CNB 没有品牌图标，用 code-blocks 代替
			profileConfig: {
				links: [
					{
						name: "GitHub",
						icon: "fa6-brands:github",
						url: "https://github.com/h1s97x",
					},
					{
						name: "CNB",
						icon: "material-symbols:code-blocks-rounded",
						url: "https://cnb.cool/u/h1s97x",
					},
					{
						name: "Bilibili",
						icon: "fa6-brands:bilibili",
						url: "https://space.bilibili.com/156170194",
					},
					{
						name: "Email",
						icon: "fa6-solid:envelope",
						url: "mailto:yang1297656998@outlook.com",
					},
				],
			},
			// 评论系统（Giscus）。provider 亦可改为 "utterances"（需相应配置）。
			commentConfig: {
				provider: "giscus",
				giscus: {
					repo: "h1s97x/H1S97X.github.io",
					repoId: "R_kgDOJq3IOw",
					category: "Announcements",
					categoryId: "DIC_kwDOJq3IO84C0cUU",
				},
			},
		}),
		// 主题自带依赖的 Astro 集成（verbose 配置封装在主题包内）
		...fuwariIntegrations(),
		// 站点自有排版（转载声明卡等），不随主题升级被覆盖。
		// 走 Vite 真实管道产出 CSS 资源，Astro 会自动 <link> 到每个页面，
		// 不在 JS 里手工拼 <style>。
		siteStyles({
			name: "site-styles",
			code: reprintCss,
			moduleId: "virtual:site-styles.css",
		}),
	],
});
