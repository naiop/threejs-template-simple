import util from '../../utils/util';
import { GUI } from "three/examples/jsm/libs/dat.gui.module.js";  // GUI



const GUIparams = {
    MeshName: "name", //name
    Rotate: false, //旋转
    UsePatternTexture: false, //Raycaster 贴图
    BoxNum: 888
  };


const gui = new GUI({ width: 300 });
gui.add(GUIparams, "Rotate");
gui.add(GUIparams, "UsePatternTexture").onChange(function (value) {
  outlinePass.usePatternTexture = value;
});
gui.add(GUIparams, "MeshName").name("选中的物体名:").listen();
gui.add( GUIparams, 'BoxNum', 88, 8888 ).onChange( function ( value ) {

  GUIparams.BoxNum = Number( value ); //test

} );

