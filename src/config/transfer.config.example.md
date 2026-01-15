# 传输配置说明

## 配置文件位置

`src/config/transfer.config.ts`

## 配置项详解

### 1. 上传性能配置 (`uploadConfig`)

#### `chunkSize` - 分片大小

- **默认值**: 5MB (5 _ 1024 _ 1024 字节)
- **建议范围**: 1MB - 10MB
- **使用场景**:
  - **1-2MB**: 网络不稳定、移动网络环境
  - **5MB**: 一般场景（推荐）
  - **8-10MB**: 高速稳定网络、大文件上传

#### `concurrency` - 并发上传数

- **默认值**: 3
- **建议范围**: 1 - 6
- **使用场景**:
  - **1-2**: 网络带宽有限、多任务同时上传
  - **3-4**: 一般场景（推荐）
  - **5-6**: 高速网络、单任务上传

#### `maxRetryCount` - 最大重试次数

- **默认值**: 3
- **建议范围**: 1 - 5
- **说明**: 采用指数退避策略，重试间隔为 1s, 2s, 4s...

#### `retryBaseDelay` - 重试基础延迟

- **默认值**: 1000ms
- **建议范围**: 500 - 3000ms
- **说明**: 第 n 次重试延迟 = retryBaseDelay × 2^(n-1)

---

### 2. 进度显示配置 (`progressConfig`)

#### `throttleInterval` - 进度更新节流

- **默认值**: 100ms
- **建议范围**: 50 - 500ms
- **影响**: 值越小，进度条更新越频繁，但 CPU 占用越高

#### `speedWindowSize` - 速度计算窗口

- **默认值**: 5000ms (5 秒)
- **建议范围**: 3000 - 10000ms
- **影响**: 值越大，速度显示越平滑，但响应越慢

---

### 3. SSE 连接配置 (`sseConfig`)

#### `endpoint` - SSE 端点路径

- **默认值**: '/apis/transfer/sse'
- **说明**: 根据后端 API 路径调整

#### `syncOnReconnect` - 重连后同步

- **默认值**: true
- **说明**: 断线重连后是否自动从服务器同步任务状态

---

### 4. UI 通知配置 (`notificationConfig`)

#### `successDuration` - 成功通知时长

- **默认值**: 3000ms (3 秒)

#### `errorDuration` - 错误通知时长

- **默认值**: 5000ms (5 秒)

---

## 使用方法

### 方式一：直接修改配置文件

编辑 `src/config/transfer.config.ts`，修改对应的配置值。

### 方式二：在代码中动态设置

```typescript
import { uploadExecutor } from '@/services/upload-executor';
import { progressCalculator } from '@/utils/progress-calculator';

// 设置并发数
uploadExecutor.setConcurrency(5);

// 创建自定义进度计算器
const customProgressCalculator = new ProgressCalculator(200, 8000);
```

---

## 常见场景配置建议

### 场景 1: 移动网络 / 网络不稳定

```typescript
export const uploadConfig = {
  chunkSize: 2 * 1024 * 1024, // 2MB 小分片
  concurrency: 2, // 低并发
  maxRetryCount: 5, // 多次重试
  retryBaseDelay: 2000, // 较长重试间隔
};
```

### 场景 2: 高速局域网 / 大文件上传

```typescript
export const uploadConfig = {
  chunkSize: 10 * 1024 * 1024, // 10MB 大分片
  concurrency: 6, // 高并发
  maxRetryCount: 2, // 少量重试
  retryBaseDelay: 500, // 短重试间隔
};
```

### 场景 3: 低性能设备

```typescript
export const progressConfig = {
  throttleInterval: 300, // 降低更新频率
  speedWindowSize: 8000, // 更大的平滑窗口
};
```

---

## 注意事项

1. **分片大小与并发数的平衡**

   - 分片越大 + 并发越高 = 内存占用越大
   - 建议: `chunkSize × concurrency ≤ 50MB`

2. **重试策略**

   - 指数退避可能导致较长等待时间
   - 例如: 3 次重试 = 1s + 2s + 4s = 7s

3. **进度更新频率**

   - 过高的更新频率可能导致 UI 卡顿
   - 建议在低性能设备上增加 `throttleInterval`

4. **配置修改后需要重启应用**
   - 配置在应用启动时加载
   - 修改后需要刷新页面或重启开发服务器
