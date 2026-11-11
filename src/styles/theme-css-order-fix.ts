/**
 * 主题包（astro-theme-fuwari ≤ 0.1.5）的样式加载顺序隐患的兜底修复。
 *
 * 问题：主题的 `styles/main.css` 与 `styles/markdown.css` 之间是 **@apply 依赖**——
 * `markdown.css` 里 `@apply link`、`@apply btn-regular-dark` 用到的类定义在 `main.css`。
 * 而 `markdown.css` 并没有被任何组件显式 import，它只是被 `ImageWrapper.astro` 里
 * 过宽的 `import.meta.glob("../../**")` 顺带扫进打包图。这张依赖图的遍历顺序取决于
 * 文件系统枚举顺序，于是同一份代码会**顺序相关地偶发构建失败**：
 *
 *   [vite:css] markdown.css:23:9: The `link` class does not exist.
 *
 * `patches/astro-theme-fuwari.patch` 已经把这两个文件在 `GlobalStyles.astro` 里按顺序
 * 显式 import 了，但那只是把 `main.css` 接进了图里，Vite 仍会把模块按自己的顺序
 * 派发给 PostCSS 插件：`markdown.css` 先行时照样报错。
 *
 * 这里的做法：给 `markdown.css` 兜一层「不依赖顺序」的入口——把 `main.css` 的前置声明
 * 和 `markdown.css` 都内联进一个虚拟模块，且 `main.css` 的内容 `once` 化，避免主题
 * 自己的 import 再产出一份重复的 main 样式。
 *
 * 主题仓修好根因并发新版本后，删掉本文件与 `astro.config.mjs` 里对应的那一行即可。
 */
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import type { AstroIntegration } from "astro";

/** 主题包里真正持有 @apply 目标的样式文件 */
const MAIN_CSS = /theme-fuwari[\\/]src[\\/]styles[\\/]main\.css$/;
/** 需要被兜底的、含跨文件 @apply 的样式入口 */
const DEPENDENT_CSS = /theme-fuwari[\\/]src[\\/]styles[\\/]markdown\.css$/;

/**
 * 本文件在 `<消费站>/src/styles/` 下，包管理器布局不同（pnpm 嵌套 / hoisted），
 * 因此顺着祖先目录找 `node_modules/astro-theme-fuwari`，而不是 resolve 包的 exports
 * （主题包的 exports 没导出 package.json）。
 */
function loadThemeMainCss(): string {
	let dir = dirname(fileURLToPath(import.meta.url));
	while (true) {
		const candidate = join(dir, "node_modules/astro-theme-fuwari/src/styles/main.css");
		if (existsSync(candidate)) return readFileSync(candidate, "utf8");
		const parent = resolve(dir, "..");
		if (parent === dir) throw new Error("未找到 astro-theme-fuwari/src/styles/main.css");
		dir = parent;
	}
}

export function themeCssOrderFix(): AstroIntegration {
	return {
		name: "theme-css-order-fix",
		hooks: {
			"astro:config:setup": ({ updateConfig, logger }) => {
				updateConfig({
					vite: {
						plugins: [
							{
								name: "theme-css-order-fix",
								enforce: "pre",
								transform(code: string, id: string) {
									if (MAIN_CSS.test(id)) {
										// 主题自己 import 过一份，这里再产出一份会让组件类重复。
										// 返回空串而不是 null：模块仍在图里，内容留空即可。
										return { code: "", map: null };
									}
									if (DEPENDENT_CSS.test(id)) {
										let main = "";
										try {
											main = loadThemeMainCss();
										} catch (error) {
											// 主题换了目录结构就别硬来了，保持原样并提示
											logger.warn(`未能内联主题 main.css，跳过顺序修复：${error}`);
											return null;
										}
										// main.css 先于 markdown.css 进入同一份样式表，
										// markdown.css 的 @apply 目标因此一定已经定义。
										return { code: `${main}\n${code}`, map: null };
									}
									return null;
								},
							},
						],
					},
				});
			},
		},
	};
}
