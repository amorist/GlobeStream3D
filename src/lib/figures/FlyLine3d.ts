import {
  ArcCurve,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  Points,
  PointsMaterial,
  Sprite,
  SpriteMaterial,
  TextureLoader,
  Vector3,
} from "three";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry";
import { Line2 } from "three/examples/jsm/lines/Line2";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial";
import { _3Dto2D, radianAOB, threePointCenter } from "@/lib/utils/math";
import { setTween } from "@/lib/utils/tween";
import { FlyLineData, LineStyle, StoreConfig } from "@/lib/interface";
import Store from "@/lib/store/store";
import { addUserDataToMesh } from "@/lib/utils";
import { merge } from "lodash-es";
import { cloneDeep } from "lodash-es";

export default class FlyLine3d {
  private readonly _config: StoreConfig;
  _store: Store;
  _currentData: FlyLineData;
  _currentConfig: LineStyle;
  constructor(store: Store, currentData: FlyLineData) {
    this._store = store;
    this._config = store.getConfig();
    this._currentConfig = cloneDeep({
      flyLineStyle: this._config.flyLineStyle,
      pathStyle: this._config.pathStyle,
    });
    this._currentData = currentData;
    if (currentData.style) {
      merge(this._currentConfig, currentData.style);
    }
  }
  createMesh(positionInfo: [Vector3, Vector3]) {
    const group = new Group();
    const [sourcePoint, targetPoint] = positionInfo;

    //算出两点之间的中点向量
    const middleV3 = new Vector3()
      .addVectors(sourcePoint, targetPoint)
      .clone()
      .multiplyScalar(0.5);
    //然后计算方向向量
    const dir = middleV3.clone().normalize();
    const s = radianAOB(sourcePoint, targetPoint, new Vector3(0, 0, 0));
    const middlePos = dir.multiplyScalar(
      this._config.R + s * this._config.R * 0.2
    );
    //寻找三个圆心的坐标
    const centerPosition = threePointCenter(
      sourcePoint,
      targetPoint,
      middlePos
    );
    //求得半径
    const R = middlePos.clone().sub(centerPosition).length();
    const c = radianAOB(sourcePoint, new Vector3(0, -1, 0), centerPosition);
    const startDeg = -Math.PI / 2 + c; //飞线圆弧开始角度
    const endDeg = Math.PI - startDeg; //飞线圆弧结束角度
    const pathLine = this.createPathLine(centerPosition, R, startDeg, endDeg);
    const flyAngle = (endDeg - startDeg) / 7; //飞线圆弧的弧度和轨迹线弧度相关 也可以解释为飞线的长度
    if (!this._currentConfig.flyLineStyle.img) {
      const tadpolePointsMesh = this.createShader(
        R,
        startDeg,
        startDeg + flyAngle
      );
      //和创建好的路径圆 圆心坐标保持一致
      tadpolePointsMesh.position.y = centerPosition.y;
      tadpolePointsMesh.name = "tadpolePointsMesh";
      setTween(
        { z: 0 },
        { z: endDeg - startDeg },
        (params) => {
          tadpolePointsMesh.rotation.z = params.z;
        },
        {
          ...this._currentConfig.flyLineStyle,
          data: this._currentData,
        }
      );
      group.add(tadpolePointsMesh);
    } else {
      //有图片则用 img 替换shader
      const imgMesh = this.createImg(R, startDeg, startDeg + flyAngle);
      imgMesh.position.y = centerPosition.y;
      setTween(
        { z: 0 },
        { z: endDeg - startDeg },
        (params) => {
          imgMesh.rotation.z = params.z;
        },
        {
          ...this._currentConfig.flyLineStyle,
          data: this._currentData,
        }
      );
      group.add(imgMesh);
    }

    if (this._currentConfig.pathStyle.show !== false) {
      group.add(pathLine);
    }
    group.name = "flyLine";
    return group;
  }
  createImg(R: number, startAngle: number, endAngle: number) {
    // 创建曲线（与 createPathLine 中的曲线一致）
    const group = new Group();
    // 创建纹理加载器
    const textureLoader = new TextureLoader();
    const texture = textureLoader.load(this._currentConfig.flyLineStyle.img!);
    // 创建精灵材质，使用加载的纹理
    const spriteMaterial = new SpriteMaterial({
      map: texture,
      color: new Color(this._currentConfig.flyLineStyle.color),
      transparent: true,
      depthTest: true,
    });

    // 创建精灵
    const sprite = new Sprite(spriteMaterial);
    const x = R * Math.cos(startAngle);
    const y = R * Math.sin(startAngle);
    sprite.position.set(x, y, 0);
    // 设置精灵的缩放（大小）
    const size = this._currentConfig.flyLineStyle.size || 3;
    sprite.scale.set(size, size, 1);
    group.add(sprite);
    sprite.name = "flyLineSprite";
    return group;
  }

  createPathLine = (
    middlePos: Vector3,
    r: number,
    startDeg: number,
    endDeg: number
  ) => {
    const curve = new ArcCurve(
      middlePos.x,
      middlePos.y, // ax, aY
      r, // xRadius, yRadius
      startDeg,
      endDeg, // aStartAngle, aEndAngle
      false // aClockwise
    );
    const points = curve.getSpacedPoints(200);
    const geometry = new LineGeometry();
    geometry.setPositions(points.map((item) => [item.x, item.y, 0]).flat());
    const material = new LineMaterial({
      color: new Color(this._currentConfig.pathStyle.color).getHex(),
      linewidth: (this._currentConfig.pathStyle.size || 1) / 1000,
      vertexColors: false,
      dashed: false,
      alphaToCoverage: false,
    });
    const pathLine = new Line2(geometry, material);
    pathLine.name = "pathLine";
    addUserDataToMesh(pathLine, this._currentData);
    return pathLine;
  };
  createShader = (r: number, startAngle: number, endAngle: number) => {
    const points = new ArcCurve(
      0,
      0, // ax, aY
      r, // xRadius, yRadius
      startAngle,
      endAngle, // aStartAngle, aEndAngle
      false // aClockwise
    ).getSpacedPoints(200);
    // Create the final object to add to the scene
    const geometry = new BufferGeometry();
    const newPoints = points; //获取更多的点数
    const percentArr = []; //attributes.percent的数据
    for (let i = 0; i < newPoints.length; i++) {
      percentArr.push(i / newPoints.length);
    }
    const colorArr = [];
    const color1 = new Color(this._currentConfig.pathStyle.color); //尾拖线颜色
    const color2 = new Color(this._currentConfig.flyLineStyle.color); //飞线蝌蚪头颜色
    for (let i = 0; i < newPoints.length; i++) {
      const color = color1.lerp(color2, i / newPoints.length);
      colorArr.push(color.r, color.g, color.b);
    }
    geometry.setFromPoints(newPoints);
    geometry.attributes.percent = new BufferAttribute(
      new Float32Array(percentArr),
      1
    );
    geometry.attributes.color = new BufferAttribute(
      new Float32Array(colorArr),
      3
    );
    const material = new PointsMaterial({
      vertexColors: true, //使用顶点颜色渲染
      size: this._currentConfig.flyLineStyle.size || 3.0, //点大小
    });
    const tadpolePointsMesh = new Points(geometry, material);
    material.onBeforeCompile = function (shader) {
      // 顶点着色器中声明一个attribute变量:百分比
      shader.vertexShader = shader.vertexShader.replace(
        "void main() {",
        [
          "attribute float percent;", //顶点大小百分比变量，控制点渲染大小
          "void main() {",
        ].join("\n") // .join()把数组元素合成字符串
      );
      // 调整点渲染大小计算方式
      shader.vertexShader = shader.vertexShader.replace(
        "gl_PointSize = size;",
        ["gl_PointSize = percent * size;"].join("\n") // .join()把数组元素合成字符串
      );
    };
    tadpolePointsMesh.name = "tadpolePointsMesh";
    return tadpolePointsMesh;
  };
  create(src: Vector3, dist: Vector3) {
    //创建线
    const { quaternion, startPoint3D, endPoint3D } = _3Dto2D(src, dist);
    const flyLineMesh = this.createMesh([startPoint3D, endPoint3D]);
    flyLineMesh.quaternion.multiply(quaternion);
    return flyLineMesh;
  }
}
