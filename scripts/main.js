import * as THREE from "../vendors/three.module.js";
import { Lerp } from "./lerp.js";
import { math } from "./math.js";
import { FBXLoader } from "../vendors/FBXLoader.js";

window.onload = () => {
  const scene = new THREE.Scene();

  //Setting up some ambient lighting in the scene
  //It is purposely set up with a low intensity so the scene appears dark when you get to the "hard" level
  //which is meant to look like its night time
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.25);
  hemiLight.position.set(200, 200, 0);
  scene.add(hemiLight);

  //Setting up a point light, this light will be the "sun" in our scene
  const light = new THREE.PointLight(0xffffff, 2, 100);
  light.castShadow = true;
  light.position.set(20, 20, -4); //positioning the light to the right above the Player car 
  scene.add(light);

  //Set up shadow properties for the light
  light.shadow.mapSize.width = 2048;
  light.shadow.mapSize.height = 2048;
  light.shadow.camera.near = 1;
  light.shadow.camera.far = 500;

  //We use a perspective camera here as it better simulates the real world and helps give objects depth
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight
  );

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  document.body.appendChild(renderer.domElement);


  //Making use of a seperate Game class which will essentially handle all of the logic of the game
  //Helps keep it seperate from everything else
  const gameInstance = new Game(scene, camera, light);

  
  function animate() {
    requestAnimationFrame(animate);
    gameInstance.update();
    renderer.render(scene, camera);
  }
  animate();

  //Adding the background audio (music)
  const listener = new THREE.AudioListener();
  camera.add(listener);

  const audioLoader = new THREE.AudioLoader();
  const backgroundSound = new THREE.Audio(listener);
  audioLoader.load("sounds/joyride.mp3", function (buffer) {
    backgroundSound.setBuffer(buffer);
    backgroundSound.setLoop(true);
    backgroundSound.setVolume(0.1);
    backgroundSound.play();
  });
};

class Game {

  //Creating geometries for the lane lines, and the lines which go on the side of the road (ROAD LINES)
  //This is done once here as it is needed multiple times throught this code
  //Both the lane lines and the road lines share a material
  LANELINE_PREFAB = new THREE.PlaneGeometry(0.09, 1);
  LANELINE_MATERIAL = new THREE.MeshStandardMaterial({ color: 0xfbf9f9 });

  ROADLINE_PREFAB = new THREE.PlaneGeometry(0.09, 32);


  constructor(scene, camera, light) {
    this.light = light;

    this.divScore = document.getElementById("score"); //used to display score in the corner while user plays
    this.divDistance = document.getElementById("distance");//used to display distance in the corner while user plays

    this.divScore.innerText = this.score;//setting the score
    this.divDistance.innerText = 0;//setting the distance

    //these are all the components needed when the user crashes
    // these were created in html, they will however need to be manipulated as the game is played
    this.divGameOverPanel = document.getElementById("game-over-panel");
    this.divGameOverScore = document.getElementById("game-over-score");
    this.divGameOverDistance = document.getElementById("game-over-distance");
    this.divGameOverHighScore = document.getElementById("game-over-high-score");

    //these are all the components needed when the user pauses the game
    //these were created in html, they will however need to be manipulated as the game is played
    this.divPausePanel = document.getElementById("pause-panel");
    this.divPauseScore = document.getElementById("pause-score");
    this.divPauseDistance = document.getElementById("pause-distance");
    this.divPauseHighScore = document.getElementById("pause-high-score");

    document.getElementById("start-button").onclick = () => {
      //Playing the car start sound when the game begins
      const listener = new THREE.AudioListener();
      camera.add(listener);
      const audioLoader = new THREE.AudioLoader();
      const backgroundSound = new THREE.Audio(listener);
      audioLoader.load("sounds/start.mp3", function (buffer) {
        backgroundSound.setBuffer(buffer);
        backgroundSound.setLoop(false);
        backgroundSound.setVolume(1);
        backgroundSound.play();
      });

      this.running = true;

      //hiding these panels which were created in html so the user can actually play the game
      document.getElementById("intro-panel").style.display = "none";
      document.getElementById("level-up").style.display = "none";
      document.getElementById("crash").style.display = "none";
    };

    //does the same thing as above except it happens when the the user clicks Levels
    document.getElementById("level-replay-button").onclick = () => {
      const listener = new THREE.AudioListener();
      camera.add(listener);
      const audioLoader = new THREE.AudioLoader();
      const backgroundSound = new THREE.Audio(listener);
      audioLoader.load("sounds/button.mp3", function (buffer) {
        backgroundSound.setBuffer(buffer);
        backgroundSound.setLoop(false);
        backgroundSound.setVolume(1);
        backgroundSound.play();
      });
      document.getElementById("menu-holder").style.display = "grid"; //display the levels menu
      document.getElementById("game-over-panel").style.display = "none";
    };

    this.difficulty = 0; //setting the default difficulty to 0 ie. "easy"

    /*
    The three onClick functions below do the following
    Plays the car sound when the user selects the level
    sets the difficulty to whatever level is selected, 0 = "easy"
    1 = "medium", 2 = "hard".
    sets the speed along the z axis to whatever is necessary for the selectel level
    calls _changeLevel() which changes the sky as well as the lighting in the scene:
    "easy" = daytime, "medium" = afternoon and "hard" = night
    sets running = true so the game can animate again
    starts the clock and hides the UI panels
    */
    document.getElementById("easy").onclick = () => {
      const listener = new THREE.AudioListener();
      camera.add(listener);
      const audioLoader = new THREE.AudioLoader();
      const backgroundSound = new THREE.Audio(listener);
      audioLoader.load("sounds/start.mp3", function (buffer) {
        backgroundSound.setBuffer(buffer);
        backgroundSound.setLoop(false);
        backgroundSound.setVolume(1);
        backgroundSound.play();
      });
      this.difficulty = 0;
      this.speedZ = 5;
      this._changeLevel();
      this.running = true;
      this.clock.start();
      document.getElementById("menu-holder").style.display = "none";
    };
    document.getElementById("med").onclick = () => {
      const listener = new THREE.AudioListener();
      camera.add(listener);
      const audioLoader = new THREE.AudioLoader();
      const backgroundSound = new THREE.Audio(listener);
      audioLoader.load("sounds/start.mp3", function (buffer) {
        backgroundSound.setBuffer(buffer);
        backgroundSound.setLoop(false);
        backgroundSound.setVolume(1);
        backgroundSound.play();
      });
      this.difficulty = 1;
      this.speedZ = 8;
      this._changeLevel();
      this.running = true;
      this.clock.start();
      document.getElementById("menu-holder").style.display = "none";
    };
    document.getElementById("hard").onclick = () => {
      const listener = new THREE.AudioListener();
      camera.add(listener);
      const audioLoader = new THREE.AudioLoader();
      const backgroundSound = new THREE.Audio(listener);
      audioLoader.load("sounds/start.mp3", function (buffer) {
        backgroundSound.setBuffer(buffer);
        backgroundSound.setLoop(false);
        backgroundSound.setVolume(1);
        backgroundSound.play();
      });
      this.difficulty = 2;
      this.speedZ = 10;
      this._changeLevel();
      this.running = true;
      this.clock.start();
      document.getElementById("menu-holder").style.display = "none";
    };
//===========================================================================

//setting the audio and and hiding the UI when the user clicks replay needed to do this as they occur on different screens in the UI
    document.getElementById("replay-button").onclick = () => {
      const listener = new THREE.AudioListener();
      camera.add(listener);
      const audioLoader = new THREE.AudioLoader();
      const backgroundSound = new THREE.Audio(listener);
      audioLoader.load("sounds/start.mp3", function (buffer) {
        backgroundSound.setBuffer(buffer);
        backgroundSound.setLoop(false);
        backgroundSound.setVolume(1);
        backgroundSound.play();
      });
      this.running = true;
      this.divGameOverPanel.style.display = "none";
    };
    document.getElementById("replay-button-pause").onclick = () => {
      const listener = new THREE.AudioListener();
      camera.add(listener);
      const audioLoader = new THREE.AudioLoader();
      const backgroundSound = new THREE.Audio(listener);
      audioLoader.load("sounds/button.mp3", function (buffer) {
        backgroundSound.setBuffer(buffer);
        backgroundSound.setLoop(false);
        backgroundSound.setVolume(1);
        backgroundSound.play();
      });
      this._reset(true);   //calling _reset(true) as we are replaying
                           // this function assists in rearranging the scene 
                           //and setting values back to their defaults 
                           //so the game restarts and we dont create everything from scratch
      this.running = true;
      this.divPausePanel.style.display = "none";
    };

    //used when the user unpauses the game
    document.getElementById("continue-button").onclick = () => {
      const listener = new THREE.AudioListener();
      camera.add(listener);
      const audioLoader = new THREE.AudioLoader();
      const backgroundSound = new THREE.Audio(listener);
      audioLoader.load("sounds/start.mp3", function (buffer) {
        backgroundSound.setBuffer(buffer);
        backgroundSound.setLoop(false);
        backgroundSound.setVolume(1);
        backgroundSound.play();
      });
      this.running = true;
      this.clock.start();
      this.divPausePanel.style.display = "none";

      //this ensures that the lane lines appear in the correct place whn the user unpauses the game
      // _setupLaneLine is a function that takes care of this
      this.lineParent.traverse((item) => {
        if (item instanceof THREE.Mesh) {
          this._setupLaneLines(
            item,
            item.userData.type,
            -this.lineParent.position.z,
            item.userData.pos
          );
        } else {
          item.position.set(0, 0, this.lineParent.position.z);
        }
      });
    };


    this.scene = scene;
    this.camera = camera;
    this._reset(false);

    //calculating the indow size and dividing the scene into three segnments, this will be used for mouse the mousecontrols later
    //it is done here so we only have to do this calculation once 
    this.windowSize = window.innerWidth;
    this.left = this.windowSize / 3; //end of the first third of the screen
    this.right = this.windowSize / 3 + this.windowSize / 3;//end of the second third of the screen

    document.addEventListener("keydown", this._keydown.bind(this)); //adding event listeners for the kerboard controls
                                                                    //and binding it 
                                                                    //with the relevant funtion to handle the keyboard inputs

    document.addEventListener("keyup", this._keyup.bind(this)); //adding event listeners for the when the keys are no longer pressed
                                                                //and binding it 
                                                                 //with the relevant funtion to handle this

    document.addEventListener("mousemove", this._mouse.bind(this));//adding event listeners for the mouse controls
                                                                  //and binding it 
                                                                  //with the relevant funtion to handle the mouse movements

    this.highScore = 0; //starting off with a highscore of 0
    this.rotationLerp = null; 
  }

  update() {

    if (!this.running) return; //ie. if the game is paused or the game ended do nothing

    const timeDelta = this.clock.getDelta();  //getting the time difference between the last update and the current one
    this.time += timeDelta;// updating the game time

    if (this.rotationLerp !== null) {
      this.rotationLerp.update(timeDelta); //needed for the animation of the player car
    }


    this.translateX += this.speedX * -0.05; //allows the car to move along the x-axis, (left or right)
    this._checkCollisions(); //is a function that checks if th player car collided with any of the obstacle cars
    this._updateGrid();//is a function that moves the lane lines, obstacle cars, scenery etc depending on position of player car
    this._updateInfoPanel();//is a function that updates the information in the top corner which is displayed to the user
  }

  //function to set up the necessary skydome and light position depending on the level selected, or the level progressed to
  _changeLevel() {
    if (this.difficulty == 0) { //daytime 
      this.light.position.set(20, 20, -4);
      this.skydome.visible = true;
      this.skydome3.visible = false;
      this.skydome2.visible = false;
    } else if (this.difficulty == 1) {//afternoon
      this.light.position.set(-30, 20, -4);
      this.skydome.visible = false;
      this.skydome3.visible = true;
      this.skydome2.visible = false;
    } else {//nightime
      this.light.position.set(-100, 20, -4);
      this.skydome.visible = false;
      this.skydome3.visible = false;
      this.skydome2.visible = true;
    }
  }

  //function to handle mouse controls
  _mouse(event) {
    let newSpeedX;
    if (event.clientX > this.left && event.clientX < this.right) { //if the users mouse is in the middle of the screen
      newSpeedX = 0.0;                                        //then there is no movement on the x axis

    } else if (event.clientX < this.left) { //if the users mouse is on the left third of the screen then move left
      newSpeedX = -1.2;

    } else if (event.clientX > this.right) {//if the users mouse is on the right third of the screen then move right
      newSpeedX = 1.2;
    } else {
      newSpeedX = 0.0; //defaulting it to no movement on the x, just incase...
    }

    if (this.speedX !== newSpeedX) {
      this.speedX = newSpeedX; //assigning the speed to the global variable
      this._rotateCar((-this.speedX * 20 * Math.PI) / 180, 0.5);//calling the function which handles the animations of 
                                                                //the vehicle when the vehicle everytime the user turns
    }
  }

  //function to handle the keyboard controls
  _keydown(event) {
    let newSpeedX;
    switch (event.key) {
      case "ArrowLeft":
        newSpeedX = -1.2;
        break;
      case "ArrowRight":
        newSpeedX = 1.2;
        break;
      case "a":
        newSpeedX = -1.2;
        break;
      case "A":
        newSpeedX = -1.2;
        break;
      case "d":
        newSpeedX = 1.2;
        break;
      case "D":
        newSpeedX = 1.2;
        break;
      case "P":
        this._pause(); //function which pauses the game
        newSpeedX = 0;
        break;
      case "p":
        this._pause();
        newSpeedX = 0;
        break;
      case "v":
        this._changeView(this.camera); //function to move the camera resulting in a different view
        newSpeedX = 0;
        break;
      case "V":
        this._changeView(this.camera);
        newSpeedX = 0;
        break;
      default:
        return;
    }
    if (this.speedX !== newSpeedX) {
      this.speedX = newSpeedX;
      this._rotateCar((-this.speedX * 20 * Math.PI) / 180, 0.5);
    }
  }

  //function to handle the event where the user stops pressing a key 
  _keyup() {
    this.speedX = 0; //no movement on the x axis
    this._rotateCar(0, 0.5); //rotate the car to face forwards again
  }

  //function to move the camera and cycle through views
  _changeView(camera) {
    if (camera.position.z == 3) {//if already in third person
      camera.position.set(0, 1, -0.2); //change to first person

    } else if (camera.position.z == -0.2) {//if in first person
      camera.rotateX((-65 * Math.PI) / 180);//change to top view
      camera.position.set(0, 8, -3);

    } else { //else go back to third person
      camera.position.set(0, 1.5, 3);
      camera.lookAt(0, 0, 0);
    }
  }

  _updateGrid() {

    //slowly rotating the sky geometries 
    this.skydome.rotateY(0.1 * (Math.PI / 180));
    this.skydome2.rotateY(0.1 * (Math.PI / 180));
    this.skydome3.rotateY(0.1 * (Math.PI / 180));

    /*the following two if statements do a similar thing,
    depending in the level they slowly move the light position to give the effect that
    its going from daytime to afternoon to night time
    this is done so the light smoothly transitions between the different required positions for each level 
    and does not just suddenly get placed in its new position once the level changes*/
    if (this.difficulty == 0 && this.light.position.x > -30) {
      this.light.position.set(this.light.position.x - 0.02, 20, -4);
    }

    if (this.difficulty == 1 && this.light.position.x > -100) {
      this.light.position.set(this.light.position.x - 0.009, 20, -4);
    }

    /*the code below is used to handle the gradual speeding up of the game as the user progresses
    the easy level speed is capped at 7, the meduim level is capped at 9 and the hard laevel is capped at twelve
    this is done to ensure the game remains playalble no matter what difficulty you on 
    and also ensures that the levls stick to their expected difficulties, ie. the easy level doesnt move too fast etc.
    */
    if (this.difficulty == 0 && this.speed < 7) {
      this.speedZ = this.speedZ + 0.00045;
    } else if (this.difficulty == 1 && this.speedZ < 9) {
      this.speedZ = this.speedZ + 0.00045;
    } else if (this.difficulty == 2 && this.speedZ < 12) {
      this.speedZ = this.speedZ + 0.00045;
    }

//the following code below deals with moving the necessary objects in the scene along the z axis
    this.speedIncrementor = this.speedIncrementor + 0.15;
    this.objectsParent.position.z =
      this.speedZ * this.time + this.speedIncrementor; // moving the obstacle cars
    this.lineParent.position.z =
      this.speedZ * this.time + 1.5 * this.speedIncrementor;//moving the lane lines, the 1.5 multiplied here is to move the lane lines faster
      // to give the player the illusion that they are moving faster, it also gives the illusion that the obstacle cars are moving forwards
    this.treesParent.position.z =
      this.speedZ * this.time + this.speedIncrementor; //moving the scenery

    /*the first two if statements is used to ensure that the user doesnt drive out of the bounds of the road
    if they are slightly out of the bounds of the road they are translated slightly to be on the road
    the last else statement is used to translate objects on the x axis, this essentially shows that the player car stays
    in the same position and its all the other objects in the scene which move to give the illusion that the player car is moving
    */
    if (this.translateX > 2.1) {
      this.translateX = 2.0;
    } else if (this.translateX < -2.1) {
      this.translateX = -2.0;
    } else {
      this.objectsParent.position.x = this.translateX;
      this.lineParent.position.x = this.translateX;
      this.treesParent.position.x = this.translateX;
      this.roadLineParent.position.x = this.translateX;
    }

  

    /*the following lines of code deal with repositioning the moving objects in the scene to the other end of the 
    road once they pass the player car.
    This is to save on computing resources,
    instead of creating new objects every time simply respawn them in a different position (object pooling)
    this is extremely important in an infinite runner such as this*/
    this.objectsParent.traverse((child) => {
      const childZPos = child.position.z + this.objectsParent.position.z;
      if (childZPos > 3) {
        if (child.name == "obs") {
          this.score += 5; //update the score for each car passed
          this.divScore.innerText = this.score;

          this._setupObstacle(
            child,
            -this.objectsParent.position.z,
            math._randomInt(0, 4)
          );
        }
      }
    });

    this.lineParent.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const childZPos = child.position.z + this.lineParent.position.z;
        if (childZPos > 3) {
          this._setupLaneLines(
            child,
            child.userData.type,
            -this.lineParent.position.z
          );
        }
      }
    });

    this.treesParent.traverse((child) => {
      if (child.name == "Tree") {
        const childZPos = child.position.z + this.treesParent.position.z;
        if (childZPos > 3) {
          this._setupTrees(child, -this.treesParent.position.z);
        }
      }
    });
/*============================================================================================== */

/*Changing the difficultie, ie. increasing the lavels each time the score requirement for that level is reached
displaying the relevant animation every time the user levels up
changing the sky geometries and lighting positions (_changeLevel()), for the necessary levels
*/
    if (this.score > 300 && this.difficulty == 0) {
      
      this.difficulty = 1;
      this._changeLevel();

      document.getElementById("level-up").style.display = "grid";
      setTimeout(() => {
        document.getElementById("level-up").style.display = "none";
      }, 2000);
    } else if (this.score > 800 && this.difficulty == 1) {
      this.difficulty = 2;
      this._changeLevel();
      
      document.getElementById("level-up").style.display = "grid";
      setTimeout(() => {
        document.getElementById("level-up").style.display = "none";
      }, 2000);

    }
  }

  /*replay is a boolean variable which indicates whether the scene need to be created from scratch
  or can just be rearranged if the user already played before
  a value of true means that the user has already played and the scene can just be reorganised
  a value of false means that that the scene has to be created from scratch*/
  _reset(replay) {
    this.running = false;

    //setting the necessary speed for the necessary level
    if (this.difficulty == 0) {
      this.speedZ = 5;
    } else if (this.difficulty == 1) {
      this.speedZ = 8;
    } else {
      this.speedZ = 10;
    }

    //initializing the variable to their defaults
    this.speedX = 0;
    this.translateX = 0;
    this.score = 0;
    this.collisionCount = 0;
    this.prevTime = 0;
    this.speedIncrementor = 0;
    this.obstacleCounter = 0;
    this.posArr = new Array(7);
    for (let i = 0; i < this.posArr.length; i++) {
      this.posArr[i] = 0;
    }

    this.divScore.innerText = this.score;
    this.divDistance.innerText = 0;

    this.time = 0;
    this.clock = new THREE.Clock();

    this._initializeScene(this.scene, this.camera, replay);
    this._changeLevel();
  }

  //used for the animation of the player car, is done using the linear interpolator found in lerp.js
  _rotateCar(targetRotation, delay) {
    const $this = this;
    this.rotationLerp = new Lerp(this.car.rotation.y, targetRotation, delay)
      .onUpdate((value) => {
        $this.car.rotation.y = value;
      })
      .onFinish(() => {
        $this.rotationLerp = null;
      });
  }

  //used to check if the player car has collided with any of the obstacle cars
  _checkCollisions() {
    this.objectsParent.traverse((child) => {//objectsParent is a THREE Group which consists of all the obstacle cars
      if (child.name == "obs") {
        if (//using the mathematical positions of the obstacle cars in relation to the player car to check if there has been a collision
          child.position.z + this.objectsParent.position.z > -2.3 &&
          Math.abs(child.position.x + this.translateX) <= 0.7
        ) {
          this.collisionCount = this.collisionCount + 1;
          this.prevTime = this.time;
        }

        //using the time and the amount of collsiion counts as a collsion threshold which determines what should and what shouldnt be 
        //counted as a collision
        if (this.time - this.prevTime > 0.75) {
          this.collisionCount = 0;
        }

        if (this.collisionCount > 6) {
          this._gameOver();

          //adding audio for when a collsiion has occured
          const listener = new THREE.AudioListener();
          const audioLoader = new THREE.AudioLoader();
          const backgroundSound = new THREE.Audio(listener);
          audioLoader.load("sounds/crash.mp3", function (buffer) {
            backgroundSound.setBuffer(buffer);
            backgroundSound.setLoop(false);
            backgroundSound.setVolume(1);
            backgroundSound.play();
          });
        }
      }
    });
  }

  //function which updates whats seen in the top corner displayed to the user
  //ie the distance, which has to be continuously updated
  _updateInfoPanel() {
    this.divDistance.innerText = this.objectsParent.position.z.toFixed(0);
  }

  //function to stop the running of the game and show the relevan ui to the user when they have paused
  _pause() {
    this.running = false;
    this.divPauseScore.innerText = this.score;
    this.divPauseDistance.innerText = this.objectsParent.position.z.toFixed(0);
    this.divPauseHighScore.innerText = this.highScore;
    this.clock.stop();
    setTimeout(() => { //adding a tiny amount of time from when the game stops to when the UI is shown so its not so abrupt
      this.divPausePanel.style.display = "grid";
    }, 10);
  }

  _gameOver() {
    if (this.highScore < this.score) { //deals with the relevant UI animations for when the user has set a new high score, the animations are done in CSS
      this.highScore = this.score;
      document.getElementById("new-high").style.display = "grid";
      document.getElementById("new-high_").style.display = "grid";

      setTimeout(() => {
        document.getElementById("new-high").style.display = "none";
        document.getElementById("new-high_").style.display = "none";
      }, 6000);
    }

    //displaying the relevant animations for when the user collides with an obstacle and the game ends
    document.getElementById("crash").style.display = "grid";
    setTimeout(() => {
      document.getElementById("crash").style.display = "none";
    }, 1500);

    this.running = false; //stops the running of the game
    
    //displays the relevant UI
    this.divGameOverScore.innerText = this.score;
    this.divGameOverDistance.innerText = this.objectsParent.position.z.toFixed(0);
    this.divGameOverHighScore.innerText = this.highScore;
    setTimeout(() => {
      this.divGameOverPanel.style.display = "grid";
      this._reset(true);
    }, 1000);
  }

  _createPlayerCar(scene) {
  //creating the player car using hierachichal modelling
  //build each component seperately and adds them to a three group which consists of all the components of the player car
    const carBody = new THREE.Mesh(
      new THREE.CapsuleBufferGeometry(0.45, 0.7, 4, 4),
      this.LANELINE_MATERIAL
    );

    carBody.translateY(-0.1);
    carBody.rotateZ((45 * Math.PI) / 180);
    carBody.rotateX((90 * Math.PI) / 180);

    carBody.castShadow = true;
    carBody.receiveShadow = true;

    const carTop = new THREE.Mesh(
      new THREE.CapsuleBufferGeometry(0.2, 0.4, 4, 40),
      new THREE.MeshStandardMaterial({ color: 0x4e4e4e })
    );
    carTop.translateY(0.2);
    carTop.rotateZ((45 * Math.PI) / 180);
    carTop.rotateX((90 * Math.PI) / 180);

    carTop.castShadow = true;
    carTop.receiveShadow = true;

    const tailLightL = new THREE.Mesh(
      new THREE.OctahedronBufferGeometry(0.06, 2),
      new THREE.MeshStandardMaterial({ color: 0xff0000 })
    );

    const tailLightR = new THREE.Mesh(
      new THREE.OctahedronBufferGeometry(0.06, 10),
      new THREE.MeshStandardMaterial({ color: 0xff0000 })
    );

    tailLightL.translateZ(0.6);
    tailLightL.translateX(0.15);
    tailLightL.translateY(0.13);

    tailLightR.translateZ(0.6);
    tailLightR.translateX(-0.15);
    tailLightR.translateY(0.13);

    tailLightL.castShadow = true;
    tailLightL.receiveShadow = true;

    tailLightR.castShadow = true;
    tailLightR.receiveShadow = true;

    this.car = new THREE.Group();
    this.car.add(carBody);
    this.car.add(carTop);
    this.car.add(tailLightL);
    this.car.add(tailLightR);

    //used as a reference for where the spotlight will shine onto 
    const targetObject = new THREE.Object3D();
    targetObject.position.set(0, -25, -36); 
    scene.add(targetObject);

    //adding a spotlight onto the car
    //this serves as the headlights of the car and is necessary especially on the hard level when its night time
    const spotLight = new THREE.SpotLight(0xddffff);
    spotLight.position.set(0, 1, -0.5);
    spotLight.target = targetObject;
    spotLight.angle = Math.PI / 4.5;
    spotLight.penumbra = 0.1;
    spotLight.decay = 2;
    spotLight.distance = 300;
    spotLight.intensity = 1.5;

    //setting up the shadow properties of the light
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 1024;
    spotLight.shadow.mapSize.height = 1024;
    spotLight.shadow.camera.near = 1;
    spotLight.shadow.camera.far = 500;

    //adding the light onto the car
    this.car.add(spotLight);
    scene.add(this.car); 
  }

  /*This function is used to set up the scene from screatch is replay = false or
  if replay = true, it means that the scene was created before so 
  it rearranges the scene so all the objects in the scene dont have to be deleted
  and recreated again from scratch
  */
  _initializeScene(scene, camera, replay) {
    if (!replay) {
      this._createSky(); //function that creates the multiple skydomes needed for the different levels
      this._createPlayerCar(scene); //function that creates the player car using hierarchical modelling
      
      this.objectsParent = new THREE.Group();//stores all of the obstacle cars
      this.objectsParent.userData = { type: "obstacle_parent" };

      this.lineParent = new THREE.Group();//stores all of the moving lane lines in the scene

      this.treesParent = new THREE.Group(); //stores all the moving scenery in the scene
      this.treesParent.userData = { type: "trees_parent" };

      this.roadLineParent = new THREE.Group();//stores all the still objects in the scene
                                              //lines on sid of road
                                              //ground
                                              //couple of lane lines which stay still at the far end of the road

      scene.add(this.objectsParent);
      scene.add(this.lineParent);
      scene.add(this.treesParent);
      scene.add(this.roadLineParent);

      this._spawnRoadLines(); //function which creates all of the still objects in the scene


      for (let i = 0; i < 8; i++) { //spawning 8 scenery objects
        this._spawnTrees();
      }

      for (let i = 0; i < 7; i++) {//spawning 7 obstacles
        this._spawnObstacle();
      }

      //calls a function which spawns a lane line and puts it in the correct position
      //in total spawns twelve lane lines 
      //4 per a lane
      let pos1 = 0;
      let pos2 = 0;
      let pos3 = 0;
      for (let i = 0; i < 12; i++) {
        if (i == 0 || i == 1 || i == 2 || i == 3) {
          this.lane = 0;
          this._spawnLaneLines(this.lane, pos1); //for the first lane
          pos1 = pos1 + 1;
        } else if (i == 4 || i == 5 || i == 6 || i == 7) {
          this.lane = 1;
          this._spawnLaneLines(this.lane, pos2);//for the second lane
          pos2 = pos2 + 1;
        } else {
          this.lane = 2;
          this._spawnLaneLines(this.lane, pos3);//for the third lane
          pos3 = pos3 + 1;
        }
      }

      //setting the camera to the third person view
      camera.rotateX((-20 * Math.PI) / 180);
      camera.position.set(0, 1.5, 3);
    } 
    
    else { //used for rearranging the scene if it doesnt have to be created from scratch
      this.objectsParent.traverse((item) => {
        if (item.name == "obs") {
          this._setupObstacle(item);//traversing the three group and calling a function to place the obstacles in the correct place 
        } else if (item.userData.type == "obstacle_parent") { //place the group parent back to the default position
          item.position.set(0, 0, 0);
        }
      });

      this.treesParent.traverse((item) => {
        if (item.name == "Tree") { 
          this._setupTrees(item);//traversing the three group and calling a function to place the scenery in the correct place
        } else if (item.userData.type == "trees_parent") {
          item.position.set(0, 0, 0);//place the group parent back to the default position
        }
      });

      this.lineParent.traverse((item) => {
        if (item instanceof THREE.Mesh) {
          this._setupLaneLines(item, item.userData.type, 0, item.userData.pos);//traversing the three group and calling a function to place the lane lines in the correct place
        } else {
          item.position.set(0, 0, 0);//place the group parent back to the default position
        }
      });
    }
  }

  /*function that loads the fbx models we have used for scenery*/
  _spawnTrees() { 
    const obj = new THREE.Group();
    const loader = new FBXLoader();

    let rand = math._randomInt(0, 4);//gives a random integer between 0 and 4
                                    //used for selecting random scenery objects to place into the scene
    let pathStr = "";
    switch (rand) {
      case 0:
        pathStr = "resources/nature_pack/FBX/Bush2.fbx";
        break;
      case 1:
        pathStr = "resources/nature_pack/FBX/Tree1.fbx";
        break;
      case 2:
        pathStr = "resources/nature_pack/FBX/Rock2.fbx";
        break;
      case 3:
        pathStr = "resources/nature_pack/FBX/Tree4.fbx";
        break;
      default:
        pathStr = "resources/nature_pack/FBX/Tree1.fbx";
        break;
    }

    //loading in the actual fbx object as determined by the path chosen at random above
    loader.load(pathStr, function (fbx) {
      fbx.scale.setScalar(0.007);

      fbx.traverse((c) => {
        let materials = c.material;
        if (!(c.material instanceof Array)) {
          materials = [c.material];
        }

        for (let m of materials) {
          if (m) {
            m.specular = new THREE.Color(0x000000);
            m.color.offsetHSL(0, 0.25, 0);
          }
        }
        c.castShadow = true;
        c.receiveShadow = true;
      });
      obj.add(fbx);
    });

    obj.userData = { type: "Tree" };
    obj.name = "Tree";
    this._setupTrees(obj); //function to give the object its correct position in the scene
    this.treesParent.add(obj);//adding the object to the group of all scenery objects
  }

  /*
  this function is used extensively to continuously respawn the scenery,
  once they pass the player car they are respawned to the other end 
  and placed on the left side or right side at random
  */
  _setupTrees(obj, refZPos = 0) {
    let lane = math._randomInt(0, 2); //place objects on either left side or right side of road chosen at random
    if (lane == 0) {
      obj.position.set(-5.5, -0.1, refZPos - 2 - math._randomFloat(10, 30));//the random number is used here so the objects spawn 
                                                                            //at a nice distance away from the player car
                                                                            //and dont just pop up right next to the player car
                                                                            
    } else if (lane == 1) {
      obj.position.set(5.5, -0.1, refZPos - 2 - math._randomFloat(10, 30));
    }
  }


  /*this function is used to spawn all the objects in the scene which dont have movement along the z axis
  this includes the ground, the solid line found on the left and right sides of the road,
  the six still lane lines seen at the far end of the road and the textured road itself.
  */
  _spawnRoadLines() {

    //creating the ground as a large plane with a grass green colour
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(20000, 20000, 10, 10),
      new THREE.MeshStandardMaterial({
        color: 0x7cfc00,
      })
    );
    ground.castShadow = false;
    ground.receiveShadow = true;
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -0.1, 0);
    this.scene.add(ground);

    //solid line on left side of the road
    const leftLine = new THREE.Mesh(
      this.ROADLINE_PREFAB,
      this.LANELINE_MATERIAL
    );
    leftLine.rotation.set(-Math.PI / 2, Math.PI / 2000, Math.PI);

    leftLine.position.set(-2.45, 0, -1);

    this.roadLineParent.add(leftLine);

    //solid line on the right side of the road
    const rightLine = new THREE.Mesh(
      this.ROADLINE_PREFAB,
      this.LANELINE_MATERIAL
    );
    rightLine.rotation.set(-Math.PI / 2, Math.PI / 2000, Math.PI);

    rightLine.position.set(2.45, 0, -1);

    this.roadLineParent.add(rightLine);


    //the following below is to create the 6 still lane lines at the far end of the road
    const laneLine_1 = new THREE.Mesh(
      this.LANELINE_PREFAB,
      this.LANELINE_MATERIAL
    );
    laneLine_1.rotation.set(-Math.PI / 2, Math.PI / 2000, Math.PI);
    laneLine_1.position.set(-1.2, 0, -16);

    const laneLine_2 = new THREE.Mesh(
      this.LANELINE_PREFAB,
      this.LANELINE_MATERIAL
    );
    laneLine_2.rotation.set(-Math.PI / 2, Math.PI / 2000, Math.PI);
    laneLine_2.position.set(0, 0, -16);

    const laneLine_3 = new THREE.Mesh(
      this.LANELINE_PREFAB,
      this.LANELINE_MATERIAL
    );
    laneLine_3.rotation.set(-Math.PI / 2, Math.PI / 2000, Math.PI);
    laneLine_3.position.set(1.2, 0, -16);

    const laneLine_4 = new THREE.Mesh(
      this.LANELINE_PREFAB,
      this.LANELINE_MATERIAL
    );
    laneLine_4.rotation.set(-Math.PI / 2, Math.PI / 2000, Math.PI);
    laneLine_4.position.set(-1.2, 0, -20);

    const laneLine_5 = new THREE.Mesh(
      this.LANELINE_PREFAB,
      this.LANELINE_MATERIAL
    );
    laneLine_5.rotation.set(-Math.PI / 2, Math.PI / 2000, Math.PI);
    laneLine_5.position.set(0, 0, -20);

    const laneLine_6 = new THREE.Mesh(
      this.LANELINE_PREFAB,
      this.LANELINE_MATERIAL
    );
    laneLine_6.rotation.set(-Math.PI / 2, Math.PI / 2000, Math.PI);
    laneLine_6.position.set(1.2, 0, -20);

    //creating the geometry and material as well as mapping a texture to it for the road
    var geo = new THREE.PlaneGeometry(5, 32, 1);
    var mat = new THREE.MeshStandardMaterial();
    var texture = new THREE.TextureLoader().load("resources/road.jpg");
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.MirroredRepeatWrapping;
    texture.repeat.set(4, 4);
    mat.map = texture;

    //creating the road from the above geometry and material
    var road = new THREE.Mesh(geo, mat);
    road.position.set(0, -0.01, -10);//setting its position
    road.rotation.set(-Math.PI / 2, Math.PI / 2000, Math.PI); //rotating it so its flat
    road.receiveShadow = true;//allwing it to receive shadows
    road.castShadow = false;

    //setting up shadow properties for all the still objects
    laneLine_1.receiveShadow = true;
    laneLine_1.castShadow = false;

    laneLine_2.receiveShadow = true;
    laneLine_2.castShadow = false;

    laneLine_3.receiveShadow = true;
    laneLine_3.castShadow = false;

    laneLine_4.receiveShadow = true;
    laneLine_4.castShadow = false;

    laneLine_5.receiveShadow = true;
    laneLine_5.castShadow = false;

    laneLine_6.receiveShadow = true;
    laneLine_6.castShadow = false;

    //adding the still objects to the parent object
    this.roadLineParent.add(road);
    this.roadLineParent.add(laneLine_1);
    this.roadLineParent.add(laneLine_2);
    this.roadLineParent.add(laneLine_3);
    this.roadLineParent.add(laneLine_4);
    this.roadLineParent.add(laneLine_5);
    this.roadLineParent.add(laneLine_6);
  }

  //used to spawn all the moving lane lines in the scene, this function creates a single lane line
  //and calls a function to put it in its coreect position determined by the parameter pos
  _spawnLaneLines(lane, pos) {
    const plane = new THREE.Mesh(this.LANELINE_PREFAB, this.LANELINE_MATERIAL);
    plane.rotation.set(-Math.PI / 2, Math.PI / 2000, Math.PI);
    plane.userData = { type: lane, pos: pos };//sets user data so we know which object we dealing with, necessary for later
    plane.castShadow = false;
    plane.receiveShadow = true;
    this._setupLaneLines(plane, lane, 0, pos);
    this.lineParent.add(plane);
  }

  /*
  sets up the lane lines in the three lanes
  by a position determined by lane, as well as 
  sets it at the correct distance away from the player car

  is used extensively to continuously respawn the lane lines,
  once they pass the player car they are respawned to the other endo of the grid
  */
  _setupLaneLines(laneLine, lane, refZPos = 0, pos = -1) {
    if (pos == 0) { //first line infront of player car
      pos = refZPos;
    } else if (pos == 1) {//second line infront of player car
      pos = refZPos - 4;
    } else if (pos == 2) {//third line infront of player car
      pos = refZPos - 8;
    } else if (pos == 3) {//fourth line infront of player car
      pos = refZPos - 12;
    } else {//a default just incase
      pos = refZPos - 12;
    }

    //putting the lines in the correct position as determined by lane
    //either the right lane, left lane or center lane
    if (lane == 0) {
      laneLine.position.set(-1.2, 0, pos);
    } else if (lane == 1) {
      laneLine.position.set(0, 0, pos);
    } else if (lane == 2) {
      laneLine.position.set(1.2, 0, pos);
    }
  }

  //function to load in an fbx model we use for obstacles and call a function to place them in the correct place
  _spawnObstacle() {
    const obj = new THREE.Group();
    const loader = new FBXLoader();

    let rand = math._randomInt(0, 6); //gives a random integer between 0 and 6
                                      //used for selecting random obstacle objects to place into the scene
    let pathStr = "";
    //setting the path string to the relevant fbx model as determind by the random number
    switch (rand) {
      case 0:
        pathStr = "resources/car_pack/FBX/NormalCar1.fbx";
        break;
      case 1:
        pathStr = "resources/car_pack/FBX/NormalCar2.fbx";
        break;
      case 2:
        pathStr = "resources/car_pack/FBX/SportsCar2.fbx";
        break;
      case 3:
        pathStr = "resources/car_pack/FBX/SUV.fbx";
        break;
      case 4:
        pathStr = "resources/car_pack/FBX/Taxi.fbx";
        break;
      case 5:
        pathStr = "resources/car_pack/FBX/Cop.fbx";
        break;
      default:
        pathStr = "resources/car_pack/FBX/NormalCar1.fbx";
        break;
    }

    //loading in the fbx model
    loader.load(pathStr, function (fbx) {
      fbx.scale.setScalar(0.0045);

      fbx.quaternion.setFromAxisAngle(
        new THREE.Vector3(1, 0, 0),
        -90 * (Math.PI / 180)
      );

      fbx.traverse((c) => {
        let materials = c.material;
        if (!(c.material instanceof Array)) {
          materials = [c.material];
        }

        for (let m of materials) {
          if (m) {
            m.specular = new THREE.Color(0x000000);
            m.color.offsetHSL(0, 0.25, 0);
          }
        }
        c.castShadow = true;
        c.receiveShadow = true;
      });
      obj.add(fbx);
    });

    obj.userData = { type: "obstacle" };//allows us to identify it later
    obj.name = "obs";
    this._setupObstacle(obj);
    this.objectsParent.add(obj);//adding the model to the THREE group of obstacles
  }

  //function to create the different skydomes required for the different levels
  //each of them is a sphere geometry with a texture of the sky painted on the inside of the sphere
  //so basically the player car and everything visible in the scene is inside the sky sphere
  _createSky() {
    //day sky
    var geometry = new THREE.SphereGeometry(30, 100, 60);
    var material = new THREE.MeshBasicMaterial();
    material.map = new THREE.TextureLoader().load("resources/sky.jpg");
    material.side = THREE.BackSide;
    this.skydome = new THREE.Mesh(geometry, material);

    //night sky with a smaller sphere geometry to make it appear as if obstacles are spawning closer to the player car
    //gives user less time to react to newly spawned obstacles
    var geometry2 = new THREE.SphereGeometry(15, 100, 60);
    var material2 = new THREE.MeshBasicMaterial();
    material2.map = new THREE.TextureLoader().load("resources/night_sky.jpg");
    material2.side = THREE.BackSide;
    this.skydome2 = new THREE.Mesh(geometry2, material2);

    //afternoon sky with a smaller sphere geometry to make it appear as if obstacles are spawning closer to the player car
    //gives user less time to react to newly spawned obstacles
    var geometry3 = new THREE.SphereGeometry(20, 100, 60);
    var material3 = new THREE.MeshBasicMaterial();
    material3.map = new THREE.TextureLoader().load(
      "resources/afternoon_sky.jpg"
    );
    material3.side = THREE.BackSide;
    this.skydome3 = new THREE.Mesh(geometry3, material3);

    this.scene.add(this.skydome);
    this.scene.add(this.skydome2);
    this.scene.add(this.skydome3);
  }

  /*function used to place obstacles in the scene, as well as continuously
  respawn them in a random lane, at a random distance away from the user
  */
  _setupObstacle(obj, refZPos = 0) {
    let lane = math._randomInt(0, 4);//select a lane at random
    let currZ = refZPos - 10 - math._randomFloat(0, 10);//used so obstacles dont spawn too close or too far away from the player car

    /*the code below is used to help prevent obstacles from spawning inside one another
    loops throught the array which contains all of the z positions of the obstacles
    if the obstacle is too close to another obstacle it moves it a bit
    */
    this.posArr[this.obstacleCounter] = currZ;//array storing the z position of the obstacles
    for (let j = 0; j < this.posArr.length; j++) {
      for (let i = 0; i < this.posArr.length; i++) {
        if (this.posArr[i] - currZ - this.objectsParent.position.z < 0.75) {
          currZ = currZ - 1.25; //changing the z position of the current obstacle
          this.posArr[this.obstacleCounter] = currZ; //updating the array
        }
      }
    }

    //placing the obstacle in the correct lane
    if (lane == 0) {
      obj.position.set(-2, 0, currZ);
    } else if (lane == 1) {
      obj.position.set(-0.75, 0, currZ);
    } else if (lane == 2) {
      obj.position.set(0.75, 0, currZ);
    } else if (lane == 3) {
      obj.position.set(2, 0, currZ);
    }

    //updating the amount of obstacles we have in the scene, necessary for the array used for holding the z positions
    this.obstacleCounter = this.obstacleCounter + 1;
    /*the if statement below basically means that if all the obstacles have been placed in the scene 
    the count must go back to zero so that when they are respawned the count will be correct 
    and we will be referencing correct elements in the array*/
    if (this.obstacleCounter == this.posArr.length) {
      this.obstacleCounter = 0;
    }
  }
}
