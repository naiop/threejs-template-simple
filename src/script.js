import "./style.css";
import * as THREE from "three";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { GUI } from "three/examples/jsm/libs/dat.gui.module.js";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { TWEEN } from "three/examples/jsm/libs/tween.module.min.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { MapControls } from "./MapControls"; //拖动camera 控制

import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass.js";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader.js";

//import snowTexture from '../static/images/snow.png';

let container, stats;
let camera, scene, renderer, controls;
let composer, effectFXAA, outlinePass;

let selectedObjects = [];


const axes = new THREE.AxesHelper(50); // 坐标系辅助工具 ,添加到scene即可
const raycaster = new THREE.Raycaster(); //射线选择
const mouse = new THREE.Vector2();

const obj3d = new THREE.Object3D();
const group = new THREE.Group();

var points = []; //雪花
let a;
let startFlag = true;
let endFlag = false;
let toggleFlag = true;
let car;
let backWheels, frontWheels;
const params = {
  test: "货物",
  rotate: false,
  usePatternTexture: false,
};

// Init gui
const gui = new GUI({ width: 300 });
gui.add(params, "rotate");
gui.add(params, "usePatternTexture").onChange(function (value) {
  outlinePass.usePatternTexture = value;
});
gui.add(params, "test").name("选中的物体:").listen();

init();
animate();

/** 放置虚线框区域和库区名称 */
function addArea(x, z, width, length, scene, name, textColor, font_size) {
  var planeMat = new THREE.MeshLambertMaterial();
  new THREE.TextureLoader().load("images/plane.png", function (map) {
    planeMat.map = map;
    planeMat.transparent = true;
    planeMat.opacity = 0.8;
    planeMat.needsUpdate = true;
  });

  var geometry = new THREE.PlaneGeometry(width, length);
  var obj = new THREE.Mesh(geometry, planeMat);
  obj.position.set(x, 0.01, z);
  obj.rotation.x = -Math.PI / 2.0;
  obj.name = "库区" + "$" + name.split("$")[1];
  scene.add(obj);

  new THREE.FontLoader().load("font/FZYaoTi_Regular.json", function (font) {
    var text = new THREE.TextGeometry(name.split("$")[1], {
      // 设定文字字体
      font: font,
      //尺寸
      size: font_size,
      //厚度
      height: 0.01,
    });
    text.computeBoundingBox();
    //3D文字材质
    var m = new THREE.MeshStandardMaterial({ color: "#" + textColor });
    var mesh = new THREE.Mesh(text, m);
    mesh.position.x = -10;
    mesh.position.y = 0.01;
    mesh.position.z = 5;
    mesh.rotation.x = -Math.PI / 2.0; //立体/平面
    scene.add(mesh);
  });
}

function skybox() {
  // skybox

  const cubeTextureLoader = new THREE.CubeTextureLoader();
  cubeTextureLoader.setPath("images/");

  const cubeTexture = cubeTextureLoader.load([
    "px.jpg",
    "nx.jpg",
    "py.jpg",
    "ny.jpg",
    "pz.jpg",
    "nz.jpg",
  ]);
  scene.background = cubeTexture;
}



function init() {
  container = document.createElement("div");
  document.body.appendChild(container);

  const width = window.innerWidth;
  const height = window.innerHeight;

  renderer = new THREE.WebGLRenderer();
  renderer.shadowMap.enabled = true;
  // todo - support pixelRatio in this demo
  renderer.setSize(width, height);
  document.body.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xcce0ff);
  scene.fog = new THREE.Fog(scene.background, 1, 5000);

  skybox(); //天空盒

  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(5, 0, 12);

  //controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 5;
  controls.maxDistance = 20;
  controls.maxPolarAngle = Math.PI * 0.4; //最大角度 地平面与camera
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  // LIGHTS HemisphereLight

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
  hemiLight.color.setHSL(0.6, 1, 0.6);
  hemiLight.groundColor.setHSL(0.095, 1, 0.75);
  hemiLight.position.set(0, 50, 0);
  scene.add(hemiLight);

  const hemiLightHelper = new THREE.HemisphereLightHelper(hemiLight, 10);
  scene.add(hemiLightHelper);

  //LIGHTS DirectionalLight

  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.color.setHSL(0.1, 1, 0.95);
  dirLight.position.set(-1, 1.75, 1);
  dirLight.position.multiplyScalar(30);
  scene.add(dirLight);

  dirLight.castShadow = true;

  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;

  const d = 50;

  dirLight.shadow.camera.left = -d;
  dirLight.shadow.camera.right = d;
  dirLight.shadow.camera.top = d;
  dirLight.shadow.camera.bottom = -d;

  dirLight.shadow.camera.far = 3500;
  dirLight.shadow.bias = -0.0001;

  const dirLightHelper = new THREE.DirectionalLightHelper(dirLight, 10);
  scene.add(dirLightHelper);

  // model
  const loader1 = new STLLoader();
  var Path1 = "models/lj.stl";
  loader1.load(Path1, function (geometry) {
    var material = new THREE.MeshPhongMaterial({
      color: "#69f",
    });

    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 0, 0); // yzx
    mesh.rotation.set(-Math.PI / 2, 0, 0);
    mesh.scale.set(0.001, 0.001, 0.001);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = "货架";
    group.add(mesh);
  });
  // 


  //
  scene.add(group);

  addArea(0, 0, 20, 10, group, "ID1$库区1号", "FF0000", 0.5); //区域
  // box ==========================================================

  const cubeGeo = new THREE.BoxBufferGeometry(0.5, 0.3, 0.5);
  const cubeMaterial = new THREE.MeshLambertMaterial({
    color: 0xfeb74c,
    map: new THREE.TextureLoader().load("images/box.png"),
  });
  const voxel = new THREE.Mesh(cubeGeo, cubeMaterial);
  voxel.position.set(-1.65, 1.2, 0);
  voxel.name = "货物$1";
  group.add(voxel);

  const voxel2 = voxel.clone();
  voxel2.position.set(-1.1, 0.4, 0);
  voxel2.name = "货物$2";
  group.add(voxel2);

  const voxel3 = voxel.clone();
  voxel3.position.set(-0.55, 0.4, 0);
  voxel3.name = "货物$3";
  group.add(voxel3);

  const voxel4 = voxel.clone();
  voxel4.position.set(0, 1.2, 0);
  voxel4.name = "货物$4";
  group.add(voxel4);

  const voxel5 = voxel.clone();
  voxel5.position.set(0.55, 2, 0);
  voxel5.name = "货物$5";
  group.add(voxel5);

  const voxel6 = voxel.clone();
  voxel6.position.set(1.1, 0.4, 0);
  voxel6.name = "货物$6";
  group.add(voxel6);

  const voxel7 = voxel.clone();
  voxel7.position.set(1.65, 2.0, 0);
  voxel7.name = "货物$7";
  group.add(voxel7);

  ////
  const voxel11 = voxel.clone();
  voxel11.position.set(-1.65, 2.8, 0);
  voxel11.name = "货物$8";
  group.add(voxel11);

  const voxel12 = voxel.clone();
  voxel12.position.set(-1.1, 1.6, 0);
  voxel12.name = "货物$9";
  group.add(voxel12);

  const voxel13 = voxel.clone();
  voxel13.position.set(-1.1, 2.8, 0);
  voxel13.name = "货物$10";
  group.add(voxel13);

  const voxel14 = voxel.clone();
  voxel14.position.set(0, 0.8, 0);
  voxel14.name = "货物$11";
  group.add(voxel14);

  const voxel15 = voxel.clone();
  voxel15.position.set(0.55, 2.8, 0);
  voxel15.name = "货物$12";
  group.add(voxel15);

  const voxel16 = voxel.clone();
  voxel16.position.set(1.1, 2.8, 0);
  voxel16.name = "货物$13";
  group.add(voxel16);

  const voxel17 = voxel.clone();
  voxel17.position.set(1.65, 0.8, 0);
  voxel17.name = "货物$14";
  group.add(voxel17);

  // box ==========================================================

  // 雪花贴图
  //let texture = new THREE.TextureLoader().load(images/snow.png);
  var geometry = new THREE.Geometry(); //如果有人仍然想使用Geometry，那么在使用cdn时在版本声明中使用r122。  "three": "^0.130.1",
  let range = 100;
  let pointsMaterial = new THREE.PointsMaterial({
    size: 1,
    transparent: true,
    opacity: 0.8,
    map: new THREE.TextureLoader().load("images/snow.png"),
    // 背景融合
    blending: THREE.AdditiveBlending,
    // 景深衰弱
    sizeAttenuation: true,
    depthTest: false
  });
  for (let i = 0; i < 1500; i++) {
    let vertice = new THREE.Vector3(Math.random() * range - range / 2, Math.random() * range * 1.5, Math.random() * range - range / 2);
    // 纵向移速
    vertice.velocityY = 0.1 + Math.random() / 3;
    // 横向移速
    vertice.velocityX = (Math.random() - 0.5) / 3;
    // 加入到几何
    geometry.vertices.push(vertice);
  }
  geometry.center();
  points = new THREE.Points(geometry, pointsMaterial);
  points.position.y = -30;
  scene.add(points);



  const groundGeo = new THREE.PlaneGeometry(50, 50);
  const groundMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  groundMat.color.setHSL(0.095, 1, 0.75);

  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.position.y = 0;
  ground.rotation.x -= Math.PI * 0.5;
  ground.receiveShadow = true;
  ground.name = "地板";
  group.add(ground);


  // car-------------------------------------------
  //公共的材质
  const m = new THREE.MeshNormalMaterial()


  //car 整个汽车 group
  car = new THREE.Group()

  //两面两个轮子 frontWheels - group
  frontWheels = new THREE.Group()
  //轮子1 wheel1 - group
  const wheel1 = new THREE.Group()

  const wheelG = new THREE.TorusGeometry(0.5, 0.1, 10, 20)
  const wheel1Mesh = new THREE.Mesh(wheelG, m)

  const n = 10
  for (let i = 0; i < n; i++) {
    const g = new THREE.CylinderGeometry(0.03, 0.03, 1)
    const mesh = new THREE.Mesh(g, m)
    mesh.rotation.z = Math.PI * 2 / n * i
    wheel1.add(mesh)
  }
  wheel1.add(wheel1Mesh)
  //车轴1
  const len = 2.4
  const cylinderG = new THREE.CylinderGeometry(0.05, 0.05, len)
  const cylinder = new THREE.Mesh(cylinderG, m)
  cylinder.rotation.x = - 0.5 * Math.PI

  wheel1.position.z = -len / 2

  //轮子2 wheel2
  const wheel2 = wheel1.clone()
  wheel2.position.z = len / 2

  frontWheels.add(wheel1, cylinder, wheel2)
  frontWheels.rotation.y = 0.5 * Math.PI
  frontWheels.position.y = 0.5
  frontWheels.position.x = 0
  frontWheels.position.z = 1

  //后面的两个轮子 backWheels 
  backWheels = frontWheels.clone()
  backWheels.position.y = 0.5 * Math.PI
  backWheels.position.y = 0.5
  backWheels.position.x = 0
  backWheels.position.z = -1


  //车身 body group
  const body = new THREE.Group()
  //车板
  const cubeG = new THREE.BoxGeometry(2, 0.5, 4)
  const cube = new THREE.Mesh(cubeG, m)
  cube.position.y = 0.8
  //车


  const carX = new THREE.Group()
  const roofG = new THREE.BoxGeometry(0.2, 0.5, 2.5);
  const roof = new THREE.Mesh(roofG, m)
  roof.position.y = 1.2
  roof.position.x = -0.9
  roof.position.z = -0.6
  const roof2 = roof.clone()
  roof2.position.y = 1.2
  roof2.position.x = 0.9
  roof2.position.z = -0.6
  const roofH = new THREE.BoxGeometry(2, 0.5, 0.2);
  const roof3 = new THREE.Mesh(roofH, m)
  roof3.position.y = 1.2
  roof3.position.x = 0
  roof3.position.z = -1.9
  const roofx = new THREE.CylinderGeometry(1, 1, 2, 3, 2, false, Math.PI * 2, Math.PI);
  const roof4 = new THREE.Mesh(roofx, m)
  roof4.position.y = 1
  roof4.position.z = 1
  roof4.rotation.z = Math.PI / 2
  carX.add(roof, roof2, roof3, roof4)

  body.add(cube, carX, frontWheels, backWheels)

  car.add(body) // 添加载货
  scene.add(car);
  car.scale.set(0.4, 0.4, 0.4);    //设置大小为原来的1.5倍

  //自定义路径类
  class myPath {
    constructor(array) {
      console.log(array);
      //将传进来的数组转换为Vec3集合
      let pointsArr = [];
      if (array.length % 3 !== 0) {
        console.error('错误，数据的个数非3的整数倍！', array);
        return null;
      }
      for (let index = 0; index < array.length; index += 3) {
        pointsArr.push(new THREE.Vector3(array[index], array[index + 1], array[index + 2]));
      }

      //顶点位置三维向量数组
      this.pointsArr = pointsArr;

      //折线几何体
      this.line = null;
      {
        let lineMaterial = new THREE.LineBasicMaterial({
          color: 0xff00ff
        });
        let lineGeometry = new THREE.BufferGeometry().setFromPoints(pointsArr);
        this.line = new THREE.Line(lineGeometry, lineMaterial);
      }


      //锚点几何体
      this.points = null;
      {
        let pointsBufferGeometry = new THREE.BufferGeometry();
        pointsBufferGeometry.setAttribute('position', new THREE.Float32BufferAttribute(array, 3));
        let pointsMaterial = new THREE.PointsMaterial({ color: 0xffff00, size: 0.5 });
        this.points = new THREE.Points(pointsBufferGeometry, pointsMaterial);
      }


      //计算每个锚点在整条折线上所占的百分比
      this.pointPercentArr = [];
      {
        let distanceArr = []; //每段距离
        let sumDistance = 0;  //总距离
        for (let index = 0; index < pointsArr.length - 1; index++) {
          distanceArr.push(pointsArr[index].distanceTo(pointsArr[index + 1]));
        }
        sumDistance = distanceArr.reduce(function (tmp, item) {
          return tmp + item;
        })


        let disPerSumArr = [0];
        disPerSumArr.push(distanceArr[0]);
        distanceArr.reduce(function (tmp, item) {
          disPerSumArr.push(tmp + item);
          return tmp + item;
        })

        disPerSumArr.forEach((value, index) => {
          disPerSumArr[index] = value / sumDistance;
        })
        this.pointPercentArr = disPerSumArr;
      }
      // console.log(this.pointPercentArr);


      //上一次的朝向
      this.preUp = new THREE.Vector3(0, 10, 0);



      //run函数需要的数据
      this.perce = 0; //控制当前位置占整条线百分比
      this.speed = 0.0005;  //控制是否运动
      this.turnFactor = 0;  //暂停时间因子
      this.turnSpeedFactor = 0.001; //转向速度因子
      this.obj = null;

      this.preTime = new Date().getTime();
      this.firstTurn = false;


    }

    //获取点，是否转弯，朝向等
    getPoint(percent) {

      console.log('ddddd' + percent)
      let indexP = 0;
      let indexN = 0;
      let turn = false;

      for (let i = 0; i < this.pointPercentArr.length; i++) {
        if (percent >= this.pointPercentArr[i] && percent < this.pointPercentArr[i + 1]) {
          indexN = i + 1;
          indexP = i;
          if (percent === this.pointPercentArr[i]) {
            turn = true;
          }
        }
      }

      let factor = (percent - this.pointPercentArr[indexP]) / (this.pointPercentArr[indexN] - this.pointPercentArr[indexP]);
      let position = new THREE.Vector3();
      position.lerpVectors(this.pointsArr[indexP], this.pointsArr[indexN], factor); //position的计算完全正确




      //计算朝向
      let up = new THREE.Vector3().subVectors(this.pointsArr[indexN], this.pointsArr[indexP]);
      // console.log(this.preUp)
      let preUp = this.preUp;
      if (this.preUp.x != up.x || this.preUp.y != up.y || this.preUp.z != up.z) {

        //console.info('当前朝向与上次朝向不等，将turn置为true！');
        turn = true;
      }

      this.preUp = up;


      return {
        position,
        direction: up,

        turn, //是否需要转向
        preUp, //当需要转向时的上次的方向

      };

    }


    //参数：是否运动，运动的对象，是否运动到结尾
    run(animata, camera, end) {

      if (end) {

        this.perce = 0.99999;
        this.obj = this.getPoint(this.perce);

        //修改位置
        let posi = this.obj.position;

        // cone.position.set(posi.x, posi.y, posi.z);
        camera.position.set(posi.x, posi.y, posi.z); //相机漫游2
      }

      else if (animata) {
        console.log(this.obj)
        //转弯时
        if (this.obj && this.obj.turn) {

          if (this.turnFactor == 0) {
            this.preTime = new Date().getTime();
            this.turnFactor += 0.000000001;
          }
          else {
            let nowTime = new Date().getTime();
            let timePass = nowTime - this.preTime;
            this.preTime = nowTime;

            this.turnFactor += this.turnSpeedFactor * timePass;
          }


          console.log('--->>> 当前需要turn , turnFactor值为 :', this.turnFactor);
          if (this.turnFactor > 1) {
            this.turnFactor = 0;
            this.perce += this.speed;

            this.obj = this.getPoint(this.perce);
          }

          else {

            //修改朝向 (向量线性插值方式)
            let interDirec = new THREE.Vector3();
            interDirec.lerpVectors(this.obj.preUp, this.obj.direction, this.turnFactor);

            let look = new THREE.Vector3();
            look = look.add(this.obj.position);
            look = look.add(interDirec);

            //cone.lookAt(look);
            camera.lookAt(look);  //相机漫游1
          }

        }

        //非转弯时
        else {

          this.obj = this.getPoint(this.perce);

          //修改位置
          let posi = this.obj.position;

          //car.position.set(posi.x , posi.y,posi.z);
          camera.position.set(posi.x, posi.y, posi.z); //相机漫游2


          //当不需要转向时进行
          if (!this.obj.turn) {
            let look = posi.add(this.obj.direction);

            // cone.lookAt(look);
            camera.lookAt(look); //相机漫游3
          }
          this.perce += this.speed;

        }
      }


    }
  }

  a = new myPath([
    0, 0, 0,
    10, 0, 0,
    10, 0, 5,
    -10, 0, 5,
    -10, 0, 0,
    10, 0, 0,
  ]);

  scene.add(a.points);
  scene.add(a.line);



  // car-------------------------------------------
  group.add(axes); //添加坐标系辅助工具
  //

  stats = new Stats();
  container.appendChild(stats.dom);

  // postprocessing

  composer = new EffectComposer(renderer);

  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  outlinePass = new OutlinePass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    scene,
    camera
  );
  outlinePass.edgeGlow = Number("1");
  outlinePass.visibleEdgeColor.set("#0fff00");
  composer.addPass(outlinePass);

  const textureLoader = new THREE.TextureLoader();
  textureLoader.load("images/tri_pattern.jpg", function (texture) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    outlinePass.patternTexture = texture;
  });

  effectFXAA = new ShaderPass(FXAAShader);
  effectFXAA.uniforms["resolution"].value.set(
    1 / window.innerWidth,
    1 / window.innerHeight
  );
  composer.addPass(effectFXAA);

  window.addEventListener("resize", onWindowResize);

  window.addEventListener("click", onMouseClick);

  renderer.domElement.style.touchAction = "none";
  renderer.domElement.addEventListener("pointermove", onPointerMove);

  function onPointerMove(event) {
    if (event.isPrimary === false) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    //checkIntersection();
  }

  function addSelectedObject(object) {
    selectedObjects = [];
    selectedObjects.push(object);
  }

  function checkIntersection() {
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObject(scene, true);

    if (intersects.length > 0) {
      const selectedObject = intersects[0].object;
      addSelectedObject(selectedObject);
      outlinePass.selectedObjects = selectedObjects;
    } else {
      // outlinePass.selectedObjects = [];
    }
  }

  // 鼠标点击事件
  function onMouseClick(event) {
    var x, y;
    if (event.changedTouches) {
      x = event.changedTouches[0].pageX;
      y = event.changedTouches[0].pageY;
    } else {
      x = event.clientX;
      y = event.clientY;
    }
    mouse.x = (x / window.innerWidth) * 2 - 1;
    mouse.y = -(y / window.innerHeight) * 2 + 1;
    // raycaster 选择物体
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects([scene], true);
    if (intersects.length > 0) {
      //给选中的线条和物体加发光特效
      const SelectedObject = intersects[0].object;

      selectedObjects = [];
      selectedObjects.push(SelectedObject);
      outlinePass.selectedObjects = selectedObjects;
      //控制台打印
      var Msg = intersects[0].object.name.split("$");
      console.log(Msg);

      params.test = Msg;
    } else {
      // outlinePass.selectedObjects = [];
    }
  }
}

function onWindowResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
  composer.setSize(width, height);

  effectFXAA.uniforms["resolution"].value.set(
    1 / window.innerWidth,
    1 / window.innerHeight
  );
}

function animate() {
  requestAnimationFrame(animate);
  // 顶点变动之后需要更新，否则无法实现雨滴特效
  points.geometry.verticesNeedUpdate = true;
  // 雪花动画更新
  let vertices = points.geometry.vertices;
  vertices.forEach(function (v) {
    v.y = v.y - (v.velocityY);
    v.x = v.x - (v.velocityX);
    if (v.y <= 0) v.y = 60;
    if (v.x <= -20 || v.x >= 20) v.velocityX = v.velocityX * -1;
  });



  stats.begin();

  const timer = performance.now();

  if (params.rotate) {
    group.rotation.y = timer * 0.0001;
  }

  //轮子
  frontWheels.rotation.x = timer
  backWheels.rotation.x = timer
  a.run(startFlag, car, endFlag);
  // //路程循环
  if (a.perce >= 1) {
    a.perce = 0;
  }


  controls.update();

  composer.render();

  stats.end();
}
