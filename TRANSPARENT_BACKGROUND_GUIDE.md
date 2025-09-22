# 透明背景配置指南

本指南详细介绍如何在GlobeStream3D中配置透明背景功能。

## 概述

GlobeStream3D基于Three.js WebGL渲染器，支持通过`bgStyle`配置参数设置透明背景，使地球组件可以无缝集成到各种页面背景中。

## 技术实现原理

### WebGL透明背景机制
- **alpha通道**: WebGLRenderer启用alpha: true
- **预乘alpha**: 禁用premultipliedAlpha: false
- **清除缓冲区**: 保留preserveDrawingBuffer: true
- **透明清除**: renderer.setClearColor(0x000000, 0)

### Canvas样式配置
- **背景透明**: canvas.style.backgroundColor = 'transparent'
- **清除默认背景**: canvas.style.backgroundImage = 'none'
- **透明度设置**: canvas.style.opacity = '1'

## 基本透明背景配置

### 完全透明背景

```javascript
const chart = earth.init({
  dom: document.getElementById('container'),
  config: {
    bgStyle: {
      color: "transparent",  // 设置为透明
      opacity: 0            // 完全透明
    }
  }
});
```

### 半透明背景

```javascript
const chart = earth.init({
  dom: document.getElementById('container'),
  config: {
    bgStyle: {
      color: "rgba(0, 0, 0, 0.3)",  // 半透明黑色
      opacity: 0.3                  // 30%透明度
    }
  }
});
```

## 配置参数说明

| 参数 | 类型 | 说明 | 示例 |
|------|------|------|------|
| color | string | 背景颜色，支持多种格式 | "transparent", "#000000", "rgba(0,0,0,0.5)" |
| opacity | number | 背景透明度 | 0-1之间的数值 |

## 支持的颜色格式

- **transparent**: 完全透明
- **十六进制**: "#000000", "#ffffff"
- **RGB**: "rgb(0, 0, 0)"
- **RGBA**: "rgba(0, 0, 0, 0.5)"
- **颜色名称**: "red", "blue", "green"

## 使用示例

### 示例1: 完全透明背景

```javascript
// 初始化地球组件，背景完全透明
const chart = earth.init({
  dom: document.getElementById('earth-container'),
  map: 'world',
  mode: '3d',
  config: {
    bgStyle: {
      color: "transparent",
      opacity: 0
    },
    earth: {
      color: "#13162c"
    },
    flyLineStyle: {
      color: "#cd79ff"
    }
  }
});
```

### 示例2: 动态切换透明背景

```javascript
// 切换透明背景函数
function toggleTransparentBackground() {
  const currentConfig = chart.options.config;
  
  if (currentConfig.bgStyle?.color === "transparent") {
    // 恢复默认背景
    chart.options.config.bgStyle = {
      color: "#0e0c15",
      opacity: 1
    };
  } else {
    // 设置为透明背景
    chart.options.config.bgStyle = {
      color: "transparent",
      opacity: 0
    };
  }
  
  // 重新初始化以应用新的背景配置
  chart.destroy();
  chart = earth.init({
    dom: document.getElementById('earth-container'),
    config: chart.options.config
  });
}
```

## 技术配置要点

### 1. WebGLRenderer配置
```typescript
const renderer = new WebGLRenderer({
  antialias: true,
  alpha: true,                    // 启用alpha通道
  premultipliedAlpha: false,      // 禁用预乘alpha
  preserveDrawingBuffer: true,    // 保留绘图缓冲区
});
```

### 2. 透明背景处理逻辑
```typescript
if (bgColor === 'transparent' || bgOpacity === 0) {
  renderer.setClearColor(0x000000, 0);  // 透明清除色
  renderer.setClearAlpha(0);            // 透明alpha
  
  // 确保canvas元素样式透明
  const canvas = renderer.domElement;
  canvas.style.backgroundColor = 'transparent';
  canvas.style.backgroundImage = 'none';
}
```

### 3. Canvas样式配置
```typescript
// 配置canvas元素样式以支持透明背景
const canvas = renderer.domElement;
canvas.style.display = 'block';  // 确保canvas是块级元素
canvas.style.width = '100%';
canvas.style.height = '100%';
```

## 注意事项

1. **容器背景**: 确保地球组件的容器有合适的背景色或背景图片
2. **页面背景**: 透明背景效果依赖于页面的背景设置
3. **性能考虑**: 透明背景可能会略微影响渲染性能
4. **浏览器兼容性**: 现代浏览器均支持透明背景功能
5. **父元素样式**: 确保父容器允许透明背景显示

## 完整HTML示例

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      margin: 0;
      padding: 0;
    }
    
    #earth-container {
      width: 100vw;
      height: 100vh;
      background: transparent;
    }
  </style>
</head>
<body>
  <div id="earth-container"></div>
  
  <script>
    // 初始化透明背景地球
    const chart = earth.init({
      dom: document.getElementById('earth-container'),
      config: {
        bgStyle: {
          color: "transparent",
          opacity: 0
        }
      }
    });
  </script>
</body>
</html>
```

## 项目技术栈

- **Three.js**: ^0.152.2 - 3D图形渲染引擎
- **WebGL**: 基于WebGL的硬件加速渲染
- **TypeScript**: 类型安全的JavaScript开发
- **Vite**: 现代化的构建工具
- **Vue 3**: 前端框架（演示项目使用）

## API接口定义

```typescript
interface bgStyle {
  color: Color;      // 支持 "transparent" 或任何CSS颜色值
  opacity?: number;  // 透明度，0-1之间
}

type Color = "transparent" | string | HEX | RGB | RGBA;
```