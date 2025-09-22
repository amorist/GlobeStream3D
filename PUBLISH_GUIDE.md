# NPM 发布指南

## 发布前准备

### 1. 构建项目
```bash
npm run lib
```

### 2. 登录npm
```bash
npm login
# 输入用户名、密码、邮箱
```

### 3. 发布包
```bash
npm publish
```

## 当前版本信息

- **包名**: globestream3d
- **版本**: 1.7.0
- **主要更新**: 新增透明背景支持
- **构建状态**: ✅ 已构建完成

## 发布步骤

### ✅ 步骤1: 构建项目（已完成）
```bash
npm run lib
```
**状态**: ✅ 构建成功
- 生成了 dist/index.es.js (1.1MB)
- 生成了 dist/index.umd.js (632KB)
- 生成了 TypeScript 声明文件

### 步骤2: 登录npm
```bash
npm login
```
**注意**: 这需要你在浏览器中完成登录验证

### 步骤3: 发布到npm
```bash
npm publish
```

### 步骤4: 验证发布
```bash
npm info globestream3d
```

## 注意事项

- ✅ 版本号已更新到1.7.0
- ✅ 构建文件已生成
- ✅ 透明背景功能已测试
- ✅ 文档已更新
- ✅ 关键词已优化

## 如果遇到问题

### 1. 登录问题
```bash
npm config set registry https://registry.npmjs.org/
npm login
```

### 2. 版本冲突
如果版本已存在，请更新版本号：
```bash
npm version patch  # 1.7.1
npm version minor  # 1.8.0
npm version major  # 2.0.0
```

### 3. 权限问题
确保你有权限发布这个包，或者包名没有被占用。

## 发布后验证

```bash
# 查看包信息
npm info globestream3d

# 安装测试
npm install globestream3d@1.7.0
```

## 当前状态
- 构建: ✅ 完成
- 版本: ✅ 1.7.0
- 文档: ✅ 更新
- 功能: ✅ 透明背景支持
- 待发布: ⏳ 等待npm登录