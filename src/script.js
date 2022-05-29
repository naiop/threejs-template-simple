import "./style.css";
import * as THREE from "three";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { GUI } from "three/examples/jsm/libs/dat.gui.module.js";  // GUI
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"; // 控制
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js"; //Obj 模型加载库
import { TWEEN } from "three/examples/jsm/libs/tween.module.min.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js"; //STL 模型加载库
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass.js";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader.js";
import snowTexture from '../static/images/snow.png'; //图片资源导入
var echarts = require('echarts'); //导入 echarts

import * as Ammo from './builds/ammo';
import {
  launchClickPosition,
  launchHover,
} from './utils/util'; 
import {
  setupEventHandlers,
  moveDirection,
  isTouchscreenDevice,
  touchEvent,
  createJoystick,
} from './utils/eventHandlers'; //event
import {
  simpleText,
  floatingLabel,
  allSkillsSection,
  createTextOnPlane,
  loadText,
} from './utils/surfaces';
export let  camera, scene, renderer, controls ,light;  // 相机，场景，渲染器，控制，灯光
const group = new THREE.Group(); //组
const clock = new THREE.Clock(); //时钟，定时刷新
let lastElapsedTime = 0 ; //刷新时间 
let points = []; //雪花
let  stats;  //性能插件stats

//GUI 参数
const GUIparams = {
  MeshName: "name", //name
  Rotate: false, //旋转
  UsePatternTexture: false, //Raycaster 贴图
  BoxNum: 888
};
let car, backWheels, frontWheels , CarPathLine; // 车 ，前轮，后轮
let carAnimata = true , carEndFlag = false; // 车是否运动  ， 车到线路末尾

//------------
const raycaster = new THREE.Raycaster(); //射线类Raycaster来拾取场景里面的物体
let composer, effectFXAA, outlinePass; //创作者   效果合成器（EffectComposer）
let selectedObjects = []; //选中的物体
/*mouse，鼠标所对应的二维向量,监听鼠标移动事件
  mouse.x是指 鼠标的x到屏幕y轴的距离与屏幕宽的一半的比值 绝对值不超过1
  mouse.y是指 鼠标的y到屏幕x轴的距离与屏幕宽的一半的比值 绝对值不超过1
*/
const mouse = new THREE.Vector2();
const obj3d = new THREE.Object3D();  //加载obj 模型

export let manager = new THREE.LoadingManager();

/*
 2022.5.22  Add Ammo
*/
// Ammo
export let cursorHoverObjects = [];



initMain();
animate();
ammoMian();
//initPhysics();

function initPhysics() {
  // start Ammo Engine
  Ammo().then((Ammo) => {

    // 物理引擎相关变量
    var gravityConstant = -9.8;
    var collisionConfiguration;
    var dispatcher;
    var broadphase;
    var solver;
    var physicsWorld;
    var rigidBodies = [];
    var margin = 0.05;
    var transformAux1 = new Ammo.btTransform();

    
    var time = 0;

     // 鼠标输入相关
     var mouseCoords = new THREE.Vector2();
     var raycaster = new THREE.Raycaster();
     var ballMaterial = new THREE.MeshPhongMaterial( { color: 0x202020 } );

     // bullet内置宏
    var DISABLE_DEACTIVATION = 4;
    var TRANSFORM_AUX = new Ammo.btTransform();
    var ZERO_QUATERNION = new THREE.Quaternion(0, 0, 0, 1);


    initPh();
    createObjects();
    //initInput();
    animate();

    function initPh() {
      // bullet基本场景配置
      collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
      dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
      broadphase = new Ammo.btDbvtBroadphase();
      solver = new Ammo.btSequentialImpulseConstraintSolver();
      physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, broadphase, solver, collisionConfiguration);
      physicsWorld.setGravity(new Ammo.btVector3(0, gravityConstant, 0));
  }

  function createObjects() {
    var pos = new THREE.Vector3();
    var quat = new THREE.Quaternion();
        // 创建地面
        pos.set(0, -0.55, 0);
        quat.set(0, 0, 0, 1);
        var ground = createParallellepiped(40, 1, 40, 0, pos, quat, new THREE.MeshPhongMaterial({color: 0xffffff}));
        ground.castShadow = true;       // 开启投影
        ground.receiveShadow = true;    // 接受阴影(可以在表面上显示阴影)
        const textureLoader = new THREE.TextureLoader(); 
        textureLoader.load("./images/grid.png", function (texture) {
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(40, 40);
            ground.material.map = texture;
            ground.material.needsUpdate = texture;
        });

    // 随机创建30个箱子,掉落
    for (var i = 0; i < GUIparams.BoxNum; i++) {
        pos.set(Math.random(), 2 *i, Math.random());
        quat.set(0, 0, 0, 2);

        createParallellepiped(0.4, 0.4, 0.4, 0.4, pos, quat, createRendomColorObjectMeatrial());
    }

    
       
    var size = .75;
    var nw = 8;
    var nh = 6;
    for (var j = 0; j < nw; j++)
        for (var ii = 0; ii < nh; ii++)
            createBox(new THREE.Vector3(size * j - (size * (nw - 1)) / 2, size * ii, -10), ZERO_QUATERNION, size, size, size, 10);
    
}
// 生成随机颜色材质
function createRendomColorObjectMeatrial() {
  var color = Math.floor(Math.random() * (1 << 24));
  return new THREE.MeshPhongMaterial({color: color});
}

function createParallellepiped(sx, sy, sz, mass, pos, quat, material) {
  var threeObject = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz, 1, 1, 1), material);
  var shape = new Ammo.btBoxShape(new Ammo.btVector3(sx * 0.5, sy * 0.5, sz * 0.5));
  shape.setMargin(margin);

  createRigidBody(threeObject, shape, mass, pos, quat);

  return threeObject;
}
function createRigidBody(threeObject, physicsShape, mass, pos, quat) {
  threeObject.position.copy(pos);
  threeObject.quaternion.copy(quat);

  var transform = new Ammo.btTransform();
  transform.setIdentity();
  transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
  transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
  var motionState = new Ammo.btDefaultMotionState(transform);

  var localInertia = new Ammo.btVector3(0, 0, 0);
  physicsShape.calculateLocalInertia(mass, localInertia);

  var rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, physicsShape, localInertia);
  var body = new Ammo.btRigidBody(rbInfo);

  threeObject.userData.physicsBody = body;

  scene.add(threeObject);

  if (mass > 0) {
      rigidBodies.push(threeObject);

      // Disable deactivation
      // 防止物体弹力过快消失

      // Ammo.DISABLE_DEACTIVATION = 4
      body.setActivationState(4);
  }

  physicsWorld.addRigidBody(body);

  return body;
}


function createBox(pos, quat, w, l, h, mass, friction) {
  var material = createRendomColorObjectMeatrial();
  var shape = new THREE.BoxGeometry(w, l, h, 1, 1, 1);
  var geometry = new Ammo.btBoxShape(new Ammo.btVector3(w * 0.5, l * 0.5, h * 0.5));
  if(!mass) mass = 0;
  if(!friction) friction = 1;
  var mesh = new THREE.Mesh(shape, material);
  mesh.position.copy(pos);
  mesh.quaternion.copy(quat);
  scene.add( mesh );
  
}

function animate() {
  requestAnimationFrame(animate);

  render();

  stats.update();

}

function render() {
  //var deltaTime = clock.getDelta();
  var deltaTime = clock.getElapsedTime();

  updatePhysics(deltaTime);

  controls.update(deltaTime);

  renderer.render(scene, camera);

  time += deltaTime;
}

function updatePhysics(deltaTime) {
  physicsWorld.stepSimulation(deltaTime);

  // 更新物体位置
  for (var i = 0, iL = rigidBodies.length; i <iL; i++ ){
      var objThree = rigidBodies[i];
      var objPhys = objThree.userData.physicsBody;
      var ms = objPhys.getMotionState();
      if (ms) {
          ms.getWorldTransform(transformAux1);
          var p = transformAux1.getOrigin();
          var q = transformAux1.getRotation();
          objThree.position.set(p.x(), p.y(), p.z());
          objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());
      }
  }
}
  
function initInput() {
  window.addEventListener("click",function (event) {
      mouseCoords.set((event.clientX / window.innerWidth) * 2 - 1,-(event.clientY / window.innerHeight) * 2 + 1 );

      raycaster.setFromCamera(mouseCoords, camera);

      // Creates a ball and throws it
      var ballMass = 35;
      var ballRadius = 0.4;

      var ball = new THREE.Mesh(
        new THREE.SphereGeometry(ballRadius, 14, 10),
        ballMaterial
      );
      ball.castShadow = true;
      ball.receiveShadow = true;
      var ballShape = new Ammo.btSphereShape(ballRadius);
      ballShape.setMargin(margin);
      var pos = new THREE.Vector3();
      var quat = new THREE.Quaternion();
      pos.copy(raycaster.ray.direction);
      pos.add(raycaster.ray.origin);
      quat.set(0, 0, 0, 1);
      var ballBody = createRigidBody(ball, ballShape, ballMass, pos, quat);

      pos.copy(raycaster.ray.direction);
      pos.multiplyScalar(24);
      ballBody.setLinearVelocity(new Ammo.btVector3(pos.x, pos.y, pos.z));
    },
    false
  );
}



  });
}

function ammoMian(){

  Ammo().then((Ammo) => {
    //Ammo.js 变量声明
    let rigidBodies = [], physicsWorld;
  
    //Ammo 球的动态实体
    let ballObject = null;
    const STATE = { DISABLE_DEACTIVATION: 4 };
  
    //默认变换对象
    let tmpTrans = new Ammo.btTransform();
  
    // 超链接对象列表
    var objectsWithLinks = [];
  
    //创建物理世界的函数 Ammo.js
    function createPhysicsWorld() {
      //全（非宽相位）碰撞检测算法
      let collisionConfiguration = new Ammo.btDefaultCollisionConfiguration(),
        dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration), // 为重叠对/碰撞分派计算。
        overlappingPairCache = new Ammo.btDbvtBroadphase(), //所有可能碰撞对的宽相位碰撞检测列表
        constraintSolver = new Ammo.btSequentialImpulseConstraintSolver(); //使对象正确交互，如重力、游戏逻辑力、碰撞
  
      // 有关信息，请参阅bullet physics文档
      physicsWorld = new Ammo.btDiscreteDynamicsWorld(
        dispatcher,
        overlappingPairCache,
        constraintSolver,
        collisionConfiguration
      );
  
      // add gravity
      physicsWorld.setGravity(new Ammo.btVector3(0, -50, 0));
    }
  
    //创建平面
    function createGridPlane() {
      // 块属性
      let pos = { x: 0, y: -0.25, z: 0 };
      let scale = { x: 175, y: 0.5, z: 175 };
      let quat = { x: 0, y: 0, z: 0, w: 1 };
      let mass = 0; //mass of zero = infinite mass
  
      //在平面上创建栅格覆盖
      var grid = new THREE.GridHelper(175, 20, 0xffffff, 0xffffff);
      grid.material.opacity = 0.5;
      grid.material.transparent = true;
      grid.position.y = 0.005;
      scene.add(grid);
  
      //创建Threejs平面
      let blockPlane = new THREE.Mesh(
        new THREE.BoxBufferGeometry(),
        new THREE.MeshPhongMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.25,
        })
      );
      blockPlane.position.set(pos.x, pos.y, pos.z);
      blockPlane.scale.set(scale.x, scale.y, scale.z);
      blockPlane.receiveShadow = true;
      scene.add(blockPlane);
  
      //Ammo.js 物理
      let transform = new Ammo.btTransform();
      transform.setIdentity(); // 设置安全默认值
      transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
      transform.setRotation(
        new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w)
      );
      let motionState = new Ammo.btDefaultMotionState(transform);
  
      //设置碰撞框
      let colShape = new Ammo.btBoxShape(
        new Ammo.btVector3(scale.x * 0.5, scale.y * 0.5, scale.z * 0.5)
      );
      colShape.setMargin(0.05);
  
      let localInertia = new Ammo.btVector3(0, 0, 0);
      colShape.calculateLocalInertia(mass, localInertia);
  
      //  提供创建刚体的信息
      let rigidBodyStruct = new Ammo.btRigidBodyConstructionInfo(
        mass,
        motionState,
        colShape,
        localInertia
      );
      let body = new Ammo.btRigidBody(rigidBodyStruct);
      body.setFriction(10);
      body.setRollingFriction(10);
  
      // add to world
      physicsWorld.addRigidBody(body);
    }

    // 创建盒子
    function createDropBox() {

      let mass = 3;
      let radius = 2;
      var pos = new THREE.Vector3();
      var quat = new THREE.Quaternion();
      

      for (var i = 0; i < 888; i++) {
        pos.set(Math.random(), 2 *i, Math.random());
        quat.set(0, 0, 0, 2);

        var color = Math.floor(Math.random() * (1 << 24));// 生成随机颜色材质
        const material = new THREE.MeshPhongMaterial({ color: color });
 
     // var threeObject = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1, 2, 2, 2), material); //Mesh

        //threeJS Section
       let threeObject = (ballObject = new THREE.Mesh(
         new THREE.BoxGeometry(1, 1, 1, 2, 2, 2), material
       ));


       // threeObject.geometry.computeBoundingSphere();
       // threeObject.geometry.computeBoundingBox();

       // threeObject.position.set(pos.x, pos.y, pos.z);

        threeObject.castShadow = true;
        threeObject.receiveShadow = true;

        scene.add(threeObject);


       //Ammojs 部分
      let transform = new Ammo.btTransform();
      transform.setIdentity();
      transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
      transform.setRotation(
        new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w)
      );
      let motionState = new Ammo.btDefaultMotionState(transform);

      let colShape = new Ammo.btSphereShape(radius);
      colShape.setMargin(0.05);

      let localInertia = new Ammo.btVector3(0, 0, 0);
      colShape.calculateLocalInertia(mass, localInertia);

      let rbInfo = new Ammo.btRigidBodyConstructionInfo(
        mass,
        motionState,
        colShape,
        localInertia
      );
      let body = new Ammo.btRigidBody(rbInfo);
      //body.setFriction(4); //设置摩擦力
      body.setRollingFriction(10);

      //set ball friction

      //once state is set to disable, dynamic interaction no longer calculated
      body.setActivationState(STATE.DISABLE_DEACTIVATION);

      physicsWorld.addRigidBody(
        body //collisionGroupRedBall, collisionGroupGreenBall | collisionGroupPlane
      );

      threeObject.userData.physicsBody = body;
      ballObject.userData.physicsBody = body;

      rigidBodies.push(threeObject);
      rigidBodies.push(ballObject);
     }      
    }

    // 创建求
    function createBall() {
      let pos = { x: 8.75, y: 0, z: 0 };
      let radius = 2;
      let quat = { x: 0, y: 0, z: 0, w: 1 };
      let mass = 3;

      var marble_loader = new THREE.TextureLoader(manager);
      var marbleTexture = marble_loader.load("images/earth.jpg");
      marbleTexture.wrapS = marbleTexture.wrapT = THREE.RepeatWrapping;
      marbleTexture.repeat.set(1, 1);
      marbleTexture.anisotropy = 1;
      marbleTexture.encoding = THREE.sRGBEncoding;

      //threeJS Section
      let ball = (ballObject = new THREE.Mesh(
        new THREE.SphereGeometry(radius, 32, 32),
        new THREE.MeshLambertMaterial({ map: marbleTexture })
      ));

      ball.geometry.computeBoundingSphere();
      ball.geometry.computeBoundingBox();

      ball.position.set(pos.x, pos.y, pos.z);

      ball.castShadow = true;
      ball.receiveShadow = true;

      scene.add(ball);

      //Ammojs 部分
      let transform = new Ammo.btTransform();
      transform.setIdentity();
      transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
      transform.setRotation(
        new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w)
      );
      let motionState = new Ammo.btDefaultMotionState(transform);

      let colShape = new Ammo.btSphereShape(radius);
      colShape.setMargin(0.05);

      let localInertia = new Ammo.btVector3(0, 0, 0);
      colShape.calculateLocalInertia(mass, localInertia);

      let rbInfo = new Ammo.btRigidBodyConstructionInfo(
        mass,
        motionState,
        colShape,
        localInertia
      );
      let body = new Ammo.btRigidBody(rbInfo);
      //body.setFriction(4); //设置摩擦力
      body.setRollingFriction(10);

      //set ball friction

      //once state is set to disable, dynamic interaction no longer calculated
      body.setActivationState(STATE.DISABLE_DEACTIVATION);

      physicsWorld.addRigidBody(
        body //collisionGroupRedBall, collisionGroupGreenBall | collisionGroupPlane
      );

      ball.userData.physicsBody = body;
      ballObject.userData.physicsBody = body;
      //console.log(ball);
      //console.log(ballObject);
      rigidBodies.push(ball);
      rigidBodies.push(ballObject);
    }

     // 移动求
    function moveBall() {
    let scalingFactor = 20;
    let moveX = moveDirection.right - moveDirection.left;
    let moveZ = moveDirection.back - moveDirection.forward;
    let moveY = 0;

    if (ballObject.position.y < 2.01) {
      moveX = moveDirection.right - moveDirection.left;
      moveZ = moveDirection.back - moveDirection.forward;
      moveY = 0;
    } else {
      moveX = moveDirection.right - moveDirection.left;
      moveZ = moveDirection.back - moveDirection.forward;
      moveY = -0.25;
    }

    // no movement
    if (moveX == 0 && moveY == 0 && moveZ == 0) return;

    let resultantImpulse = new Ammo.btVector3(moveX, moveY, moveZ);
    resultantImpulse.op_mul(scalingFactor);
    let physicsBody = ballObject.userData.physicsBody;
    physicsBody.setLinearVelocity(resultantImpulse);
    }

    //创建沙滩球网格
    function createBeachBall() {
    let pos = { x: 20, y: 30, z: 0 };
    let radius = 2;
    let quat = { x: 0, y: 0, z: 0, w: 1 };
    let mass = 20;

    //import beach ball texture
    var texture_loader = new THREE.TextureLoader(manager);
    var beachTexture = texture_loader.load('images/BeachBallColor.jpg');
    beachTexture.wrapS = beachTexture.wrapT = THREE.RepeatWrapping;
    beachTexture.repeat.set(1, 1);
    beachTexture.anisotropy = 1;
    beachTexture.encoding = THREE.sRGBEncoding;

    //threeJS Section
    let ball = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 32, 32),
      new THREE.MeshLambertMaterial({ map: beachTexture })
    );

    ball.position.set(pos.x, pos.y, pos.z);
    ball.castShadow = true;
    ball.receiveShadow = true;
    scene.add(ball);

    //Ammojs Section
    let transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
    transform.setRotation(
      new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w)
    );
    let motionState = new Ammo.btDefaultMotionState(transform);

    let colShape = new Ammo.btSphereShape(radius);
    colShape.setMargin(0.05);

    let localInertia = new Ammo.btVector3(0, 0, 0);
    colShape.calculateLocalInertia(mass, localInertia);

    let rbInfo = new Ammo.btRigidBodyConstructionInfo(
      mass,
      motionState,
      colShape,
      localInertia
    );
    let body = new Ammo.btRigidBody(rbInfo);

    body.setRollingFriction(1);
    physicsWorld.addRigidBody(body);

    ball.userData.physicsBody = body;
    rigidBodies.push(ball);
    }

     //create X axis wall around entire plane
    function createWallX(x, y, z) {
    const wallScale = { x: 0.125, y: 4, z: 175 };

    const wall = new THREE.Mesh(
      new THREE.BoxBufferGeometry(wallScale.x, wallScale.y, wallScale.z),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        opacity: 0.75,
        transparent: true,
      })
    );

    wall.position.x = x;
    wall.position.y = y;
    wall.position.z = z;

    wall.receiveShadow = true;

    scene.add(wall);

    addRigidPhysics(wall, wallScale);
    }

    //create Z axis wall around entire plane
    function createWallZ(x, y, z) {
    const wallScale = { x: 175, y: 4, z: 0.125 };

    const wall = new THREE.Mesh(
      new THREE.BoxBufferGeometry(wallScale.x, wallScale.y, wallScale.z),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        opacity: 0.75,
        transparent: true,
      })
    );

    wall.position.x = x;
    wall.position.y = y;
    wall.position.z = z;

    wall.receiveShadow = true;

    scene.add(wall);

    addRigidPhysics(wall, wallScale);
    }

    //创建公告牌的函数
    function createBillboard(
    x,
    y,
    z,
    textureImage = billboardTextures.grassImage,
    urlLink,
    rotation = 0
  ) {
    const billboardPoleScale = { x: 1, y: 5, z: 1 };
    const billboardSignScale = { x: 30, y: 15, z: 1 };

    /* default texture loading */
    const loader = new THREE.TextureLoader(manager);

    const billboardPole = new THREE.Mesh(
      new THREE.BoxBufferGeometry(
        billboardPoleScale.x,
        billboardPoleScale.y,
        billboardPoleScale.z
      ),
      new THREE.MeshStandardMaterial({
        map: loader.load('images/woodTexture.jpg'),
      })
    );

    const texture = loader.load(textureImage);
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearFilter;
    texture.encoding = THREE.sRGBEncoding;
    var borderMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
    });
    const loadedTexture = new THREE.MeshBasicMaterial({
      map: texture,
    });

    var materials = [
      borderMaterial, // Left side
      borderMaterial, // Right side
      borderMaterial, // Top side   ---> THIS IS THE FRONT
      borderMaterial, // Bottom side --> THIS IS THE BACK
      loadedTexture, // Front side
      borderMaterial, // Back side
    ];
    // order to add materials: x+,x-,y+,y-,z+,z-
    const billboardSign = new THREE.Mesh(
      new THREE.BoxGeometry(
        billboardSignScale.x,
        billboardSignScale.y,
        billboardSignScale.z
      ),
      materials
    );

    billboardPole.position.x = x;
    billboardPole.position.y = y;
    billboardPole.position.z = z;

    billboardSign.position.x = x;
    billboardSign.position.y = y + 10;
    billboardSign.position.z = z;

    /* Rotate Billboard */
    billboardPole.rotation.y = rotation;
    billboardSign.rotation.y = rotation;

    billboardPole.castShadow = true;
    billboardPole.receiveShadow = true;

    billboardSign.castShadow = true;
    billboardSign.receiveShadow = true;

    billboardSign.userData = { URL: urlLink };

    scene.add(billboardPole);
    scene.add(billboardSign);
    addRigidPhysics(billboardPole, billboardPoleScale);

    cursorHoverObjects.push(billboardSign);
    }

      //create link boxes
  function createBox(
    x,
    y,
    z,
    scaleX,
    scaleY,
    scaleZ,
    boxTexture,
    URLLink,
    color = 0x000000,
    transparent = true
  ) {
    const boxScale = { x: scaleX, y: scaleY, z: scaleZ };
    let quat = { x: 0, y: 0, z: 0, w: 1 };
    let mass = 0; //mass of zero = infinite mass

    //load link logo
    const loader = new THREE.TextureLoader(manager);
    const texture = loader.load(boxTexture);
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearFilter;
    texture.encoding = THREE.sRGBEncoding;
    const loadedTexture = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: transparent,
      color: 0xffffff,
    });

    var borderMaterial = new THREE.MeshBasicMaterial({
      color: color,
    });
    borderMaterial.color.convertSRGBToLinear();

    var materials = [
      borderMaterial, // Left side
      borderMaterial, // Right side
      borderMaterial, // Top side   ---> THIS IS THE FRONT
      borderMaterial, // Bottom side --> THIS IS THE BACK
      loadedTexture, // Front side
      borderMaterial, // Back side
    ];

    const linkBox = new THREE.Mesh(
      new THREE.BoxBufferGeometry(boxScale.x, boxScale.y, boxScale.z),
      materials
    );
    linkBox.position.set(x, y, z);
    linkBox.renderOrder = 1;
    linkBox.castShadow = true;
    linkBox.receiveShadow = true;
    linkBox.userData = { URL: URLLink, email: URLLink };
    scene.add(linkBox);
    objectsWithLinks.push(linkBox.uuid);

    addRigidPhysics(linkBox, boxScale);

    cursorHoverObjects.push(linkBox);
  }

  //create 砖墙   1111
  function wallOfBricks() {
    const loader = new THREE.TextureLoader(manager);
    var pos = new THREE.Vector3();
    var quat = new THREE.Quaternion();
    var brickMass = 0.1;
    var brickLength = 3;
    var brickDepth = 3;
    var brickHeight = 1.5;
    var numberOfBricksAcross = 6;
    var numberOfRowsHigh = 6;

    pos.set(70, brickHeight * 0.5, -60);
    quat.set(0, 0, 0, 1);

    for (var j = 0; j < numberOfRowsHigh; j++) {
      var oddRow = j % 2 == 1;

      pos.x = 60;

      if (oddRow) {
        pos.x += 0.25 * brickLength;
      }

      var currentRow = oddRow ? numberOfBricksAcross + 1 : numberOfBricksAcross;
      for (let i = 0; i < currentRow; i++) {
        var brickLengthCurrent = brickLength;
        var brickMassCurrent = brickMass;
        if (oddRow && (i == 0 || i == currentRow - 1)) {
          //first or last brick
          brickLengthCurrent *= 0.5;
          brickMassCurrent *= 0.5;
        }
        var brick = createBrick(
          brickLengthCurrent,
          brickHeight,
          brickDepth,
          brickMassCurrent,
          pos,
          quat,
          new THREE.MeshStandardMaterial({
            map: loader.load('images/stone.png'),
          })
        );
        brick.castShadow = true;
        brick.receiveShadow = true;

        if (oddRow && (i == 0 || i == currentRow - 2)) {
          //first or last brick
          pos.x += brickLength * 0.25;
        } else {
          pos.x += brickLength;
        }
        pos.z += 0.0001;
      }
      pos.y += brickHeight;
    }
  }
  //用于创建单个砖网格的辅助函数  2222
  function createBrick(sx, sy, sz, mass, pos, quat, material) {
    var threeObject = new THREE.Mesh(
      new THREE.BoxBufferGeometry(sx, sy, sz, 1, 1, 1),
      material
    );
    var shape = new Ammo.btBoxShape(
      new Ammo.btVector3(sx * 0.5, sy * 0.5, sz * 0.5)
    );
    shape.setMargin(0.05);

    createBrickBody(threeObject, shape, mass, pos, quat);

    return threeObject;
  }
  //add physics to brick body  3333
  function createBrickBody(threeObject, physicsShape, mass, pos, quat) {
    threeObject.position.copy(pos);
    threeObject.quaternion.copy(quat);

    var transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
    transform.setRotation(
      new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w)
    );
    var motionState = new Ammo.btDefaultMotionState(transform);

    var localInertia = new Ammo.btVector3(0, 0, 0);
    physicsShape.calculateLocalInertia(mass, localInertia);

    var rbInfo = new Ammo.btRigidBodyConstructionInfo(
      mass,
      motionState,
      physicsShape,
      localInertia
    );
    var body = new Ammo.btRigidBody(rbInfo);

    threeObject.userData.physicsBody = body;

    scene.add(threeObject);

    if (mass > 0) {
      rigidBodies.push(threeObject);

      // Disable deactivation
      body.setActivationState(4);
    }

    physicsWorld.addRigidBody(body);
  }

 

  //create Ammo.js body to ->loadText()
  function ryanFloydWords(x, y, z) {
    const boxScale = { x: 46, y: 3, z: 2 };
    let quat = { x: 0, y: 0, z: 0, w: 1 };
    let mass = 0; //mass of zero = infinite mass

    const linkBox = new THREE.Mesh(
      new THREE.BoxBufferGeometry(boxScale.x, boxScale.y, boxScale.z),
      new THREE.MeshPhongMaterial({
        color: 0xff0000,
      })
    );

    linkBox.position.set(x, y, z);
    linkBox.castShadow = true;
    linkBox.receiveShadow = true;
    objectsWithLinks.push(linkBox.uuid);

    addRigidPhysics(linkBox, boxScale);
  }
  


  function winClick(){
    window.onload = function(){
      document.addEventListener('click', launchClickPosition);
    setTimeout(() => {
      document.addEventListener('mousemove', launchHover);
    }, 1000);
    }
  }

     //将物理添加到具有比例的网格的常规函数
    function addRigidPhysics(item, itemScale) {
      let pos = { x: item.position.x, y: item.position.y, z: item.position.z };
      let scale = { x: itemScale.x, y: itemScale.y, z: itemScale.z };
      let quat = { x: 0, y: 0, z: 0, w: 1 };
      let mass = 0;
      var transform = new Ammo.btTransform();
      transform.setIdentity();
      transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
      transform.setRotation(
        new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w)
      );

      var localInertia = new Ammo.btVector3(0, 0, 0);
      var motionState = new Ammo.btDefaultMotionState(transform);
      let colShape = new Ammo.btBoxShape(
        new Ammo.btVector3(scale.x * 0.5, scale.y * 0.5, scale.z * 0.5)
      );
      colShape.setMargin(0.05);
      colShape.calculateLocalInertia(mass, localInertia);
      let rbInfo = new Ammo.btRigidBodyConstructionInfo(
        mass,
        motionState,
        colShape,
        localInertia
      );
      let body = new Ammo.btRigidBody(rbInfo);
      body.setActivationState(STATE.DISABLE_DEACTIVATION);
      body.setCollisionFlags(2);
      physicsWorld.addRigidBody(body);
    }

    function updatePhysics(deltaTime) {
      // Step world
      physicsWorld.stepSimulation(deltaTime, 10);
  
      // Update rigid bodies
      for (let i = 0; i < rigidBodies.length; i++) {
        let objThree = rigidBodies[i];
        let objAmmo = objThree.userData.physicsBody;
        let ms = objAmmo.getMotionState();
        if (ms) {
          ms.getWorldTransform(tmpTrans);
          let p = tmpTrans.getOrigin();
          let q = tmpTrans.getRotation();
          objThree.position.set(p.x(), p.y(), p.z());
          objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());
        }
      }

    }

    function renderFrame() {

      let deltaTime = clock.getDelta();
      moveBall(); //移动球
      updatePhysics(deltaTime);
      // 告诉浏览器有动画，在下次重新绘制之前更新
      requestAnimationFrame(renderFrame);
    }

  
    //initialize world 
    function start() {
      
      createPhysicsWorld();
      createDropBox();
      createGridPlane(); //地面
      createBall(); //球ball
      createBeachBall(); //求

      //围墙
    createWallX(87.5, 1.75, 0);
    createWallX(-87.5, 1.75, 0);
    createWallZ(0, 1.75, 87.5);
    createWallZ(0, 1.75, -87.5);
   //看板
    createBillboard(
      -80,
      2.5,
      -70,
      'images/terpSolutions.png',
      'https://github.com/naiop',
      Math.PI * 0.22
    );
    createBillboard(
      -45,
      2.5,
      -78,
      'images/bulletin.png',
      'https://camo.githubusercontent.com/8baab1ab51177df75eeb87a382814bde24266d0ee1c5ff2055f0075d49437737/68747470733a2f2f6769746875622d726561646d652d73746174732e76657263656c2e6170702f6170693f757365726e616d653d6e61696f7026686964655f7469746c653d7472756526686964655f626f726465723d747275652673686f775f69636f6e733d7472756526696e636c7564655f616c6c5f636f6d6d6974733d74727565266c696e655f6865696768743d32312662675f636f6c6f723d302c4543364336432c4646443437392c4646464337392c373346413739267468656d653d677261797768697465266c6f63616c653d636e',
      Math.PI * 0.17
    );
    createBillboard(
      -17,
      1.25,
      -75,
      'images/terpSolutions1.png',
      'https://camo.githubusercontent.com/8baab1ab51177df75eeb87a382814bde24266d0ee1c5ff2055f0075d49437737/68747470733a2f2f6769746875622d726561646d652d73746174732e76657263656c2e6170702f6170693f757365726e616d653d6e61696f7026686964655f7469746c653d7472756526686964655f626f726465723d747275652673686f775f69636f6e733d7472756526696e636c7564655f616c6c5f636f6d6d6974733d74727565266c696e655f6865696768743d32312662675f636f6c6f723d302c4543364336432c4646443437392c4646464337392c373346413739267468656d653d677261797768697465266c6f63616c653d636e',
      Math.PI * 0.15
    );

    createBox(
      12,
      2,
      -70,
      4,
      4,
      1,
      'images/terpSolutions.png',
      'https://github.com/naiop',
     0x000000,
      true
    );

      wallOfBricks(); //砖墙
      simpleText(-50, 0.01, -5, 'SKILLS', 3);// 字体
      floatingLabel(11.875, 4.5, -70, 'Github'); // 字体
      allSkillsSection(-50, 0.025, 20, 40, 40, 'images/imgFont.png'); //字体
      createTextOnPlane(-70, 0.01, -48, 'images/imgFont.png', 20, 40);  //字体
      loadText(); //字体
      ryanFloydWords(11.2, 1, -20); //loadText(); //字体 //ammo
      winClick();
      setupEventHandlers();
      renderFrame();
    }
  
    start();
  });

}



 //将需要初始化的放在该方法中统一初始化
 function initMain(){
  initScene();//初始化场景
  initCamera();//初始化相机
  initRenender();//初始化渲染器
  initLight();//初始化光线
  initOthers();//初始化其他参数addArea
  ininControl(); //初始化控制
  onWindowResize(); //窗体的设置
  initGUI();  //GUI
  initStats() //Stats
  initTHREEHelper(); //THREE 辅助工具
  skybox(); //天空盒
 // Panel(); //地面
  STLModel(); //STL 模型
  outlineSelect(); // 模型轮廓
  Box(); // 货物
  Geometrycar(); //车
  addArea(0, 0, 20, 10, scene, "ID1$库区1号", "FF0000", 0.5); //库区域
  //snowflake(); //雪花
  initEcharts(); //echarts
  //setEventsMouse(); //鼠标事件
  }

 //初始化场景
 function initScene(){
  scene = new THREE.Scene();//创建场景
  scene.background = new THREE.Color(0xcce0ff);
  scene.fog = new THREE.Fog(scene.background, 1, 5000);
  }

  //初始化相机
  function  initCamera(){
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 5000);//创建相机对象
    camera.position.set(5, 3, 20);//设置相机位置
    camera.lookAt(scene.position); //设置相机方向(指向的场景对象)
  }

  //初始化光线
  function initLight() {
    // light = new THREE.Light(0xffffff, 1.0);
    // scene.add(light); //光线加入场景中

    // LIGHTS HemisphereLight

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.4);
    hemiLight.color.setHSL(0.6, 1, 0.6);
    hemiLight.groundColor.setHSL(0.095, 1, 0.75);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight); //光线加入场景中

    const hemiLightHelper = new THREE.HemisphereLightHelper(hemiLight, 10);
    scene.add(hemiLightHelper);

    //LIGHTS DirectionalLight

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.color.setHSL(0.1, 1, 0.95);
    dirLight.position.set(-1, 1.75, 1);
    dirLight.position.multiplyScalar(30);
    scene.add(dirLight); //光线加入场景中

    dirLight.castShadow = true;

    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;

    const d = 50;

    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;

    dirLight.shadow.camera.far = 15000;
    dirLight.shadow.bias = -0.0001;

    const dirLightHelper = new THREE.DirectionalLightHelper(dirLight, 10);
    scene.add(dirLightHelper);
    
  }

//初始化渲染器 ——指定容器
function initRenender() {

  renderer = new THREE.WebGLRenderer();  //创建渲染器
  renderer.shadowMap.enabled = true; //倒影阴影贴图
  //renderer.setClearColor(0xb9d3ff, 1); //设置背景颜色
  renderer.setPixelRatio(window.devicePixelRatio); //接口返回当前显示设备 的物理像素分辨率与CSS 像素分辨率  //高清
  renderer.setSize(window.innerWidth, window.innerHeight);
}


//其他内容初始化
function initOthers() {
  document.body.appendChild(renderer.domElement); //渲染到浏览器
}

// 天空盒子
  function skybox() {
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

  // 控制
  function ininControl(){
    controls = new OrbitControls(camera, renderer.domElement);//创建控件对象
    // controls.minDistance = 5;
    // controls.maxDistance = 20;
    // controls.maxPolarAngle = Math.PI * 0.4; //最大角度 地平面与camera
    // controls.enablePan = true;
    // controls.enableDamping = true;
    // controls.dampingFactor = 0.05;

  }

  //定义窗口的设置
  function onWindowResize() {
    //加入事件监听器,窗口自适应
			window.addEventListener('resize', function(){
			  var width = window.innerWidth;
			  var height = window.innerHeight;
			  renderer.setSize(width,height);
			  camera.aspect = width/height;
			  camera.updateProjectionMatrix();

        effectFXAA.uniforms[ 'resolution' ].value.set( 1 / window.innerWidth, 1 / window.innerHeight ); //effectFXAA
			});

      
  }

  //定义鼠标事件
  function setEventsMouse() {
    //点击了鼠标左键
    window.addEventListener("click", function (e) {
      if (e.button === 0) {
        console.log("点击了鼠标左键");
      }
    });

    //点击了鼠标右键
    window.addEventListener("contextmenu", function (e) {
      if (e.button === 2) {
        console.log("点击了鼠标右键");
      }
    });

    //鼠标移动坐标2D坐标
    window.addEventListener("mousemove", function (e) {
      console.log("x:" + e.x);
      console.log("y:" + e.y);
    });

    //定义键盘按键事件
    window.addEventListener('keydown', function (e) {
      console.log(e);
    });
  }


function setKeyEvents() {
  window.addEventListener('keydown', function (e) {
    console.log(e);
  });
}

function initTHREEHelper() {
  const axes = new THREE.AxesHelper(50); // 辅助三维坐标系 ,添加到scene即可
  scene.add(axes);

}
//GUI
function initGUI() {
  const gui = new GUI({ width: 300 });
  gui.add(GUIparams, "Rotate");
  gui.add(GUIparams, "UsePatternTexture").onChange(function (value) {
    outlinePass.usePatternTexture = value;
  });
  gui.add(GUIparams, "MeshName").name("选中的物体名:").listen();
  gui.add( GUIparams, 'BoxNum', 88, 8888 ).onChange( function ( value ) {

    GUIparams.BoxNum = Number( value ); //test

  } );
}
//性能插件stats
function initStats(){
  let container  = document.createElement("div");
  document.body.appendChild(container);
  stats = new Stats();
  container.appendChild(stats.dom);
}

  //地面
  function Panel() {
    const geometry = new THREE.PlaneGeometry(50, 50);
    const material = new THREE.MeshLambertMaterial({ color: 0xffffff });
    material.color.setHSL(0.095, 1, 0.75);

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = 0;
    mesh.rotation.x -= Math.PI * 0.5;
    mesh.receiveShadow = true;
    mesh.name = "地板"; // mesh 命名
    scene.add(mesh); //网格模型添加到场景中
  }

  //STL 模型
  function STLModel() {
    const loader1 = new STLLoader();
    const Path1 = "models/lj.stl";
    loader1.load(Path1, function (geometry) {
      var material = new THREE.MeshPhongMaterial({
        color: "#69f",
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(0, 0, 0); // yzx
      mesh.rotation.set(-Math.PI / 2, 0, 0);
      mesh.scale.set(0.001, 0.001, 0.001);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.name = "货架";
      scene.add(mesh); //网格模型添加到场景中
    });
  }

  //rack box
  function Box() {
    const cubeGeo = new THREE.BoxBufferGeometry(0.5, 0.3, 0.5);
    const cubeMaterial = new THREE.MeshLambertMaterial({
      color: 0xfeb74c,
      map: new THREE.TextureLoader().load("images/box.png"),
    });
    const voxel = new THREE.Mesh(cubeGeo, cubeMaterial);
    voxel.position.set(-1.65, 1.2, 0);
    voxel.name = "货物$1";
    scene.add(voxel);

    const voxel2 = voxel.clone();
    voxel2.position.set(-1.1, 0.4, 0);
    voxel2.name = "货物$2";
    scene.add(voxel2);

    const voxel3 = voxel.clone();
    voxel3.position.set(-0.55, 0.4, 0);
    voxel3.name = "货物$3";
    scene.add(voxel3);

    const voxel4 = voxel.clone();
    voxel4.position.set(0, 1.2, 0);
    voxel4.name = "货物$4";
    scene.add(voxel4);

    const voxel5 = voxel.clone();
    voxel5.position.set(0.55, 2, 0);
    voxel5.name = "货物$5";
    scene.add(voxel5);

    const voxel6 = voxel.clone();
    voxel6.position.set(1.1, 0.4, 0);
    voxel6.name = "货物$6";
    scene.add(voxel6);

    const voxel7 = voxel.clone();
    voxel7.position.set(1.65, 2.0, 0);
    voxel7.name = "货物$7";
    scene.add(voxel7);

    ////
    const voxel11 = voxel.clone();
    voxel11.position.set(-1.65, 2.8, 0);
    voxel11.name = "货物$8";
    scene.add(voxel11);

    const voxel12 = voxel.clone();
    voxel12.position.set(-1.1, 1.6, 0);
    voxel12.name = "货物$9";
    scene.add(voxel12);

    const voxel13 = voxel.clone();
    voxel13.position.set(-1.1, 2.8, 0);
    voxel13.name = "货物$10";
    scene.add(voxel13);

    const voxel14 = voxel.clone();
    voxel14.position.set(0, 0.8, 0);
    voxel14.name = "货物$11";
    scene.add(voxel14);

    const voxel15 = voxel.clone();
    voxel15.position.set(0.55, 2.8, 0);
    voxel15.name = "货物$12";
    scene.add(voxel15);

    const voxel16 = voxel.clone();
    voxel16.position.set(1.1, 2.8, 0);
    voxel16.name = "货物$13";
    scene.add(voxel16);

    const voxel17 = voxel.clone();
    voxel17.position.set(1.65, 0.8, 0);
    voxel17.name = "货物$14";
    scene.add(voxel17);
  }

  //  模型轮廓
  function outlineSelect() {
    composer = new EffectComposer(renderer);

    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    outlinePass = new OutlinePass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      scene,
      camera
    );

    const textureLoader = new THREE.TextureLoader(); 
    textureLoader.load("images/tri_pattern.jpg", function (texture) {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      outlinePass.patternTexture = texture;// 图案纹理
    });

    outlinePass.edgeStrength = Number( 5 );//边缘长度
    outlinePass.edgeThickness = Number( 3.6 );//边缘厚度 值越小越明显
    outlinePass.pulsePeriod = Number( 2.9 ); //一闪一闪周期
    outlinePass.visibleEdgeColor.set( "#ffff00" );//没有被遮挡的outline的颜色
    outlinePass.hiddenEdgeColor.set( 0xff0000 );//被遮挡的outline的颜色
  composer.addPass(outlinePass);

    effectFXAA = new ShaderPass(FXAAShader);
    effectFXAA.uniforms["resolution"].value.set(
      1 / window.innerWidth,
      1 / window.innerHeight
    );
    composer.addPass(effectFXAA);

    window.addEventListener("click", onMouseClick);

    renderer.domElement.style.touchAction = "none";
    renderer.domElement.addEventListener("pointermove", onPointerMove);

     //鼠标事件
    function onPointerMove(event) {
      if (event.isPrimary === false) return;
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      checkIntersection();
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
        outlinePass.selectedObjects = selectedObjects; //使用outlinePass 的mesh对象，以数组的形式传入
        GUIparams.MeshName = intersects[0].object.name.split("$");
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
      
      raycaster.setFromCamera(mouse, camera);// raycaster 选择物体
      const intersects = raycaster.intersectObjects([scene], true);
      if (intersects.length > 0) {
        //给选中的线条和物体加发光特效
        const SelectedObject = intersects[0].object;

        selectedObjects = [];
        selectedObjects.push(SelectedObject);
        outlinePass.selectedObjects = selectedObjects;

        let Name = intersects[0].object.name.split("$");
        GUIparams.MeshName = Name;
      } else {
        // outlinePass.selectedObjects = [];
      }
    }
  }

  //Geometry Car
  function Geometrycar() {
    
    const m = new THREE.MeshNormalMaterial();//公共的材质
    car = new THREE.Group(); //car 整个汽车 group
    frontWheels = new THREE.Group();//两面两个轮子 frontWheels - group
    const wheel1 = new THREE.Group(); //轮子1 wheel1 - group

    const wheelG = new THREE.TorusGeometry(0.5, 0.1, 10, 20);
    const wheel1Mesh = new THREE.Mesh(wheelG, m);

    const n = 10;
    for (let i = 0; i < n; i++) {
      const g = new THREE.CylinderGeometry(0.03, 0.03, 1);
      const mesh = new THREE.Mesh(g, m);
      mesh.rotation.z = ((Math.PI * 2) / n) * i;
      wheel1.add(mesh);
    }
    wheel1.add(wheel1Mesh);
    //车轴1
    const len = 2.4;
    const cylinderG = new THREE.CylinderGeometry(0.05, 0.05, len);
    const cylinder = new THREE.Mesh(cylinderG, m);
    cylinder.rotation.x = -0.5 * Math.PI;

    wheel1.position.z = -len / 2;

    //轮子2 wheel2
    const wheel2 = wheel1.clone();
    wheel2.position.z = len / 2;

    frontWheels.add(wheel1, cylinder, wheel2);
    frontWheels.rotation.y = 0.5 * Math.PI;
    frontWheels.position.y = 0.5;
    frontWheels.position.x = 0;
    frontWheels.position.z = 1;

    //后面的两个轮子 backWheels
    backWheels = frontWheels.clone();
    backWheels.position.y = 0.5 * Math.PI;
    backWheels.position.y = 0.5;
    backWheels.position.x = 0;
    backWheels.position.z = -1;

    //车身 body group
    const body = new THREE.Group();
    //车板
    const cubeG = new THREE.BoxGeometry(2, 0.5, 4);
    const cube = new THREE.Mesh(cubeG, m);
    cube.position.y = 0.8;
    //车

    const carX = new THREE.Group();
    const roofG = new THREE.BoxGeometry(0.2, 0.5, 2.5);
    const roof = new THREE.Mesh(roofG, m);
    roof.position.y = 1.2;
    roof.position.x = -0.9;
    roof.position.z = -0.6;
    const roof2 = roof.clone();
    roof2.position.y = 1.2;
    roof2.position.x = 0.9;
    roof2.position.z = -0.6;
    const roofH = new THREE.BoxGeometry(2, 0.5, 0.2);
    const roof3 = new THREE.Mesh(roofH, m);
    roof3.position.y = 1.2;
    roof3.position.x = 0;
    roof3.position.z = -1.9;
    const roofx = new THREE.CylinderGeometry(
      1,
      1,
      2,
      3,
      2,
      false,
      Math.PI * 2,
      Math.PI
    );
    const roof4 = new THREE.Mesh(roofx, m);
    roof4.position.y = 1;
    roof4.position.z = 1;
    roof4.rotation.z = Math.PI / 2;
    carX.add(roof, roof2, roof3, roof4);

    body.add(cube, carX, frontWheels, backWheels);

    car.add(body); // 添加载货
    scene.add(car);
    car.scale.set(0.4, 0.4, 0.4); //设置大小为原来的1.5倍

    //自定义路径类
    class myPath {
      constructor(array) {
       // console.log(array);
        //将传进来的数组转换为Vec3集合
        let pointsArr = [];
        if (array.length % 3 !== 0) {
          //console.error("错误，数据的个数非3的整数倍！", array);
          return null;
        }
        for (let index = 0; index < array.length; index += 3) {
          pointsArr.push(
            new THREE.Vector3(array[index], array[index + 1], array[index + 2])
          );
        }

        //顶点位置三维向量数组
        this.pointsArr = pointsArr;

        //折线几何体
        this.line = null;
        {
          let lineMaterial = new THREE.LineBasicMaterial({
            color: 0xff00ff,
          });
          let lineGeometry = new THREE.BufferGeometry().setFromPoints(
            pointsArr
          );
          this.line = new THREE.Line(lineGeometry, lineMaterial);
        }

        //锚点几何体
        this.points = null;
        {
          let pointsBufferGeometry = new THREE.BufferGeometry();
          pointsBufferGeometry.setAttribute(
            "position",
            new THREE.Float32BufferAttribute(array, 3)
          );
          let pointsMaterial = new THREE.PointsMaterial({
            color: 0xffff00,
            size: 0.5,
          });
          this.points = new THREE.Points(pointsBufferGeometry, pointsMaterial);
        }

        //计算每个锚点在整条折线上所占的百分比
        this.pointPercentArr = [];
        {
          let distanceArr = []; //每段距离
          let sumDistance = 0; //总距离
          for (let index = 0; index < pointsArr.length - 1; index++) {
            distanceArr.push(pointsArr[index].distanceTo(pointsArr[index + 1]));
          }
          sumDistance = distanceArr.reduce(function (tmp, item) {
            return tmp + item;
          });

          let disPerSumArr = [0];
          disPerSumArr.push(distanceArr[0]);
          distanceArr.reduce(function (tmp, item) {
            disPerSumArr.push(tmp + item);
            return tmp + item;
          });

          disPerSumArr.forEach((value, index) => {
            disPerSumArr[index] = value / sumDistance;
          });
          this.pointPercentArr = disPerSumArr;
        }
        // console.log(this.pointPercentArr);

        //上一次的朝向
        this.preUp = new THREE.Vector3(0, 10, 0);

        //run函数需要的数据
        this.perce = 0; //控制当前位置占整条线百分比
        this.speed = 0.0005; //控制是否运动
        this.turnFactor = 0; //暂停时间因子
        this.turnSpeedFactor = 0.001; //转向速度因子
        this.obj = null;

        this.preTime = new Date().getTime();
        this.firstTurn = false;
      }

      //获取点，是否转弯，朝向等
      getPoint(percent) {
        //console.log("ddddd" + percent);
        let indexP = 0;
        let indexN = 0;
        let turn = false;

        for (let i = 0; i < this.pointPercentArr.length; i++) {
          if (
            percent >= this.pointPercentArr[i] &&
            percent < this.pointPercentArr[i + 1]
          ) {
            indexN = i + 1;
            indexP = i;
            if (percent === this.pointPercentArr[i]) {
              turn = true;
            }
          }
        }

        let factor =
          (percent - this.pointPercentArr[indexP]) /
          (this.pointPercentArr[indexN] - this.pointPercentArr[indexP]);
        let position = new THREE.Vector3();
        position.lerpVectors(
          this.pointsArr[indexP],
          this.pointsArr[indexN],
          factor
        ); //position的计算完全正确

        //计算朝向
        let up = new THREE.Vector3().subVectors(
          this.pointsArr[indexN],
          this.pointsArr[indexP]
        );
        // console.log(this.preUp)
        let preUp = this.preUp;
        if (
          this.preUp.x != up.x ||
          this.preUp.y != up.y ||
          this.preUp.z != up.z
        ) {
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
        } else if (animata) {
          //console.log(this.obj);
          //转弯时
          if (this.obj && this.obj.turn) {
            if (this.turnFactor == 0) {
              this.preTime = new Date().getTime();
              this.turnFactor += 0.000000001;
            } else {
              let nowTime = new Date().getTime();
              let timePass = nowTime - this.preTime;
              this.preTime = nowTime;

              this.turnFactor += this.turnSpeedFactor * timePass;
            }

            // console.log( "--->>> 当前需要turn , turnFactor值为 :",this.turnFactor);
            if (this.turnFactor > 1) {
              this.turnFactor = 0;
              this.perce += this.speed;

              this.obj = this.getPoint(this.perce);
            } else {
              //修改朝向 (向量线性插值方式)
              let interDirec = new THREE.Vector3();
              interDirec.lerpVectors(
                this.obj.preUp,
                this.obj.direction,
                this.turnFactor
              );

              let look = new THREE.Vector3();
              look = look.add(this.obj.position);
              look = look.add(interDirec);

              //cone.lookAt(look);
              camera.lookAt(look); //相机漫游1
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

    CarPathLine = new myPath([
      0, 0, 0, 10, 0, 0, 10, 0, 5, -10, 0, 5, -10, 0, 0, 10, 0, 0,
    ]);

    scene.add(CarPathLine.points);
    scene.add(CarPathLine.line);

  }

  // Area  addArea(0, 0, 20, 10, group, "ID1$库区1号", "FF0000", 0.5); //区域
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

  //snowflake 雪花
  function snowflake() {
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
      depthTest: false,
    });
    for (let i = 0; i < 1500; i++) {
      let vertice = new THREE.Vector3(
        Math.random() * range - range / 2,
        Math.random() * range * 1.5,
        Math.random() * range - range / 2
      );
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
  }

  //图表
  function initEcharts() {
    var pieChart = echarts.init(document.createElement("canvas")); //创建 canvas 初始化 echarts

    var option = {
      color: ["#3398DB"],
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow",
        },
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "3%",
        containLabel: true,
      },
      xAxis: [
        {
          type: "category",
          data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
          axisTick: {
            alignWithLabel: true,
          },
        },
      ],
      yAxis: [
        {
          type: "value",
        },
      ],
      series: [
        {
          name: "直接访问",
          type: "bar",
          barWidth: "60%",
          data: [100, 52, 200, 334, 67, 330, 220],
        },
      ],
    };
    pieChart.setOption(option);

    pieChart.on("finished", function () {
      var infoEchart = new THREE.TextureLoader().load(pieChart.getDataURL());

      var infoEchartMaterial = new THREE.MeshBasicMaterial({
        transparent: true,
        map: infoEchart,
        side: THREE.DoubleSide,
      });

      var echartPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(5, 3),
        infoEchartMaterial
      );
      echartPlane.position.set(0, 5, 0);
      scene.add(echartPlane);
    });
  }


  // 动画
function animate() {
  
  stats.begin(); //Stats 开始检测
  const elapsedTime = clock.getElapsedTime()
  const deltaTime = elapsedTime - lastElapsedTime
  lastElapsedTime = elapsedTime

  // Update controls
  controls.update()

  // Render 渲染
  renderer.render(scene, camera)

  // 顶点变动之后需要更新，否则无法实现落雪特效
  // points.geometry.verticesNeedUpdate = true;
  // let vertices = points.geometry.vertices;// 雪花动画更新
  // vertices.forEach(function (v) {
  //   v.y = v.y - (v.velocityY);
  //   v.x = v.x - (v.velocityX);
  //   if (v.y <= 0) v.y = 60;
  //   if (v.x <= -20 || v.x >= 20) v.velocityX = v.velocityX * -1;
  // });

  //car 
  frontWheels.rotation.x = elapsedTime
  backWheels.rotation.x = elapsedTime
  CarPathLine.run(carAnimata, car, carEndFlag);
  if (CarPathLine.perce >= 1) {   //路程循环
    CarPathLine.perce = 0;
  }

  //要把所有mesh 添加到组  再旋转动画
  //console.log(GUIparams.Rotate);
  if (GUIparams.Rotate) {
    camera.rotation.y = elapsedTime * 0.0001;
  }


  composer.render(); // 射线类Raycaster 选择物体渲染

  stats.end(); //Stats 结束检测

  requestAnimationFrame( animate ); // Call tick again on the next frame
}
