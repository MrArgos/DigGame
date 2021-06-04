document.addEventListener('DOMContentLoaded', Start);

var cena = new THREE.Scene();
var camara = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
var renderer = new THREE.WebGLRenderer({ alpha: true});
renderer.setSize(window.innerWidth - 15, window.innerHeight - 15);
renderer.setClearColor( 0xffffff, 1);
document.body.appendChild(renderer.domElement);
var geometria = new THREE.BoxGeometry(1,1,1);
var material = new THREE.MeshStandardMaterial({color : 0xff0000});
var cubo = new THREE.Mesh(geometria, material);
var cuboCoordRotation;
var camaraCoord;
var velocidadeAndar = 0.05;

var objetoImportado;
var mixerAnimacao;
var relogio = new THREE.Clock();
var importer = new THREE.FBXLoader();
var luzObjeto;
var rowSize = 8;
var depthSize = 8;
var maxCubes = 21;
var cubos = new THREE.Object3D();

importer.load('./Objetos/Samba Dancing.fbx', function (object) {

    mixerAnimacao = new THREE.AnimationMixer(object);
    var action = mixerAnimacao.clipAction(object.animations[0]);
    action.play();

    object.traverse(function (child) {
        if (child.isMesh) {
            child.castShadow = true;
            child.recieveShadow = true;
        }
    });

    cena.add(object);

    object.scale.x = 0.005;
    object.scale.z = 0.005;
    object.scale.y = 0.005;

    object.position.z = 0.5;
    object.position.y = -0.5;

    objetoImportado = object;
});

document.addEventListener('mousemove', ev =>{
    var x = (ev.clientX - 0) / (window.innerWidth - 0) * (1 - (-1)) + -1;
    var y = (ev.clientY - 0) / (window.innerHeight -0) * (1 - (-1)) + -1;

    camaraCoord = {x:x, y:y};
    cuboCoordRotation = {x:x, y:y};
});

document.addEventListener('keydown', ev =>{
    
    // Desafio 1 - translate do objetoImportado quando for premida uma tecla
    if (ev.keyCode == 87)
    {
        objetoImportado.translateY(1);
        camara.translateY(1);
    }
    if (ev.keyCode == 83)
    {    objetoImportado.translateY(-1);
        camara.translateY(-1);
    }

    if (ev.keyCode == 65)
    {
    objetoImportado.translateX(-1);
    camara.translateX(-1);
    }

    if (ev.keyCode == 68)
    { 
        objetoImportado.translateX(1);
        camara.translateX(1);
    }

    if (ev.keyCode == 32)
        criarNovoCubo();

});

function Start() {
    cena.add(cubo);
    //camara.position.y = 0.5;
    camara.position.z = 2;


    // SpotLight
    var light = new THREE.SpotLight('#ffffff', 1);
    light.position.x = 5;
    light.position.y = 4;
    light.position.z = 10;
    //light.lookAt(cubo.position);
    //cena.add(light);
    luzObjeto = light;

    // AmbientLight
    var ambLigth = new THREE.AmbientLight(0xffffff, 0.5);
    cena.add(ambLigth);

    // Gerar cubos (chao)
    generateCubes(0);
    cena.add(cubos);

    requestAnimationFrame(update);
}

function update() {
    
    if (cuboCoordRotation != null) {
        cubo.rotation.x += cuboCoordRotation.y * 0.1;
        cubo.rotation.y += cuboCoordRotation.x * 0.1;
    }

    if (camaraCoord != null) {
        camara.position.x += camaraCoord.x * 0.1;
        camara.position.y -= camaraCoord.y * 0.1;
    }

    if (mixerAnimacao) {
        mixerAnimacao.update(relogio.getDelta());
    }

    // Desafio 3 - apontar luz para objeto
    if(objetoImportado != null)
    {
        objetoImportado.add(luzObjeto);
        //luzObjeto.lookAt(objetoImportado.position);
    }

    renderer.render(cena, camara);
    requestAnimationFrame(update);
}

function criarNovoCubo() {
    var novaCor = new THREE.Color(0xffffff);
    novaCor.setHex(Math.random() * 0xffffff);
    var novoMat = new THREE.MeshBasicMaterial({color : novaCor});
    var novoCubo = new THREE.Mesh(geometria, novoMat);
    novoCubo.translateX(THREE.Math.randFloat(-6,6));
    novoCubo.translateY(THREE.Math.randFloat(-6,6));
    novoCubo.translateZ(THREE.Math.randFloat(-10,3));
    cena.add(novoCubo);
}

function generateCubes(i) {
    var cor = new THREE.Color(0xffffff);
    cor.setHex(Math.random() * 0xffffff);
    var mat = new THREE.MeshStandardMaterial({color: cor});
    var novoCubo = new THREE.Mesh(geometria, mat);
    novoCubo.position.x = (i % rowSize) - (rowSize / 2);
    var rem = i;
    var yPos = 0;
    do {
        rem = rem - rowSize;
        yPos++;
    } while (rem >= 0)
    novoCubo.position.y = - yPos;
    cubos.add(novoCubo);
    if ( i < (rowSize * depthSize) - 1)
    {
        generateCubes(++i);
    }  
}