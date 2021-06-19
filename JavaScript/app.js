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
var clock = new THREE.Clock();

var camaraCoord;
var activaCamaraPerspetiva = true;
var directionalLight;
var followSpotLight;
var ambientLight;
var cubes = new THREE.Object3D();
var robotBody = new THREE.Object3D();
var laserPosition;
var laserDir = -1;
var rowSize = 16;
var heigthSize = 8;
var initialPos = {x:(rowSize/2), y:0};
var playerPosition = {x:initialPos.x, y:initialPos.y};
var score = 0;
var animationTimer = 0;
var laserBeam;
var activeLaserBeamAnimation;
var menuOpen = false;

// carregar texturas
var textureLoader = new THREE.TextureLoader();
var dirtTexture = textureLoader.load("./Textures/Ground/TextureGround2.jpg");
var dirtNormal = textureLoader.load("./Textures/Ground/TextureGround2Normal.jpg");
var ironTexture = textureLoader.load("./Textures/Ground/Rock_Ore_001_COLOR.jpg");
var ironNormal = textureLoader.load("./Textures/Ground/Rock_Ore_001_NORM.jpg");
var robot1Texture = textureLoader.load("./Textures/Robot/Metal_Rusted_008_basecolor.jpg");
var robot1Normal = textureLoader.load("./Textures/Robot/Metal_Rusted_008_normal.jpg");
var robot2Texture = textureLoader.load("./Textures/Robot/Greeble_Techno_002_basecolor.jpg");
var robot2Normal = textureLoader.load("./Textures/Robot/Greeble_Techno_002_normal.jpg");
var laserTexture = textureLoader.load("./Textures/Robot/Sci-fi_Wall_009_basecolor.jpg");
var laserNormal = textureLoader.load("./Textures/Robot/Sci-fi_Wall_009_normal.jpg");

document.addEventListener('keydown', ev =>{
    
    if (ev.keyCode == 65) // A
    {
        moveLeft();
    }

    if (ev.keyCode == 68) // D
    { 
        moveRight();
    }

    if (ev.keyCode == 67) // C
    {   // Trocar entre camara Perspetiva e Ortografica
        activaCamaraPerspetiva = !activaCamaraPerspetiva;
    }

    if (ev.keyCode == 76) // L
    {   // Ligar/Desligar SpotLight
        followSpotLight.visible = !followSpotLight.visible;
    }

    if (ev.keyCode == 75) // K
    {   // Ligar/Desligar DirectionaLight 
        directionalLight.visible = !directionalLight.visible;
    }

    if (ev.keyCode == 74) // J
    {   // Ligar/Desligar AmientLight
        ambientLight.visible = !ambientLight.visible;
    }

    if (ev.keyCode == 32) // Espaço
    {   // Disparar o laser / destruir o bloco
        destroyBlock();
    } 

    if (ev.keyCode == 37) // left arrow
    {   // mover o laser para a esquerda
        moveLaserLeft();
    } 

    if (ev.keyCode == 39) // right arrow
    {   // mover o laser para a direita
        moveLaserRight();
    } 

    if(ev.keyCode == 72) // H
    {
        menuAjuda();
    }

});

function Start() {
    var mult = 80;
    // Camara Perspetiva e Ortografica
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
    followSpotLight = new THREE.SpotLight(0x969696, 1);
    followSpotLight.position.x = initialPos.x;
    followSpotLight.position.y = initialPos.y;
    followSpotLight.position.z = 1.5;
    followSpotLight.target.position.x = initialPos.x;
    followSpotLight.target.position.y = initialPos.y;
    followSpotLight.castShadow = true;
    cena.add(followSpotLight);
    cena.add(followSpotLight.target);

    // Directional Light
    directionalLight = new THREE.DirectionalLight(0x969696, 1);
    directionalLight.castShadow = true;
    directionalLight.position.set(0,2,3);
    cena.add(directionalLight);
    directionalLight.visible = false;

    // Ambient Light
    ambientLight = new THREE.AmbientLight(0xFFFFFF, 1);
    cena.add(ambientLight);
    ambientLight.visible = false;


    // Gerar cubos (chao)
    generateCubes();
    cena.add(cubes);

    // contruir o robot
    buildRobot();
    requestAnimationFrame(update);
}

function update() {

    if(robotBody != null)
    {
        // atualizar a posição do robot
        robotBody.position.lerp(new THREE.Vector3(playerPosition.x, playerPosition.y, robotBody.position.z), 0.03);
        // atualizar a posiçao da luz e do target da luz
        followSpotLight.target.position.lerp(new THREE.Vector3(playerPosition.x, playerPosition.y, robotBody.position.z), 0.03);
        followSpotLight.position.lerp(new THREE.Vector3(playerPosition.x, playerPosition.y, followSpotLight.position.z), 0.03);
        // atualizar a posiçao da camera
        camaraPerspetiva.position.lerp(new THREE.Vector3(camaraCoord.x, camaraCoord.y, camaraPerspetiva.position.z), 0.015);

        // atualizar a posição do laser
        var laser = robotBody.getObjectByName("laser");
        if(laser != null && laserPosition != null) {
            laser.position.lerp(new THREE.Vector3(laserPosition.x, laserPosition.y, laser.position.z), 0.1);
        }
    }

    // mudar de camara
    if (activaCamaraPerspetiva) {
        renderer.render(cena, camaraPerspetiva);
    }
    else {
        renderer.render(cena, camaraOrtografica);
    }

    // corre a animaçao do feixe de laser durante 1 segundo
    if (laserBeam != null) {
        if (activeLaserBeamAnimation && animationTimer <= 1) {
            laserBeam.visible = true;
            animationTimer += clock.getElapsedTime();
        }else {
            if (activeLaserBeamAnimation && laserDir == 0) {
                laserBeam.rotateZ(Math.PI/2);
            }
            laserBeam.visible = false;
            animationTimer = 0;
            activeLaserBeamAnimation = false;
            clock.stop();
        }
    }
    
    requestAnimationFrame(update);
}


function generateCubes() {
    var newMat;
    var newCube;
    for (let i = 0; i >= (-heigthSize)-1; i--) {
        for (let j = -1; j <= rowSize ; j++) {
            var prob = Math.random();
            if (i == 0) { // gerar uma barreira indestrutivel à volta da área de jogo
                newMat = new THREE.MeshPhongMaterial({ color: 0x000000});
                newCube = new THREE.Mesh(geometria, newMat);
                newCube.matDefinido = "Indestrutivel";
                if(j != -1) {
                    j = rowSize;
                }
            }
            else if(i == (-heigthSize)-1 || j == -1 || j == rowSize){
                newMat = new THREE.MeshPhongMaterial({ color: 0x000000});
                newCube = new THREE.Mesh(geometria, newMat);
                newCube.matDefinido = "Indestrutivel";
            }
            else if (prob > 0.3) {  // 70% probabilidade de ser terra
                newMat = new THREE.MeshPhongMaterial({
                    map: dirtTexture, 
                    normalMap: dirtNormal, 
                    shininess: 10});
                newCube = new THREE.Mesh(geometria, newMat);
                newCube.matDefinido = "Dirt";
            }
            else if (prob > 0.1){   // 20% probabilidade de ser ferro
                newMat = new THREE.MeshPhongMaterial({ 
                    map: ironTexture, 
                    normalMap: ironNormal});
                newCube = new THREE.Mesh(geometria, newMat);
                newCube.matDefinido = "Ore";
            }else{                 // 10% probabilidade de ser indestrutivel
                newMat = new THREE.MeshPhongMaterial({ color: 0x000000});
                newCube = new THREE.Mesh(geometria, newMat);
                newCube.matDefinido = "Indestrutivel";
            }
            newCube.receiveShadow = true;
            newCube.position.x = j; // atualizar a posição do cubo
            newCube.position.y = i;
            // dar um nome com a posiçao para depois poder
            // procurar pelo nome para destruir
            newCube.name = j + ',' + i; 
            cubes.add(newCube);
        }   
    }
}

function buildRobot() {
    // Robot
    var robotMainMat = new THREE.MeshPhongMaterial({map : robot2Texture, normalMap: robot2Normal});
    robotMainMat.metalness = 1;
    var robotMainGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.2, 8);
    var robotMain = new THREE.Mesh(robotMainGeometry, robotMainMat);
    robotMain.castShadow = true;
    robotMain.receiveShadow = true;
    robotMain.rotation.set(Math.PI / 2, Math.PI /8, 0);
    robotBody.add(robotMain);

    // pernas
    var robotLegsMat = new THREE.MeshPhongMaterial({map : robot1Texture, normalMap: robot1Normal});
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

    // pés
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
    var robotFeetGeo = new THREE.ExtrudeGeometry(feetShape, extrudeSettings);
    var robotFeetMat = new THREE.MeshPhongMaterial({color : 0x292929});
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
    
    // rodas
    var robotFeetWheelsGeo = new THREE.CylinderGeometry(0.07,0.07,0.005,10);
    var robotFeetWheelsMat = new THREE.MeshPhongMaterial({map : robot1Texture, normalMap: robot1Normal});
    var robotFeetWheels = new THREE.Mesh(robotFeetWheelsGeo, robotFeetWheelsMat);
    robotFeetWheels.position.x = -0.53;
    robotFeetWheels.position.y = -0.53;
    robotFeetWheels.position.z = 0.2;
    robotFeetWheels.rotateX(Math.PI/2);
    robotFeetWheels.castShadow = true;
    robotBody.add(robotFeetWheels);
    robotFeetWheels = robotFeetWheels.clone();
    robotFeetWheels.position.x = -0.29;
    robotFeetWheels.position.y = -0.53;
    robotBody.add(robotFeetWheels);
    robotFeetWheels = robotFeetWheels.clone();
    robotFeetWheels.position.x = -0.53;
    robotFeetWheels.position.y = -0.3;
    robotBody.add(robotFeetWheels);
    robotFeetWheels = robotFeetWheels.clone();
    robotFeetWheels.position.x = +0.53;
    robotFeetWheels.position.y = -0.53;
    robotBody.add(robotFeetWheels);
    robotFeetWheels = robotFeetWheels.clone();
    robotFeetWheels.position.x = +0.29;
    robotFeetWheels.position.y = -0.53;
    robotBody.add(robotFeetWheels);
    robotFeetWheels = robotFeetWheels.clone();
    robotFeetWheels.position.x = +0.53;
    robotFeetWheels.position.y = -0.3;
    robotBody.add(robotFeetWheels);

    // laser
    var robotLaserGeo = new THREE.ConeGeometry(0.1, 0.25, 20);
    var robotLaserMat = new THREE.MeshPhongMaterial({map : laserTexture, normalMap: laserNormal});
    var robotLaser = new THREE.Mesh(robotLaserGeo, robotLaserMat);
    robotLaser.position.set(-0.55,0,0);
    robotLaser.rotation.set(0,0, Math.PI / 2);
    robotLaser.castShadow = true;
    robotLaser.receiveShadow = true;
    robotLaser.name = "laser";
    robotBody.add(robotLaser);
    
    // laserbeam 
    laserBeam = LaserBeam();
    laserBeam.visible=false;
    robotBody.add(laserBeam);

    robotBody.scale.set(0.8,0.8,0.8);
    robotBody.position.set(initialPos.x, 0, 0);
    cena.add(robotBody);
}

function moveLeft(){    // verificar se tem algum cubo à esquerda
    var objName = (playerPosition.x - 1).toString() + "," + playerPosition.y.toString();
    var c = cubes.getObjectByName(objName);
    if (c == null || c.visible == false) { // se não existir cubo ou estiver escondido, mover
        playerPosition.x--;
        camaraCoord.x--;
    }
}

function moveRight(){   
    var objName = (playerPosition.x + 1).toString() + "," + playerPosition.y.toString();
    var c = cubes.getObjectByName(objName);
    if (c == null || c.visible == false) {
        playerPosition.x++;
        camaraCoord.x++;
    }
}

function moveDown(){    
    var objName = (playerPosition.x).toString() + "," + (playerPosition.y -1).toString();
    var c = cubes.getObjectByName(objName);
    if (c == null || c.visible == false) { 
        playerPosition.y--;
        camaraCoord.y--;
    }
}

function moveLaserLeft(){
    if (laserDir != -1) {   // verificar a posiçao atual do laser
        laserDir--;
        var laser = robotBody.getObjectByName("laser");
        laserPosition = {x:laser.position.x, y:laser.position.y};
        laserPosition.x -= 0.55; // mover para a esquerda
        laser.rotateZ(-Math.PI/2);
        if (laserDir == 0) {    // se o laser ficar em baixo, mover para baixo
            laserPosition.y -= 0.55;
        }else {                 // se ficar em cima(lado), mover para cima
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
    // procurar o objeto que esteja à esquerda, direita ou por baixo do robot,
    // consoante a direçao que esteja a apontar o laser
    var objName = (playerPosition.x + laserDir).toString() 
                + "," + (playerPosition.y - (1- Math.abs(laserDir))).toString();
    var c = cubes.getObjectByName(objName);
        if (c != null && c.visible != false) { // se o cubo existir e não estiver invisivel (ou seja, destruído)
            switch (c.matDefinido) {
                case 'Dirt':
                    score +=10;
                    break;
                case 'Ore':
                    score +=50;
                    break;
                case 'Indestrutivel': // se for indestrutivel, nao fazer nada
                    return;  
            }
            c.visible = false;      // caso seja terra ou minério, destruir o cubo
            var text = document.getElementById("p").innerHTML = score;  // aumentar o score
            if (laserDir == 0) {    // caso se destrua o objeto por baixo, mover para baixo
                moveDown();
            }
            showLaserBeam();
        }
}

function showLaserBeam(){
    switch (laserDir) {
        case -1:
            laserBeam.position.x = -1.5;
            laserBeam.position.y = 0;
            break;
        case 0:
            laserBeam.position.x = 0;
            laserBeam.rotateZ(-Math.PI / 2);
            laserBeam.position.y = -0.3;
            break;
        case 1:
            laserBeam.position.x = 0.5;
            laserBeam.position.y = 0;
            break;
    }
    clock.start();
    activeLaserBeamAnimation = true;
}

function menuAjuda(){
    if (!menuOpen) {
        document.getElementById("ajuda_open").style.display = 'block';
        document.getElementById("ajuda_closed").style.display = 'none';
    }else{
        document.getElementById("ajuda_open").style.display = 'none';
    }
    menuOpen = !menuOpen;
}