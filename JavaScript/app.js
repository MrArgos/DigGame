document.addEventListener('DOMContentLoaded', Start);

var cena = new THREE.Scene();
var camaraPerspetiva;
var camaraOrtografica;
var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true});
renderer.setSize(window.innerWidth - 15, window.innerHeight - 15);
renderer.setClearColor( 0x202020 , 1);
document.body.appendChild(renderer.domElement);
var geometria = new THREE.BoxGeometry(1,1,1);
var material = new THREE.MeshPhongMaterial({color : 0xff0000});
var cubo = new THREE.Mesh(geometria, material);
var cuboCoordRotation;
var camaraCoord;
var velocidadeAndar = 0.05;
var activaCamaraPerspetiva = true;
var dirLight;


var objetoImportado;
var mixerAnimacao;
var relogio = new THREE.Clock();
var importer = new THREE.FBXLoader();
var followSpotLight;
var rowSize = 16;
var heigthSize = 8;
var cubes = new THREE.Object3D();
var robotBody = new THREE.Object3D();
var initialPos = {x:(rowSize/2), y:0};
var playerPosition = {x:initialPos.x, y:initialPos.y};
var laserDir = -1;
var laserPosition;
var score = 0;

var textureLoader = new THREE.TextureLoader();
var dirt1Texture = textureLoader.load("Textures/TextureGround2.jpg");
var dirt1BumpMap = textureLoader.load("Textures/TextureGround2Normal.jpg");

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

    //cena.add(object);

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
    
    // if (ev.keyCode == 87) // W
    // {
    //     playerPosition.y++;
    //     camaraCoord.y++;
    // }
    if (ev.keyCode == 83) // S
    {    
        moveDown();
    }

    if (ev.keyCode == 65) // A
    {
        moveLeft();
    }

    if (ev.keyCode == 68) // D
    { 
        moveRight();
    }

    if (ev.keyCode == 67) // C
    { 
        activaCamaraPerspetiva = !activaCamaraPerspetiva;
    }

    if (ev.keyCode == 76) // L
    {
        dirLight.visible = !dirLight.visible;
        followSpotLight.visible = !followSpotLight.visible;
    }

    if (ev.keyCode == 32) // Espaço
    {
        destroyBlock();
    } 

    if (ev.keyCode == 37) // left arrow
    {
        moveLaserLeft();
    } 

    if (ev.keyCode == 39) // right arrow
    {
        moveLaserRight();
    } 

});

function Start() {
    var mult = 80;
    camaraPerspetiva = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    camaraOrtografica = new THREE.OrthographicCamera( window.innerWidth / (- 2 * mult), window.innerWidth / (2* mult), 
        window.innerHeight / (2 * mult), window.innerHeight / (- 2 * mult), 1, 5 );
    
    camaraPerspetiva.position.x = initialPos.x;
    camaraPerspetiva.position.y = initialPos.y;
    camaraPerspetiva.rotation.x = -0.1;
    camaraPerspetiva.position.z = 2;
    camaraCoord = {x:camaraPerspetiva.position.x, y:camaraPerspetiva.position.y};

    camaraOrtografica.position.y = -heigthSize / 2;
    camaraOrtografica.position.x = rowSize / 2 - 0.5;
    camaraOrtografica.position.z = 2;

    // SpotLight que segue o robot
    followSpotLight = new THREE.SpotLight('#909040', 0.8);
    followSpotLight.position.x = initialPos.x;
    followSpotLight.position.y = initialPos.y;
    followSpotLight.position.z = 1.5;
    followSpotLight.target.position.x = initialPos.x;
    followSpotLight.target.position.y = initialPos.y;
    followSpotLight.castShadow = true;
    cena.add(followSpotLight);
    cena.add(followSpotLight.target);

    // Directional Light
    dirLight = new THREE.DirectionalLight(0x909040, 0.8);
    dirLight.castShadow = true;
    dirLight.position.set(0,2,3);
    cena.add(dirLight);
    dirLight.visible = false;

    // Gerar cubos (chao)
    generateCubes();
    cena.add(cubes);
    for (let i = 0; i < cubes.children.length; i++) {
        //console.log(cubes.children[i].name);
    }

    buildRobot();
    requestAnimationFrame(update);
}

function update() {
    
    if (cuboCoordRotation != null) {
        cubo.rotation.x += cuboCoordRotation.y * 0.1;
        cubo.rotation.y += cuboCoordRotation.x * 0.1;
    }

    if (mixerAnimacao) {
        mixerAnimacao.update(relogio.getDelta());
    }

    if(robotBody != null)
    {
        robotBody.position.lerp(new THREE.Vector3(playerPosition.x, playerPosition.y, robotBody.position.z), 0.03);
        followSpotLight.target.position.lerp(new THREE.Vector3(playerPosition.x, playerPosition.y, robotBody.position.z), 0.03);
        followSpotLight.position.lerp(new THREE.Vector3(playerPosition.x, playerPosition.y, followSpotLight.position.z), 0.03);
        camaraPerspetiva.position.lerp(new THREE.Vector3(camaraCoord.x, camaraCoord.y, camaraPerspetiva.position.z), 0.015);

        var laser = robotBody.getObjectByName("laser");
        if(laser != null && laserPosition != null) {
            laser.position.lerp(new THREE.Vector3(laserPosition.x, laserPosition.y, laser.position.z), 0.1);
        }
    }

    if (activaCamaraPerspetiva) {
        renderer.render(cena, camaraPerspetiva);
    }
    else {
        renderer.render(cena, camaraOrtografica);
    }
    
    requestAnimationFrame(update);
}


function generateCubes() {
    var newMat;
    var newCube;
    for (let i = 0; i >= (-heigthSize)-1; i--) {
        for (let j = -1; j <= rowSize ; j++) {
            var prob = Math.random();
            if (i == 0) {
                newMat = new THREE.MeshPhongMaterial({ color: 0x000000});
                newCube = new THREE.Mesh(geometria, newMat);
                newCube.matDefinido = "Indestrutivel";
                console.log(i,j);
                if(j != -1) {
                    j = rowSize;
                }
            }
            else if(i == (-heigthSize)-1 || j == -1 || j == rowSize){
                newMat = new THREE.MeshPhongMaterial({ color: 0x000000});
                newCube = new THREE.Mesh(geometria, newMat);
                newCube.matDefinido = "Indestrutivel";
                console.log(i,j);
            }
            else if (prob > 0.3) {
                newMat = new THREE.MeshPhongMaterial({map: dirt1Texture, normalMap: dirt1BumpMap, shininess: 10});
                newCube = new THREE.Mesh(geometria, newMat);
                newCube.matDefinido = "Terra";
            }
            else if (prob > 0.1){
                newMat = new THREE.MeshPhongMaterial({ color: 0xff0000});
                newCube = new THREE.Mesh(geometria, newMat);
                newCube.matDefinido = "Ferro";
            }else{
                newMat = new THREE.MeshPhongMaterial({ color: 0x000000});
                newCube = new THREE.Mesh(geometria, newMat);
                newCube.matDefinido = "Indestrutivel";
            }
            newCube.receiveShadow = true;
            newCube.position.x = j;
            newCube.position.y = i;
            newCube.name = j + ',' + i;
            cubes.add(newCube);
        }   
    }
}

function buildRobot() {
    // Robot 
    // main body
    var robotMainMat = new THREE.MeshPhongMaterial({color : 0xff0000});
    //var robotMainMat = new THREE.MeshPhongMaterial({map : metalTexture});
    var robotMainGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.2, 8);
    var robotMain = new THREE.Mesh(robotMainGeometry, robotMainMat);
    robotMain.castShadow = true;
    robotMain.receiveShadow = true;
    robotMain.rotation.set(Math.PI / 2, Math.PI /8, 0);
    robotBody.add(robotMain);
    
    // legs
    var robotLegsMat = new THREE.MeshPhongMaterial({color : 0x00FF00});
    var robotLegsGeo = new THREE.BoxGeometry(0.2, 0.3, 0.1);
    var robotLegLeft = new THREE.Mesh(robotLegsGeo, robotLegsMat);
    var robotLegRight = new THREE.Mesh(robotLegsGeo, robotLegsMat);
    robotLegLeft.position.set(-0.35, -0.4, 0);
    robotLegLeft.rotation.set(0, 0, -Math.PI / 4);
    robotLegRight.position.set(0.35, -0.4, 0);
    robotLegRight.rotation.set(0, 0, Math.PI / 4);
    robotLegLeft.castShadow = true;
    robotLegLeft.receiveShadow = true;
    robotLegRight.castShadow = true;
    robotLegRight.receiveShadow = true;
    robotBody.add(robotLegLeft);
    robotBody.add(robotLegRight);

    // feet
    var feetShape = new THREE.Shape();
    feetShape.moveTo(0.1,0);
    feetShape.lineTo(0.5,0);
    feetShape.quadraticCurveTo(0.65,0.05,0.5,0.2);
    feetShape.lineTo(0.2,0.5);
    feetShape.quadraticCurveTo(0.05,0.65,0,0.5);
    feetShape.lineTo(0,0.1);
    feetShape.quadraticCurveTo(0,0,0.1,0);
    var extrudeSettings = {
        steps:   1, 
        depth:  0.1,      
        bevelEnabled: true,   
        bevelThickness: 0.01,  
        bevelSize: 0.1,  
        bevelSegments: 8
    };
    //var robotFeetGeo = new THREE.ShapeGeometry(feetShape);
    var robotFeetGeo = new THREE.ExtrudeGeometry(feetShape, extrudeSettings);
    var robotFeetMat = new THREE.MeshPhongMaterial({color : 0x292929});
    //var robotFeetGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 3);
    var robotFootLeft = new THREE.Mesh(robotFeetGeo, robotFeetMat);
    var robotFootRight = new THREE.Mesh(robotFeetGeo, robotFeetMat);
    robotFootLeft.position.set(-0.58, -0.6, 0.1);
    robotFootRight.rotation.set(0, 0, Math.PI / 2);
    robotFootRight.position.set(0.58, -0.6, 0.1);
    robotFootLeft.scale.set(0.6,0.6,0.6);
    robotFootRight.scale.set(0.6,0.6,0.6);
    robotFootLeft.castShadow = true;
    robotFootLeft.receiveShadow = true;
    robotFootRight.castShadow = true;
    robotFootRight.receiveShadow = true;
    robotBody.add(robotFootLeft);
    robotBody.add(robotFootRight);
    
    // laser
    var robotLaserGeo = new THREE.ConeGeometry(0.1, 0.25, 20);
    var robotLaserMat = new THREE.MeshPhongMaterial({color : 0x0000ff});
    var robotLaser = new THREE.Mesh(robotLaserGeo, robotLaserMat);
    robotLaser.position.set(-0.55,0,0);
    robotLaser.rotation.set(0,0, Math.PI / 2);
    robotLaser.castShadow = true;
    robotLaser.receiveShadow = true;
    robotLaser.name = "laser";
    robotBody.add(robotLaser);
    
    //console.log("initialPos:{0}",initialPos);
    robotBody.scale.set(0.8,0.8,0.8);
    robotBody.position.set(initialPos.x, 0, 0);
    cena.add(robotBody);
}

function moveLeft(){
    var objName = (playerPosition.x - 1).toString() + "," + playerPosition.y.toString();
    //console.log(objName);
    var c = cubes.getObjectByName(objName);
    //console.log(c);
    if (c == null || c.visible == false) {
        playerPosition.x--;
        camaraCoord.x--;
    }
}

function moveRight(){
    var objName = (playerPosition.x + 1).toString() + "," + playerPosition.y.toString();
    //console.log(objName);
    var c = cubes.getObjectByName(objName);
    //console.log(c);
    if (c == null || c.visible == false) {
        playerPosition.x++;
        camaraCoord.x++;
    }
}

function moveDown(){
    var objName = (playerPosition.x).toString() + "," + (playerPosition.y -1).toString();
    //console.log(objName);
    var c = cubes.getObjectByName(objName);
    //console.log(c);
    if (c == null || c.visible == false) {
        playerPosition.y--;
        camaraCoord.y--;
    }
}

function moveLaserLeft(){
    if (laserDir != -1) {
        laserDir--;
        var laser = robotBody.getObjectByName("laser");
        laserPosition = {x:laser.position.x, y:laser.position.y};
        laserPosition.x -= 0.55;
        laser.rotateZ(-Math.PI/2);
        if (laserDir == 0) {
            laserPosition.y -= 0.55;
        }else {
            laserPosition.y += 0.55;
        }
    }
}

function moveLaserRight(){
    if (laserDir != 1) {
        laserDir++;
        var laser = robotBody.getObjectByName("laser");
        laserPosition = {x:laser.position.x, y:laser.position.y};
        laserRotation = laser.rotation.z;
        laserPosition.x += 0.55;
        laser.rotateZ(Math.PI/2);
        if (laserDir == 0) {
            laserPosition.y -= 0.55;
        }else {
            laserPosition.y += 0.55;
        }
    }
}

function destroyBlock(){
    var objName;
    if (laserDir == 0) {
        objName = (playerPosition.x).toString() + "," + (playerPosition.y -1).toString();
    }
    else {
        objName = (playerPosition.x + laserDir).toString() + "," + (playerPosition.y).toString();
    }

    var c = cubes.getObjectByName(objName);
        if (c != null && c.visible != false) {
            switch (c.matDefinido) {
                case 'Terra':
                    score +=10;
                    break;
                case 'Ferro':
                    score+=30;
                    break;
                case 'Indestrutivel':
                    return;  
            }
            c.visible = false;
            var text = document.getElementById("p").innerHTML = score;
            if (laserDir == 0) {
                moveDown();
            }
        }
}