document.addEventListener('DOMContentLoaded', Start);

var cena = new THREE.Scene();
var camara = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true});
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
var heigthSize = 8;
var cubes = new THREE.Object3D();
var playerPosition = {x:0, y:-0.5};

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
    //object.position.y = -0.5;

    objetoImportado = object;
    objetoImportado.castShadow = true;
    //objetoImportado.add(camara);
});

document.addEventListener('mousemove', ev =>{
    var x = (ev.clientX - 0) / (window.innerWidth - 0) * (1 - (-1)) + -1;
    var y = (ev.clientY - 0) / (window.innerHeight -0) * (1 - (-1)) + -1;

    //camaraCoord = {x:x, y:y};
    cuboCoordRotation = {x:x, y:y};
});

document.addEventListener('keydown', ev =>{
    
    if (ev.keyCode == 87)
    {
        playerPosition.y++;
        camaraCoord.y++;
        //camara.position.y++;
    }
    if (ev.keyCode == 83)
    {    
        playerPosition.y--;
        camaraCoord.y--;
        // objetoImportado.translateY(-1);
        //camara.position.y--;
        // camara.position.lerp(new THREE.Vector3(camara.position.x, (camara.position.y - 1), camara.position.z), 0.1); 
    }

    if (ev.keyCode == 65)
    {
        playerPosition.x--;
        camaraCoord.x--;
        // objetoImportado.translateX(-1);
        //camara.position.x--;
    }

    if (ev.keyCode == 68)
    { 
        playerPosition.x++;
        camaraCoord.x++;
        // objetoImportado.translateX(1);
        //camara.position.x++;
    }

    if (ev.keyCode == 32)
        criarNovoCubo();

    console.log(playerPosition);
    console.log(camara.position);
    //console.log(luzObjeto);
});

function Start() {
    cena.add(cubo);
    camara.position.y = 0.2;
    camara.rotation.x = -0.1;
    camara.position.z = 2;
    camaraCoord = {x:camara.rotation.x, y:camara.position.y};


    // SpotLight
    luzObjeto = new THREE.SpotLight('#ffffff', 1);
    luzObjeto.position.x = 0;
    luzObjeto.position.y = 0;
    luzObjeto.position.z = 1.5;
    //luzObjeto = light;
    cena.add(luzObjeto);
    cena.add(luzObjeto.target);

    // AmbientLight
    var ambLigth = new THREE.AmbientLight(0xffffff, 0.5);
    cena.add(ambLigth);

    // Gerar cubos (chao)
    //generateCubes(0);
    generateCubes(cubes, rowSize, heigthSize);
    cena.add(cubes);
    for (let i = 0; i < cubes.children.length; i++) {
        console.log(cubes.children[i].name);
    }
    requestAnimationFrame(update);
}

function update() {
    
    if (cuboCoordRotation != null) {
        cubo.rotation.x += cuboCoordRotation.y * 0.1;
        cubo.rotation.y += cuboCoordRotation.x * 0.1;
    }

    // Rodar a camara com o rato ( para testar)
    // if (camaraCoord != null) {
    //     camara.position.x += camaraCoord.x * 0.1;
    //     camara.position.y -= camaraCoord.y * 0.1;
    // }

    if (mixerAnimacao) {
        mixerAnimacao.update(relogio.getDelta());
    }

    // Desafio 3 - apontar luz para objeto
    if(objetoImportado != null)
    {
        // objetoImportado.position.x = playerPosition.x;
        // objetoImportado.position.y = playerPosition.y;

        objetoImportado.position.lerp(new THREE.Vector3(playerPosition.x, playerPosition.y, objetoImportado.position.z), 0.04);
        luzObjeto.target.position.lerp(new THREE.Vector3(playerPosition.x, playerPosition.y, objetoImportado.position.z), 0.04);
        camara.position.lerp(new THREE.Vector3(camaraCoord.x, camaraCoord.y, camara.position.z), 0.06);
        //luzObjeto.target = objetoImportado;
    }

    luzObjeto.position.x = playerPosition.x;
    luzObjeto.position.y = playerPosition.y;
    // luzObjeto.target.position.x = playerPosition.x;
    // luzObjeto.target.position.y = playerPosition.y;
    //console.log(luzObjeto);

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

// function generateCubes(i) {
//     var cor = new THREE.Color(0xffffff);
//     cor.setHex(Math.random() * 0xffffff);
//     var mat = new THREE.MeshStandardMaterial({color: cor});
//     var novoCubo = new THREE.Mesh(geometria, mat);
//     novoCubo.position.x = (i % rowSize) - (rowSize / 2);
//     var rem = i;
//     var yPos = 0;
//     do {
//         rem = rem - rowSize;
//         yPos++;
//     } while (rem >= 0)
//     novoCubo.position.y = - yPos;
//     cubos.add(novoCubo);
//     if ( i < (rowSize * depthSize) - 1)
//     {
//         generateCubes(++i);
//     }  
// }

function generateCubes(parentObject, width, heigth) {
    var newColor = new THREE.Color(0xffffff);
    var newMat;
    var newCube;

    for (let i = -1; i >= (-heigth); i--) {
        for (let j = 0; j < width; j++) {
            newColor.setHex(Math.random() * 0xffffff);
            newMat = new THREE.MeshPhongMaterial({color: newColor});
            newCube = new THREE.Mesh(geometria, newMat);
            newCube.receiveShadow = true;
            newCube.position.x = j;
            newCube.position.y = i;
            newCube.name = j + ',' + i;
            parentObject.add(newCube);
        }
        
    }
}