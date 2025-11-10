# Free FS - 现代化文件管理网盘系统

<div align="center">

一个基于 Spring Boot 3.x 的现代化文件管理网盘系统后端，支持多存储平台、分片上传、断点续传和完整的文件操作。

[![GitHub stars](https://img.shields.io/github/stars/xddcode/free-fs?logo=github)](https://github.com/xddcode/free-fs/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/xddcode/free-fs?logo=github)](https://github.com/xddcode/free-fs/network)
[![star](https://gitee.com/xddcode/free-fs/badge/star.svg?theme=dark)](https://gitee.com/xddcode/free-fs/stargazers)
[![fork](https://gitee.com/xddcode/free-fs/badge/fork.svg?theme=dark)](https://gitee.com/xddcode/free-fs/members)
[![AUR](https://img.shields.io/badge/license-Apache%20License%202.0-blue.svg)](https://gitee.com/xddcode/free-fs/blob/master/LICENSE)

[问题反馈](https://gitee.com/xddcode/free-fs/issues) · [功能请求](https://gitee.com/xddcode/free-fs/issues/new)

</div>

---

## 🔗 相关项目

- 🎨 [Free FS Frontend](https://gitee.com/xddcode/free-fs-vue) - Vue 3 前端项目

---

## ✨ 特性

### 🚀 核心亮点

- ⚡ **分片上传 + 断点续传** - 支持大文件上传，网络中断后可继续上传
- 📊 **实时上传进度** - WebSocket 实时推送上传进度，用户体验更佳
- ⚡ **秒传功能** - 基于 MD5 校验，相同文件秒级完成上传
- 🔌 **插件化存储** - SPI 机制，轻松扩展支持更多存储平台
- 🏗️ **模块化架构** - 清晰的分层设计，易于维护和扩展
- 🔐 **安全可靠** - JWT 认证、权限控制、文件完整性校验

### 🗂️ 功能特性

- **文件管理**
  - 📤 文件上传（分片上传、断点续传、秒传）
  - 📥 文件下载
  - 📁 文件夹创建与管理
  - 🔄 文件/文件夹重命名、移动
  - 🔗 文件分享
  - 🗑️ 文件删除

- **回收站**
  - ♻️ 文件还原（支持批量操作）
  - 🗑️ 彻底删除（支持批量操作）
  - 🧹 一键清空回收站
  - ⏰ 自动清理机制

- **存储平台**
  - 📦 支持多存储平台（本地、MinIO、阿里云 OSS、七牛云 Kodo、S3 体系等）
  - 🔄 动态切换存储平台
  - 🔐 平台配置管理
  - 📊 存储空间统计

### 🎯 技术亮点

- ⚡ **高性能** - Undertow 服务器，异步处理，支持高并发
- 🔐 **安全认证** - Sa-Token JWT 无状态认证，支持分布式部署
- 🏗️ **模块化设计** - 清晰的分层架构，职责明确
- 🔌 **插件化存储** - SPI 机制，无需修改核心代码即可扩展
- 📡 **实时通信** - WebSocket 实时推送上传进度和通知
- 🗄️ **数据持久化** - MyBatis Flex 轻量级 ORM，性能优异
- 📝 **API 文档** - SpringDoc OpenAPI 3，自动生成接口文档
- 🚀 **现代化技术栈** - Spring Boot 3.5.4 + Java 17，拥抱最新技术

---

## 🚀 快速开始

### 环境要求

- JDK >= 17
- Maven >= 3.8
- MySQL >= 8.0
- Redis

### 安装

```bash
# 克隆项目
git clone https://gitee.com/xddcode/free-fs.git

# 进入项目目录
cd free-fs

# 编译项目
mvn clean install -DskipTests
```

### 配置

1. **初始化数据库**

   ```bash
   mysql -u root -p < _sql/free-fs.sql
   ```

2. **修改配置文件**

   修改 `fs-admin/src/main/resources/application-dev.yml` 中的数据库和 Redis 配置

### 运行

```bash
# 启动应用
cd fs-admin
mvn spring-boot:run

# 或使用 IDE 运行 FreeFsApplication
```

访问：
- 应用地址：http://localhost:8081
- API 文档：http://localhost:8081/swagger-ui.html

### 默认账号

| 账号    | 密码    |
|-------|-------|
| admin | admin |

---

## 📦 技术栈

### 核心框架

- [Spring Boot](https://spring.io/projects/spring-boot) 3.5.4 - 企业级应用框架
- [MyBatis Flex](https://mybatis-flex.com/) 1.11.1 - 轻量级 ORM 框架
- [Sa-Token](https://sa-token.cc/) 1.44.0 - 轻量级权限认证框架

### 数据存储

- [MySQL](https://www.mysql.com/) 8.0+ - 关系型数据库
- [Redis](https://redis.io/) - 缓存和会话存储
- [Caffeine](https://github.com/ben-manes/caffeine) - 本地缓存

### 存储平台支持

- **本地存储** - 本地文件系统
- [MinIO](https://min.io/) - 对象存储服务
- [阿里云 OSS](https://www.aliyun.com/product/oss) - 对象存储服务
- [七牛云 Kodo](https://www.qiniu.com/products/kodo) - 对象存储服务
- 各类S3体系云存储

### 工具库

- [Hutool](https://hutool.cn/) - Java 工具类库
- [MapStruct Plus](https://github.com/linpeilie/mapstruct-plus) - 对象映射工具
- [Apache Tika](https://tika.apache.org/) - 文件类型检测
- [Thumbnailator](https://github.com/coobird/thumbnailator) - 图片处理
- [ip2region](https://github.com/lionsoul2014/ip2region) - IP 地址解析

### 开发工具

- [SpringDoc OpenAPI](https://springdoc.org/) - API 文档生成
- [Lombok](https://projectlombok.org/) - 简化 Java 代码
- [Undertow](https://undertow.io/) - 高性能 Web 服务器

---

## 🎨 界面预览
<img alt="login.png"  width="600" src="https://gitee.com/xddcode/free-fs/raw/feature-vue/.images/login.png"/>

<img alt="dashboard.png" width="600" src="https://gitee.com/xddcode/free-fs/raw/feature-vue/.images/dashboard.png"/>

<img alt="grid_file.png" width="600" src="https://gitee.com/xddcode/free-fs/raw/feature-vue/.images/grid_file.png"/>

<img alt="file.png" width="600" src="https://gitee.com/xddcode/free-fs/raw/feature-vue/.images/file.png"/>

<img alt="move.png" width="600" src="https://gitee.com/xddcode/free-fs/raw/feature-vue/.images/move.png"/>

<img alt="recycle.png" width="600" src="https://gitee.com/xddcode/free-fs/raw/feature-vue/.images/recycle.png"/>

<img alt="transmission.png" width="600" src="https://gitee.com/xddcode/free-fs/raw/feature-vue/.images/transmission.png"/>

<img alt="storage.png" width="600" src="https://gitee.com/xddcode/free-fs/raw/feature-vue/.images/storage.png"/>

<img alt="profile.png" width="600" src="https://gitee.com/xddcode/free-fs/raw/feature-vue/.images/profile.png"/>

---

## 📁 项目结构

```
free-fs/
├── fs-admin/                    # Web 管理模块
├── fs-dependencies/             # 依赖版本管理（BOM）
├── fs-framework/                # 框架层
│   ├── fs-common-core/         # 公共核心模块
│   ├── fs-orm/                 # ORM 配置模块
│   ├── fs-redis/               # Redis 配置模块
│   ├── fs-security/            # 安全认证模块
│   ├── fs-swagger/             # API 文档配置
│   ├── fs-websocket/           # WebSocket 支持
│   ├── fs-notify/              # 通知模块
│   └── fs-storage-plugin/      # 存储插件框架
│       ├── storage-plugin-core/        # 插件核心接口
│       ├── storage-plugin-local/       # 本地存储插件
│       ├── storage-plugin-aliyunoss/   # 阿里云 OSS 插件
│       └── storage-plugin-minio/       # MinIO 插件
└── fs-modules/                  # 业务模块
    ├── fs-file/                 # 文件管理模块
    ├── fs-storage/              # 存储平台管理模块
    ├── fs-system/              # 系统管理模块
    ├── fs-log/                 # 日志模块
    └── fs-plan/                # 计划任务模块
```

---

## 📝 API 文档

启动应用后，访问 Swagger UI：

```
http://localhost:8081/swagger-ui.html
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

- 遵循阿里巴巴 Java 开发手册
- 使用 Lombok 简化代码
- 编写清晰的注释
- 提交信息遵循 [Conventional Commits](https://www.conventionalcommits.org/)

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

---

## 📄 开源协议

本项目采用 [Apache License 2.0](LICENSE) 协议开源。

---

## 🙏 鸣谢

- [Spring Boot](https://spring.io/projects/spring-boot) - 感谢 Spring 团队
- [MyBatis Flex](https://mybatis-flex.com/) - 感谢 MyBatis Flex 团队
- [Sa-Token](https://sa-token.cc/) - 感谢 Sa-Token 团队
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

**[⬆ 回到顶部](#free-fs---现代化文件管理系统)**

Made with ❤️ by [@Freedom](https://gitee.com/xddcode)

</div>
