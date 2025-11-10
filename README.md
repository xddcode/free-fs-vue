# Free FS - 现代化文件管理网盘系统

<div align="center">

一个基于 Vue 3 的现代化文件管理系统前端，支持多存储平台、完整的文件操作和优雅的用户界面。

[![GitHub stars](https://img.shields.io/github/stars/xddcode/free-fs?logo=github)](https://github.com/xddcode/free-fs/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/xddcode/free-fs?logo=github)](https://github.com/xddcode/free-fs/network)
[![star](https://gitee.com/xddcode/free-fs/badge/star.svg?theme=dark)](https://gitee.com/xddcode/free-fs/stargazers)
[![fork](https://gitee.com/xddcode/free-fs/badge/fork.svg?theme=dark)](https://gitee.com/xddcode/free-fs/members)
[![AUR](https://img.shields.io/badge/license-Apache%20License%202.0-blue.svg)](https://gitee.com/xddcode/free-fs/blob/master/LICENSE)

[问题反馈](https://gitee.com/xddcode/free-fs/issues) · [功能请求](https://gitee.com/xddcode/free-fs/issues/new)

</div>

---

## 源码链接：

Gitee：https://gitee.com/xddcode/free-fs-vue

GitHub：https://github.com/xddcode/free-fs-vue

## 🔗 相关项目

- 🔙 [Free FS Backend](https://gitee.com/xddcode/free-fs) - 后端服务

## ✨ 特性

### 🗂️ 核心功能

- **文件管理**

  - 📤 文件上传（支持拖拽、批量上传）
  - 📥 文件下载
  - 📁 文件夹创建与管理
  - 🔄 文件/文件夹重命名
  - ↔️ 文件移动
  - 🔗 文件分享
  - 🗑️ 文件删除

- **回收站**

  - ♻️ 文件还原（支持批量）
  - 🗑️ 彻底删除（支持批量）
  - 🧹 一键清空回收站
  - ⏰ 10 天自动清理提醒

- **多视图模式**

  - 📋 列表视图（支持排序）
  - 🎨 网格视图
  - 🔍 文件搜索
  - 🏷️ 文件类型筛选

- **存储平台**
  - 🔌 支持多存储平台切换
  - 🔐 平台配置管理
  - 📊 存储空间统计

### 🎯 用户体验

- ⚡ **流畅交互** - 双击进入文件夹，拖拽上传
- 🎨 **现代设计** - 基于 Arco Design 的优雅 UI
- 📱 **响应式布局** - 适配各种屏幕尺寸
- 🌓 **主题切换** - 支持亮色/暗色主题
- 🔔 **智能提示** - 友好的操作反馈和错误提示
- 🔄 **浏览器导航** - 完整支持前进/后退

### 🛡️ 技术亮点

- 📦 **TypeScript** - 完整的类型安全
- 🎣 **Composition API** - 使用 Vue 3 最佳实践
- 🔐 **统一错误处理** - 拦截器层统一管理
- 🔄 **状态管理** - Pinia 状态持久化
- 🎯 **代码质量** - ESLint + Prettier + Husky
- 📊 **构建优化** - Vite 快速构建和 HMR

---

## 🚀 快速开始

### 环境要求

- Node.js >= 14.0.0
- npm 或 pnpm 或 yarn

### 安装

```bash
# 克隆项目
git clone https://gitee.com/xddcode/free-fs-vue.git

# 进入项目目录
cd free-fs-vue

# 安装依赖
npm install
```

### 开发

```bash
# 启动开发服务器
npm run dev

# 访问 http://localhost:5173
```

### 构建

```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview

# 构建并生成分析报告
npm run report
```

### 代码检查

```bash
# TypeScript 类型检查
npm run type:check

# 运行 lint-staged
npm run lint-staged
```

---

## 📦 技术栈

### 核心框架

- [Vue 3](https://vuejs.org/) - 渐进式 JavaScript 框架
- [TypeScript](https://www.typescriptlang.org/) - JavaScript 的超集
- [Vite](https://vitejs.dev/) - 下一代前端构建工具

### UI 组件库

- [Arco Design Vue](https://arco.design/) - 字节跳动开源的企业级设计系统

### 状态管理与路由

- [Vue Router](https://router.vuejs.org/) - 官方路由管理器
- [Pinia](https://pinia.vuejs.org/) - Vue 官方状态管理库

### 网络请求

- [Axios](https://axios-http.com/) - 基于 Promise 的 HTTP 客户端

### 工具库

- [Day.js](https://day.js.org/) - 轻量级日期处理库
- [VueUse](https://vueuse.org/) - Vue Composition API 工具集
- [ECharts](https://echarts.apache.org/) - 数据可视化图表库

### 开发工具

- [ESLint](https://eslint.org/) - 代码检查工具
- [Prettier](https://prettier.io/) - 代码格式化工具
- [Husky](https://typicode.github.io/husky/) - Git hooks 工具
- [Commitlint](https://commitlint.js.org/) - Git 提交信息规范

---

## 📁 项目结构

```
free-fs-vue/
├── config/                  # Vite 配置文件
│   ├── plugin/             # Vite 插件配置
│   ├── vite.config.base.ts # 基础配置
│   ├── vite.config.dev.ts  # 开发环境配置
│   └── vite.config.prod.ts # 生产环境配置
├── src/
│   ├── api/                # API 接口
│   │   ├── file.ts        # 文件管理接口
│   │   ├── storage.ts     # 存储平台接口
│   │   ├── user.ts        # 用户接口
│   │   └── interceptor.ts # 请求拦截器
│   ├── assets/            # 静态资源
│   │   ├── images/        # 图片资源
│   │   └── style/         # 全局样式
│   ├── components/        # 全局组件
│   │   ├── navbar/        # 导航栏
│   │   ├── menu/          # 菜单
│   │   ├── footer/        # 页脚
│   │   └── ...
│   ├── hooks/             # 组合式函数
│   ├── layout/            # 布局组件
│   ├── router/            # 路由配置
│   │   ├── routes/        # 路由定义
│   │   └── guard/         # 路由守卫
│   ├── store/             # 状态管理
│   │   └── modules/       # Pinia 模块
│   ├── types/             # TypeScript 类型定义
│   ├── utils/             # 工具函数
│   ├── views/             # 页面组件
│   │   ├── files/         # 文件管理页面
│   │   │   ├── components/  # 页面组件
│   │   │   └── hooks/       # 页面 hooks
│   │   ├── login/         # 登录页面
│   │   └── ...
│   ├── App.vue           # 根组件
│   └── main.ts           # 入口文件
├── index.html            # HTML 模板
├── package.json          # 项目依赖
├── tsconfig.json         # TypeScript 配置
└── README.md            # 项目说明
```

---

## 🎨 界面预览

> 📸 截图待补充

---

## 📝 配置说明

### 环境变量

创建 `.env.development` 和 `.env.production` 文件：

```env
# API 基础路径
VITE_API_BASE_URL=http://localhost:8080

# 其他配置...
```

---

## 🤝 贡献指南

我们欢迎所有的贡献，无论是新功能、Bug 修复还是文档改进！

### 贡献步骤

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的改动 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

### 代码规范

- 使用 TypeScript 编写代码
- 遵循 ESLint 和 Prettier 配置
- 提交信息遵循 [Conventional Commits](https://www.conventionalcommits.org/)
- 编写单元测试（如适用）

### Commit 规范

```
feat: 新功能
fix: 修复 Bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
perf: 性能优化
test: 测试相关
chore: 构建/工具链更新
```

---

## 🐛 问题反馈

如果你发现了 Bug 或有功能建议，请通过以下方式反馈：

- [Gitee Issues](https://gitee.com/xddcode/free-fs/issues)
<!-- - [GitHub Discussions](https://github.com/your-username/free-fs-vue/discussions) -->

---

## 📄 开源协议

本项目采用 [MIT](LICENSE) 协议开源。

---

## 🙏 鸣谢

- [Vue.js](https://vuejs.org/) - 感谢 Vue 团队
- [Arco Design](https://arco.design/) - 感谢字节跳动设计团队
- 所有贡献者和使用者

---

## 📮 联系方式

- GitHub: [@Freedom](https://github.com/xddcode)
- Gitee: [@Freedom](https://gitee.com/xddcode)
- Email: xddcodec@gmail.com
- 微信：

  **添加微信，请注明来意**

<img alt="wx.png" height="300" src="https://gitee.com/xddcode/free-fs/raw/feature-vue/.images/wx.png" width="250"/>

- 微信公众号：

<img alt="wp.png" src="https://gitee.com/xddcode/free-fs/raw/feature-vue/.images/mp.png"/>

---

## ❤ 捐赠

如果你认为 free-fs 项目可以为你提供帮助，或者给你带来方便和灵感，或者你认同这个项目，可以为我的付出赞助一下哦！

请给一个 ⭐️ 支持一下！

<img alt="pay.png" height="300" src="https://gitee.com/xddcode/free-fs/raw/feature-vue/.images/pay.png" width="250"/>

<div align="center">

**[⬆ 回到顶部](#free-fs---现代化文件管理网盘系统)**

Made with ❤️ by [@Freedom](https://gitee.com/xddcode)

</div>
