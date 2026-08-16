# 摸鱼游戏厅（Metro Mini Games）

一个为地铁、高铁、排队和发呆时间准备的 Mobile First 小游戏合集。没有账号、广告、追踪或服务器；进度只保存在设备中。V1 提供完整的 2048，其余游戏已预留卡片和扩展结构。

## 技术栈

- React + TypeScript + Vite
- 原生 Service Worker + Web App Manifest（没有运行时 PWA 依赖）
- localStorage 本地存档
- Vitest（游戏核心逻辑测试）

## 开发与构建

需要 Node.js 20+：

```bash
npm install
npm run dev       # 本地开发，访问终端显示的地址
npm test          # 单元测试
npm run lint      # 静态检查
npm run build     # 生成 dist/
npm run preview   # 在本机预览生产版本
```

Service Worker 仅在生产构建中注册，以免开发缓存干扰热更新。安装 PWA 或测试离线能力时，请使用 `npm run build && npm run preview -- --host`。正式部署必须使用 HTTPS（localhost 除外）。

## GitHub Pages 自动部署

仓库内置 `.github/workflows/deploy-pages.yml`。每次推送到 `main` 后，GitHub Actions 会自动安装依赖、执行测试和生产构建，并把 `dist/` 发布到 GitHub Pages。Vite 的 `base` 已设置为 `/moyu-club/`，Manifest、图标与 Service Worker 也都使用项目子路径。

首次启用只需进入 GitHub 仓库的 **Settings → Pages**，在 **Build and deployment → Source** 中选择 **GitHub Actions**。随后进入 **Actions** 查看 `Deploy to GitHub Pages`；任务完成后访问：

```text
https://<GitHub 用户名>.github.io/moyu-club/
```

如果将来修改仓库名，需要同时修改 `vite.config.ts` 中的 `base`。GitHub Pages 是纯静态 HTTPS 托管，不需要购买服务器，适合本项目的前端、PWA 和本地存档架构。

## PWA 与离线机制

`public/manifest.webmanifest` 定义独立窗口、竖屏方向、主题色和可缩放的 maskable SVG 图标。构建会生成 `pwa-assets.json`，首次联网打开生产版本时，`public/sw.js` 会在安装完成前原子预缓存首页、全部 Vite JS/CSS、Manifest 和图标。导航请求直接使用缓存的 `index.html`，确保桌面图标离线冷启动；只有新缓存完整写入后才会接管页面并清理旧缓存。所有字体、图片和逻辑都随项目分发，不请求 CDN、API 或第三方服务。

更新 `sw.js` 的 `CACHE` 版本即可让新版缓存替换旧版。部署后建议在线完整打开一次并进入 2048，再切换飞行模式验证。

## 本地数据

存档沿用稳定的 key `moyu:2048:v1`，并用 `moyu:2048:best:v1` 独立保护最高分；旧版无内部版本号的存档会自动迁移。每次有效移动同步保存棋盘、当前/最高分、胜利和结束状态。应用会在浏览器支持时请求持久化存储；浏览器禁用存储或空间不足时仍可游玩，但无法跨会话恢复。

### 隐藏诊断页

连续点击首页右上角 `M / G` 标记 7 次可进入运行诊断，也可直接访问 `#debug`。诊断页显示 browser/standalone 模式、Service Worker 注册与控制状态、scope、缓存版本、2048 存档摘要和 Storage Persistence 状态，不会出现在正常游戏入口中。

## 目录结构

```text
public/                    Manifest、Service Worker、PWA 图标
src/components/            可复用的通用组件（GameCard）
src/games/2048/            2048 UI、纯游戏逻辑与测试
src/App.tsx                游戏目录与轻量路由
src/storage.ts             版本化本地存储与统计
src/styles.css             全局响应式与安全区域样式
```

## 增加小游戏

1. 在 `src/games/<id>/` 新建独立逻辑、界面与测试。
2. 在 `src/App.tsx` 的 `games` 数组加入元数据，卡片会自动生成。
3. 为游戏增加对应路由分支；通用 UI 放入 `src/components/`。
4. 使用 `src/storage.ts` 的工具和独立、带版本的 key 保存进度。
5. 保持资源本地化，补充触摸/键盘测试，构建后验证飞行模式。

## 添加到手机主屏幕

### Android Chrome

用 Chrome 打开 HTTPS 站点，等待首次加载完成，点右上角菜单 → **安装应用**（或“添加到主屏幕”）→ 确认。之后从桌面图标启动；独立窗口模式下可离线游玩。

### iPhone Safari

必须用 Safari 打开 HTTPS 站点，点底部 **分享** → **添加到主屏幕** → **添加**。从桌面图标启动以使用 PWA 独立窗口。iOS 可能在长期不用或存储紧张时清理站点缓存，此时重新联网打开一次即可恢复离线资源。

## 体验设计

布局优先手机竖屏，采用高对比明黄、黑、白视觉；棋盘用 `touch-action: none` 阻止滑动时页面滚动，并支持方向键。页面使用 `env(safe-area-inset-*)` 避让 iPhone 刘海、灵动岛和 Home Indicator，小屏/矮屏有专门压缩规则。
