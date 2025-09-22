# 更新日志

## v1.7.0 (2024-09-22)

### ✨ 新功能
- **透明背景支持**: 新增 `bgStyle` 配置参数，支持完全透明或半透明背景
  - 支持 `color: "transparent"` 实现完全透明背景
  - 支持 `opacity` 参数控制透明度 (0-1)
  - 支持动态切换背景配置

### 📝 文档
- 新增《透明背景配置指南》(TRANSPARENT_BACKGROUND_GUIDE.md)
- 完善API文档，详细说明背景配置参数

### 🔧 技术实现
- WebGL alpha通道优化，启用透明渲染
- Canvas样式自动配置，确保透明效果
- 容器和父元素背景透明处理

### 💡 使用示例
```javascript
const chart = earth.init({
  dom: document.getElementById('container'),
  config: {
    bgStyle: {
      color: "transparent",  // 完全透明
      opacity: 0
    }
  }
});
```

## v1.6.0 (之前版本)
- 3D地球可视化组件
- 迁徙飞线动画
- 涟漪效果
- 支持React/Vue/Angular等前端框架