import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'


var scene;
var bool = false;

initView();

function initView() {

    const canvas = document.querySelector('#c'); //对应html ID为c的 canvas
    const renderer = new THREE.WebGLRenderer({
        canvas
    }); //传入canvas


    //Camera 相机视觉
    const camera = new THREE.PerspectiveCamera(75, 2, 0.1, 100); //(视野范围,画布的宽高比默认2 ，近平面 ，远平面)
    camera.position.set(8, 16, 25)
    camera.lookAt(0, 0, 0)


    // Scene 场景-
    scene = new THREE.Scene(); //场景
    scene.background = new THREE.Color(0xcce0ff); //背景颜色


    //将相机放在杆子上（将其作为对象）
    //这样我们就可以旋转杆以使摄像机在场景中移动  cameraPole.rotation.y = time * .1; //旋转相机
    const cameraPole = new THREE.Object3D();
    scene.add(cameraPole);
    cameraPole.add(camera);



    // OrbitControls 轨道控制  以便响应我们可能呈现的某些变化
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true; //感觉不那么生硬
    //controls.maxPolarAngle = Math.PI * 0.4;   //最大角度 地平面与camera
    controls.minDistance = 10; //最小拉距
    controls.maxDistance = 1000; //最大拉距视觉距离
    controls.target.set(0, 5, 0);
    controls.update();




    //坐标系辅助工具
    var axes = new THREE.AxesHelper(50);
    scene.add(axes);






    //lights 
    scene.add(new THREE.AmbientLight(0x666666));
    const light = new THREE.DirectionalLight(0xdfebff, 1);
    light.position.set(50, 200, 100); //光源位置
    light.position.multiplyScalar(1.3);
    light.castShadow = true;
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;
    const d = 300;
    light.shadow.camera.left = -d;
    light.shadow.camera.right = d;
    light.shadow.camera.top = d;
    light.shadow.camera.bottom = -d;
    light.shadow.camera.far = 1000;
    scene.add(light);

    //-------------------------------------------

    //公共的材质
    const m = new THREE.MeshNormalMaterial()


    //car 整个汽车 group
    const car = new THREE.Group()

    //两面两个轮子 frontWheels - group
    const frontWheels = new THREE.Group()
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
    const backWheels = frontWheels.clone()
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


    console.log(body)
    car.add(body) // 添加载货
    scene.add(car);

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




    let a = new myPath([
        0, 0, 0,
        25, 0, 0,
        25, 0, 25,
        0, 0, 25,
    ]);

    scene.add(a.points);
    scene.add(a.line);

    let startFlag = true;
    let endFlag = false;
    let toggleFlag = true;
    let runMesh = car;
    //-------------------------------------------



    //-------------------------------------------
    function render(time) {
        time *= 0.001; // 将时间转换为秒

        //resizeRendererToDisplaySize 判断调整渲染器画布宽高
        if (resizeRendererToDisplaySize(renderer)) {
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }
        if (bool) {
            cameraPole.rotation.y = time * 0.5; //旋转相机
        }
        //轮子
        frontWheels.rotation.x = time
        backWheels.rotation.x = time

        a.run(startFlag, runMesh, endFlag);
        // //路程循环
        if (a.perce >= 1) {
            a.perce = 0;
        }

        controls.update(); // controls感觉不那么生硬

        renderer.render(scene, camera); //最后将场景和摄像机传递给渲染器来渲染出整个场景。
        requestAnimationFrame(render);

    }

    requestAnimationFrame(render); // 回调函数之外在主进程中我们调用一次requestAnimationFrame来开始整个渲染循环。
}

//计算画布长宽高，返回需要是否需要调整大小，防止失真
function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
        renderer.setSize(width, height, false);
    }
    return needResize;
}