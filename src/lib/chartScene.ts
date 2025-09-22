import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { Options, SetData } from "@/lib/interface";
import OperateView from "@/lib/operateView";
import {
  AmbientLight,
  AxesHelper,
  Camera,
  Clock,
  DirectionalLight,
  Group,
  Light,
  Mesh,
  Object3D,
  OrthographicCamera,
  PerspectiveCamera,
  PointLight,
  Renderer,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three";
import CreateEarth from "@/lib/figures/Earth";
import MapShape from "@/lib/figures/MapShape";
import sprite from "@/lib/figures/Sprite";
import { update as tweenUpdate } from "@tweenjs/tween.js";
import Store from "@/lib/store/store";
import EventStore from "@/lib/store/eventStore";
import { merge } from "lodash-es";
import CustomOrbitControls from "@/lib/utils/controls";
import CountryNamesText from "@/lib/figures/Text";

/**
 * ChartScene class is used to create a 3D scene using Three.js.
 * It provides methods to initialize the scene, create camera, light, helper, figures, and renderer.
 * It also provides methods to control the animation and transformation of the scene.
 */
export default class ChartScene {
  options: Options;
  initOptions: Pick<
    Options,
    "helper" | "autoRotate" | "rotateSpeed" | "mode" | "controls"
  > = {
    helper: false,
    autoRotate: true,
    rotateSpeed: 0.01,
    mode: "3d",
    controls: "custom",
  };
  style = {
    width: 0,
    height: 0,
  };
  light: Light;
  earthHovered: boolean = false;
  camera: Camera;
  notLockFps: Function;
  mainContainer: Object3D;
  scene: Scene;
  renderer: Renderer;
  controls: CustomOrbitControls | OrbitControls;
  _store: Store;
  _eventStore: EventStore;
  _OperateView: OperateView;

  /**
   * Constructor for the ChartScene class.
   * @param {Partial<Options>} params - The initial options for the scene.
   */
  constructor(params: Partial<Options>) {
    this._store = new Store();
    this._OperateView = new OperateView(this._store);
    this.options = {
      ...this.options,
      config: this._store.getConfig(),
    };
    this.options = merge({}, this.options, this.initOptions, params);

    this.notLockFps = this.lockFps(this.options.limitFps);
    this.init();
    this._eventStore = new EventStore(this);
  }

  /**
   * Method to register an event.
   * @param {string} eventName - The name of the event.
   * @param {(event: Event, mesh: Object3D | Group | Mesh | undefined) => void} cb - The callback function to be executed when the event is triggered.
   */
  on(
    eventName: string,
    cb: (event: Event, mesh: Object3D | Group | Mesh | undefined) => void
  ) {
    this._eventStore.registerEventMap(eventName, cb);
  }

  /**
   * Method to clear Three.js objects.
   * @param {any} obj - The Three.js object to be cleared.
   */
  clearThree(obj: any) {
    while (obj.children.length > 0) {
      this.clearThree(obj.children[0]);
      obj.remove(obj.children[0]);
    }
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) obj.material.dispose();
    if (obj.texture) obj.texture.dispose();
  }

  /**
   * Method to destroy the scene.
   */
  destroy() {
    this.clearThree(this.scene);
    this.options.dom.innerHTML = "";
  }

  /**
   * Method to initialize the scene.
   */
  init() {
    const {
      dom,
      cameraType = "OrthographicCamera",
      light = "DirectionalLight",
      helper = false,
      map = "world",
      config,
    } = this.options;

    this._store.setConfig(this.options);
    this.mainContainer = this.createCube();
    this.style = dom.getBoundingClientRect();
    this.scene = this.createScene();
    if (cameraType === "OrthographicCamera") {
      this.camera = this.createOrthographicCamera();
    } else {
      this.camera = this.createCamera();
    }
    this.light = this.createLight(light);
    if (helper) {
      this.createHelper();
    }
    this.renderer = this.createRender();
    this.createCountryNamesText();
    const obControl = new OrbitControls(this.camera, this.renderer.domElement);
    if (this.options.controls === "custom") {
      obControl.enableRotate = false;
      obControl.enablePan = false;
      this.controls = new CustomOrbitControls(
        this.mainContainer,
        this.renderer,
        this.options.config.earth?.dragConfig!
      );
    } else {
      this.controls = obControl;
    }
    if (!this._store.config.enableZoom) {
      obControl.enableZoom = false;
    }
    if (this._store.mode === "2d") {
      this.addFigures2d();
    } else if (this._store.mode === "3d") {
      this.addFigures3d();
    }
    const zoom = this.options.config.zoom as number;
    this.mainContainer.scale.set(zoom, zoom, zoom);
    this.animate();
    dom.appendChild(this.renderer.domElement);
    
    // 配置canvas元素样式以支持透明背景
    const canvas = this.renderer.domElement;
    canvas.style.display = 'block';  // 确保canvas是块级元素
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    
    // 如果是透明背景，确保容器样式正确
    const bgColor = this.options.config.bgStyle?.color;
    const bgOpacity = this.options.config.bgStyle?.opacity ?? 1;
    
    if (bgColor === 'transparent' || bgOpacity === 0) {
      // 确保容器允许透明背景
      if (!dom.style.background && !dom.style.backgroundColor) {
        dom.style.background = 'transparent';
      }
      
      // 确保父元素也支持透明
      if (dom.parentElement) {
        const parent = dom.parentElement;
        if (!parent.style.background && !parent.style.backgroundColor) {
          parent.style.background = 'transparent';
        }
      }
    }
  }

  /**
   * Method to create an orthographic camera.
   * @returns {OrthographicCamera} The created orthographic camera.
   */
  createOrthographicCamera(): OrthographicCamera {
    const k = this.style.width / this.style.height;
    const s = 200;
    const camera = new OrthographicCamera(-s * k, s * k, s, -s, 1, 1500);
    camera.position.set(0, 0, 500);
    camera.lookAt(0, 0, 0);
    return camera;
  }

  /**
   * Method to create a scene.
   * @returns {Scene} The created scene.
   */
  createScene(): Scene {
    return new Scene();
  }

  /**
   * Method to create a perspective camera.
   * @returns {PerspectiveCamera} The created perspective camera.
   */
  createCamera(): PerspectiveCamera {
    const camera = new PerspectiveCamera(
      95,
      this.style.width / this.style.height,
      1,
      1500
    );
    camera.position.set(350, 350, 350);
    camera.lookAt(new Vector3(0, 0, 0));
    return camera;
  }

  /**
   * Method to create a light.
   * @param {string} lightType - The type of the light.
   */
  createLight(lightType: string) {
    const color: string = "#fff";
    if (lightType === "DirectionalLight") {
      const light = new DirectionalLight(color, 1);
      light.position.set(2000, 2000, 3000);
      light.castShadow = true;
      this.scene.add(light);
      return light;
    } else if (lightType === "AmbientLight") {
      const light = new AmbientLight(color, 1);
      this.scene.add(light);
      return light;
    } else if (lightType == "PointLight") {
      const light = new PointLight(color, 1, 100);
      light.position.set(200, 200, 40);
      this.scene.add(light);
      return light;
    } else {
      const light = new DirectionalLight(color, 1);
      light.position.set(2000, 2000, 3000);
      light.castShadow = true;
      this.scene.add(light);
      return light;
    }
  }

  /**
   * Method to create a helper.
   */
  createHelper() {
    const helper = new AxesHelper(250);
    this.scene.add(helper);
  }

  /**
   * Method to add 3D figures to the scene.
   */
  addFigures3d() {
    const groupEarth = new CreateEarth(this._store).create();
    // 如果是混合纹理或者不使用纹理
    if (
      this.options.config.texture?.mixed ||
      !this.options.config.texture?.path
    ) {
      const mapShape = new MapShape(this);
      groupEarth.add(...mapShape.create());
    }
    if (this._store.config.spriteStyle.show) {
      this.mainContainer.add(sprite(this._store.getConfig()));
    }
    this.mainContainer.add(groupEarth);

    this.scene.add(this.mainContainer);
  }

  /**
   * Method to add 2D figures to the scene.
   */
  addFigures2d() {
    const mapGroup = new Group();
    mapGroup.name = "mapGroup";
    const mapShape = new MapShape(this);
    mapGroup.add(...mapShape.create());
    this.mainContainer.add(mapGroup);
    this.scene.add(this.mainContainer);
  }

  /**
   * Method to create a cube.
   * @returns {Group} The created cube.
   */
  createCube(): Group {
    const obj = new Group();
    obj.name = "mainContainer";
    return obj;
  }
  addWall(): Group {
    const obj = new Group();
    obj.name = "wall";
    return obj;
  }
  /**
   * Method to create a renderer.
   * @returns {WebGLRenderer} The created renderer.
   */
  createRender(): WebGLRenderer {
    // 创建支持透明背景的WebGL渲染器
    const renderer = new WebGLRenderer({
      antialias: true,
      alpha: true,                    // 启用alpha通道
      premultipliedAlpha: false,      // 禁用预乘alpha，重要
      preserveDrawingBuffer: true,    // 保留绘图缓冲区
    });
    
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(this.style.width, this.style.height);
    
    // 处理透明背景配置
    const bgColor = this.options.config.bgStyle?.color;
    const bgOpacity = this.options.config.bgStyle?.opacity ?? 1;
    
    if (bgColor === 'transparent' || bgOpacity === 0) {
      // 完全透明背景
      renderer.setClearColor(0x000000, 0);  // 透明清除色
      renderer.setClearAlpha(0);            // 透明alpha
      
      // 确保canvas元素样式透明
      const canvas = renderer.domElement;
      canvas.style.backgroundColor = 'transparent';
      canvas.style.backgroundImage = 'none';
      canvas.style.opacity = '1';
      
      // 重要：确保canvas的alpha通道正确工作
      renderer.autoClear = true;
      renderer.autoClearColor = true;
    } else {
      // 非透明背景
      renderer.setClearColor(bgColor!, bgOpacity);
    }
    
    return renderer;
  }

  /**
   * Method to limit the frames per second.
   * @param {boolean | undefined} isLimit - Whether to limit the frames per second.
   * @returns {Function} The function to check whether to render the next frame.
   */
  lockFps(isLimit: boolean = false): Function {
    const clock = new Clock();
    const FPS = 30;
    const renderT = 1 / FPS;
    let timeS = 0;
    return function () {
      if (!isLimit) return true;
      const T = clock.getDelta();
      timeS = timeS + T;
      if (timeS > renderT) {
        timeS = 0;
        return true;
      }
    };
  }

  /**
   * Method to check whether to rotate the scene.
   * @returns {boolean} Whether to rotate the scene.
   */
  shouldRotate(): boolean | undefined {
    if (this.options.mode === "3d") {
      if (this.options.config.stopRotateByHover) {
        if (this.earthHovered) {
          return false;
        } else {
          return this.options.autoRotate;
        }
      } else {
        return this.options.autoRotate;
      }
    } else {
      return false;
    }
  }
  /**
   * Method to create a group for country names.
   */
  createCountryNamesText() {
    const group = new Group();
    group.name = "countryNames";
    if (!this.options.config.textMark?.data) {
      return null;
    } else {
      const countryText = new CountryNamesText(this._store);
      const countryData = countryText.create();
      if (countryData.length) {
        group.add(...countryText.create());
      }
    }
    this.mainContainer.add(group);
  }

  /**
   * Method to animate the scene.
   */
  animate() {
    if (this.notLockFps()) {
      tweenUpdate();
      if (this.shouldRotate()) {
        this.mainContainer.rotateY(this.options.rotateSpeed!);
      }
      
      // 渲染场景
      this.renderer.render(this.scene, this.camera);
    }
    if (this.options.mode === "3d") {
      this.controls.update(); // 确保平滑效果
    }
    requestAnimationFrame(() => {
      this.animate();
    });
  }

  /**
   * Method to set data to the scene.
   * @param {K} type - The type of the data.
   * @param {SetData[K]} data - The data to be set.
   */
  setData = async <K extends keyof SetData>(type: K, data: SetData[K]) => {
    try {
      this.remove(type, "removeAll");
      const group = await this._OperateView.setData(type, data);
      this.mainContainer.add(...group);
    } catch (e) {
      console.log(e);
    }
  };

  /**
   * Method to add data to the scene.
   * @param {K} type - The type of the data.
   * @param {SetData[K]} data - The data to be added.
   */
  addData = async <K extends keyof SetData>(type: K, data: SetData[K]) => {
    try {
      const group = await this._OperateView.setData(type, data);
      this.mainContainer.add(...group);
    } catch (e) {
      console.log(e);
    }
  };

  /**
   * Method to remove data from the scene.
   * @param {string} type - The type of the data.
   * @param {string[] | "removeAll"} ids - The ids of the data to be removed.
   */
  remove(type: string, ids: string[] | "removeAll" = "removeAll") {
    this._OperateView.remove(this.mainContainer, type, ids);
  }
}
