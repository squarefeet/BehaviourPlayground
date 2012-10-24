// Create the main event store. Events will be added (.on(...)), removed
// (.off(...)), and fired (.fire(...)) from this object. 
var eventHandler = new EventHandler();

// Create a key handler. Note that this isn't used by most (if any) camera
// movements. Those are handled by three.js.
// It also doesn't use the EventHandler! Maybe it should...
var keyHandler = new KeyHandler();

// Create a mouse handler. Note that this isn't used by most (if any) camera
// movements. Those are handled by three.js.
// It also doesn't use the EventHandler. Maybe it should...
var mouseHandler = new MouseHandler();

// Create a scene manager that'll hold all the scenes and game objects. It organises
// things into three groups (background (skybox, etc), middleground (stuff
// what moves), and foreground (the HUD)). Each group is then sorted according
// to its "z-index" value, so you can control the rendering order.
var sceneManager = new SceneManager();


var box,
    type,
    enemyStartX = -50
    friendlyStartX = 50,
    boxes = {
        enemy: [],
        friendly: [],
        defendPoint: null
    },

    numDrones = 20,

    is3D = !false;


// Create box to defend
boxes.defendPoint = new Box(
    'defendPoint', 
    new THREE.Vector3(
        0,
        0,
        -100
    ),
    10,
    boxes
);

// Add this defendPoint to the main scene
sceneManager.addObjectTo('middleground', boxes.defendPoint);



// Create the drones!
for(var i = 0; i < numDrones; ++i) {

    type = Math.random() >= 0.5 ? 'friendly' : 'enemy';

    box = new Box(
        type, // whether it's a friendly or an enemy box
        new THREE.Vector3(
            // (Math.random() * 100) - 50,
            // (Math.random() * 100) - 50,
            type === 'enemy' ? enemyStartX : friendlyStartX,
            type === 'enemy' ? boxes.enemy.length * 10 : boxes.friendly.length * 10,
            is3D ? (-50 * Math.random() * 10) : -100
        ), // position
        2, // size
        boxes // the object that's holding all the boxes EVAH
    );

    // push this box into the big box object that's got boxes in it.
    boxes[type].push(box);

    // Add this box to the main scene so we can see it fly about n shit.
    sceneManager.addObjectTo('middleground', box);
}


console.log('Enemies:', boxes.enemy.length);
console.log('Friendlies:', boxes.friendly.length);





// Create the renderer. By default it'll set width and height to window values
// and attach the domElement to document.body. You only need one of these.
var renderer = new Renderer();

// Tell the renderer to use the object manager we just created
renderer.setSceneManager( sceneManager );

// Render the scene!
renderer.start();









