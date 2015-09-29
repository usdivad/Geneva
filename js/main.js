
/*
 * TESTING
 */
window.onload = function() {
    var session = new Geneva.Session();
    console.log(session);
    session.setScale(Geneva.tunings.just, Geneva.scaleMatrices.ones);
    session.setScale(Geneva.tunings.shierlu, Geneva.scaleMatrices.yu);
    session.populate(Geneva.defaults.numChromosomes, Geneva.defaults.numNotes, Geneva.defaults.octaveRange, "random");
    var c0 = session.chromosomes[0];
    console.log("c0: " + c0.toHTML());

    // init tests
    // var n0 = Array.apply(null, Array(Geneva.defaults.numNotes)).map(Number.prototype.valueOf, 0);
    // c0 = new Geneva.Chromosome(n0, session.scale);
    // session.chromosomes[0] = c0;
    // session.updateDisplays();
    // // c0.invert(session.scale);

    // var c1 = session.chromosomes[1];
    // var cc = session.crossover(0, 1);
    // console.log("crossover'd: " + cc.toHTML());


    // Populate with tweets
    var twitterConfig = {
        "id": "647395831872679937",
        "domId": "twitterDisplay",
        "maxTweets": Geneva.defaults.numChromosomes,
        "enableLinks": false,
        "showUser": true,
        "showImages": false,
        "showRetweet": false,
        "customCallback": handleTweets
    };

    function handleTweets(tweets) {
        for (var i=0; i<tweets.length; i++) {
            var tweet = tweets[i];
            var elm = document.createElement("html");
            elm.innerHTML = tweet;
            var tweetContent = elm.getElementsByClassName("tweet")[0].innerText;
            var tweetUser = elm.getElementsByClassName("user")[0].innerText.replace(/\s+/g, " ");
            console.log(tweetContent + " by " + tweetUser);
            session.chromosomes[i].tweet = tweetContent;
            session.chromosomes[i].updateAnimator();
        }
    }

    console.log(twitterFetcher);
    twitterFetcher.fetch(twitterConfig);

    

    // Setup scene with three.js
    var camera, scene, renderer;
    var geometry, material, mesh;
    var controls;

    var objects = [];

    var raycaster;

    // mouse stuff
    var mouse_ray = new THREE.Raycaster(new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,0));
    // var mouse_vector = new THREE.Vector3();
    // var mouse = {x:0, y:0, z:1};
    // var mouse_intersects = [];
    var crosshair = new Crosshair();
    console.log(crosshair);

    var blocker = document.getElementById( 'blocker' );
    var instructions = document.getElementById( 'instructions' );
    var instructionsOn = true;

    // http://www.html5rocks.com/en/tutorials/pointerlock/intro/

    var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;

    if ( havePointerLock ) {

        var element = document.body;

        var pointerlockchange = function ( event ) {

            if ( document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element ) {

                controlsEnabled = true;
                controls.enabled = true;

                blocker.style.display = 'none';

                session.play();
                document.getElementById("gameheader").style.color = "black";
                document.getElementById("usdivad").style.color = "black";


            } else {

                controls.enabled = false;

                blocker.style.display = '-webkit-box';
                blocker.style.display = '-moz-box';
                blocker.style.display = 'box';

                instructions.style.display = '';

                session.stop();
                document.getElementById("gameheader").style.color = "white";
                document.getElementById("usdivad").style.color = "white";

            }

        }

        var pointerlockerror = function ( event ) {

            instructions.style.display = '';

        }

        // Hook pointer lock state change events
        document.addEventListener( 'pointerlockchange', pointerlockchange, false );
        document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
        document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );

        document.addEventListener( 'pointerlockerror', pointerlockerror, false );
        document.addEventListener( 'mozpointerlockerror', pointerlockerror, false );
        document.addEventListener( 'webkitpointerlockerror', pointerlockerror, false );

        instructions.addEventListener( 'click', function ( event ) {
            instructions.style.display = 'none';

            // Ask the browser to lock the pointer
            element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;

            if ( /Firefox/i.test( navigator.userAgent ) ) {

                var fullscreenchange = function ( event ) {

                    if ( document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element ) {

                        document.removeEventListener( 'fullscreenchange', fullscreenchange );
                        document.removeEventListener( 'mozfullscreenchange', fullscreenchange );

                        element.requestPointerLock();
                    }

                }

                document.addEventListener( 'fullscreenchange', fullscreenchange, false );
                document.addEventListener( 'mozfullscreenchange', fullscreenchange, false );

                element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;

                element.requestFullscreen();

            } else {

                element.requestPointerLock();

            }

        }, false );

    } else {

        instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';

    }

    init();
    animate();

    var controlsEnabled = false;

    var moveForward = false;
    var moveBackward = false;
    var moveLeft = false;
    var moveRight = false;
    var mouseChromosome = false;

    var prevTime = performance.now();
    var velocity = new THREE.Vector3();

    function init() {

        camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 );

        scene = new THREE.Scene();
        scene.fog = new THREE.Fog( 0xffffff, 0, 750 );

        var light = new THREE.HemisphereLight( 0xeeeeff, 0x777788, 0.75 );
        light.position.set( 0.5, 1, 0.75 );
        scene.add( light );

        controls = new THREE.PointerLockControls( camera );
        scene.add( controls.getObject() );

        var onKeyDown = function ( event ) {
            switch ( event.keyCode ) {

                case 38: // up
                case 87: // w
                    moveForward = true;
                    break;

                case 37: // left
                case 65: // a
                    moveLeft = true; break;

                case 40: // down
                case 83: // s
                    moveBackward = true;
                    break;

                case 39: // right
                case 68: // d
                    moveRight = true;
                    break;

                case 32: // space
                    if ( canJump === true ) velocity.y += 500;
                    canJump = false;
                    break;


            }

        };

        var onKeyUp = function ( event ) {

            console.log(event.keyCode);

            switch( event.keyCode ) {

                case 38: // up
                case 87: // w
                    moveForward = false;
                    break;

                case 37: // left
                case 65: // a
                    moveLeft = false;
                    break;

                case 40: // down
                case 83: // s
                    moveBackward = false;
                    break;

                case 39: // right
                case 68: // d
                    moveRight = false;
                    break;

                case 69: // e
                    session.mode = "selected";
                    document.getElementById("mode").innerHTML = "Mode: <span class='selectSpan'>Select</span>";
                    break;
                case 81: // q
                    session.mode = "muted";
                    document.getElementById("mode").innerHTML = "Mode: <span class='muteSpan'>Mute</span>";
                    break;
                case 13: // enter
                    session.evolve(objects);

                // case 27: // ESC
                //     instructions.style.display = 'none';

                //     // Ask the browser to lock the pointer
                //     element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;

                //     if ( /Firefox/i.test( navigator.userAgent ) ) {

                //         var fullscreenchange = function ( event ) {

                //             if ( document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element ) {

                //                 document.removeEventListener( 'fullscreenchange', fullscreenchange );
                //                 document.removeEventListener( 'mozfullscreenchange', fullscreenchange );

                //                 element.requestPointerLock();
                //             }

                //         }

                //         document.addEventListener( 'fullscreenchange', fullscreenchange, false );
                //         document.addEventListener( 'mozfullscreenchange', fullscreenchange, false );

                //         element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;

                //         element.requestFullscreen();

                //     } else {

                //         element.requestPointerLock();

                //     }
                //     break;
            }

            // chromosome selecting using numpad
            if (event.keyCode >= 48 && event.keyCode <= 57) {
                var i = event.keyCode - 49;
                var chromosome;
                if (i < 0) {
                    i = 9;
                }

                if (i > session.chromosomes.length) {
                    i = session.chromosomes.length - 1;
                }

                session.handleClick(i);
            }

        };

        document.addEventListener( 'keydown', onKeyDown, false );
        document.addEventListener( 'keyup', onKeyUp, false );

        raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 10 );

        // floor

        geometry = new THREE.PlaneGeometry( 2000, 2000, 100, 100 );
        geometry.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) );

        for ( var i = 0, l = geometry.vertices.length; i < l; i ++ ) {

            var vertex = geometry.vertices[ i ];
            vertex.x += Math.random() * 20 - 10;
            vertex.y += Math.random() * 2;
            vertex.z += Math.random() * 20 - 10;

        }

        for ( var i = 0, l = geometry.faces.length; i < l; i ++ ) {

            var face = geometry.faces[ i ];
            face.vertexColors[ 0 ] = new THREE.Color().setHSL( Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );
            face.vertexColors[ 1 ] = new THREE.Color().setHSL( Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );
            face.vertexColors[ 2 ] = new THREE.Color().setHSL( Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );

        }

        material = new THREE.MeshBasicMaterial( { vertexColors: "white" } );

        mesh = new THREE.Mesh( geometry, material );
        scene.add( mesh );

        // objects

        geometry = new THREE.BoxGeometry( 20, 20, 20 );

        // color setting
        for ( var i = 0, l = geometry.faces.length; i < l; i ++ ) {

            var face = geometry.faces[ i ];
            // face.vertexColors[ 0 ] = new THREE.Color().setHSL( Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );
            face.vertexColors[0] = new THREE.Color(0x2194ce);
            face.vertexColors[ 1 ] = new THREE.Color().setHSL( Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );
            // face.vertexColors[ 2 ] = new THREE.Color().setHSL( Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );
            face.vertexColors[2] = new THREE.Color(0x2194ce);

        }

        // this is where the boxes get created
        for ( var i = 0; i < session.chromosomes.length; i ++ ) {

            var dynamicTexture = new THREEx.DynamicTexture(1024, 1024);
            dynamicTexture.font = "Helvetica";
            dynamicTexture.clear("white");
            dynamicTexture.drawTextCooked({
                text: "The greatest thing you'll ever learn is just to #love and be loved in return " + i,
            });

            material = new THREE.MeshPhongMaterial( { map: dynamicTexture.texture, specular: 0xffffff, shading: THREE.FlatShading, vertexColors: THREE.VertexColors } );
            
            // material = new THREE.MeshBasicMaterial({
            //     map: dynamicTexture.texture,
            //     color: 0x000000
            // });

            var mesh = new THREE.Mesh( geometry, material );
            // mesh.position.x = Math.floor( Math.random() * 20 - 10 ) * 20;
            // mesh.position.y = Math.floor( Math.random() * 20 ) * 20 + 10;
            // mesh.position.z = Math.floor( Math.random() * 20 - 10 ) * 20;

            var halfway = session.chromosomes.length/2;
            if (i < halfway) {
                mesh.position.x = -50 * Math.abs(halfway-i);
            }
            else {
                mesh.position.x = 50 * Math.abs(halfway-i);
            }
            mesh.position.y = 10;
            mesh.position.z = -100;
            mesh.name = "chromosomeMesh" + i;
            mesh.index = i;
            scene.add( mesh );

            material.color.setHSL( Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );

            objects.push( mesh );

            // bind to chromosomes
            session.chromosomes[i].bindAnimator(mesh);
            // session.chromosomes[i].distance = Geneva.distance(mesh.position.x, velocity.x, mesh.position.y, velocity.y, mesh.position.z, velocity.z);

        }

        crosshair.position.y = 10;
        crosshair.position.z = -5;
        scene.add(crosshair);
        console.log(crosshair.position);
        //

        renderer = new THREE.WebGLRenderer();
        renderer.setClearColor( 0xffffff );
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( window.innerWidth, window.innerHeight );
        document.body.appendChild( renderer.domElement );

        //

        window.addEventListener( 'resize', onWindowResize, false );

    }

    function onWindowResize() {

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize( window.innerWidth, window.innerHeight );

    }

    function animate() {

        requestAnimationFrame( animate );

        if ( controlsEnabled ) {
            raycaster.ray.origin.copy( controls.getObject().position );
            // raycaster.ray.origin.y -= 10;
            
            var pos = controls.getObject().position;
            var dir = new THREE.Vector3();
            controls.getDirection(dir);
            var crosshairDistance = 5;
            // var crosshair_ray = new THREE.Raycaster(pos, dir);
            // var origin = crosshair_ray.ray.origin;

            crosshair.position.x = pos.x + dir.x * crosshairDistance;
            crosshair.position.y = pos.y + dir.y * crosshairDistance;
            crosshair.position.z = pos.z + dir.z * crosshairDistance;
            
            // crosshair.position.x = dir.x;
            // crosshair.position.y = dir.y;
            // crosshair.position.z = dir.z;

            // console.log(crosshair.position);

            var intersections = raycaster.intersectObjects( objects );

            var isOnObject = intersections.length > 0;

            var time = performance.now();
            var delta = ( time - prevTime ) / 1000;
            var accVal = 1200.0;

            velocity.x -= velocity.x * 10.0 * delta;
            velocity.z -= velocity.z * 10.0 * delta;

            velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

            if ( moveForward ) velocity.z -= accVal * delta;
            if ( moveBackward ) velocity.z += accVal * delta;

            if ( moveLeft ) velocity.x -= accVal * delta;
            if ( moveRight ) velocity.x += accVal * delta;

            if ( isOnObject === true ) {
                velocity.y = Math.max( 0, velocity.y );
                console.log(intersections);

                canJump = true;
            }

            // mouse_ray.ray.origin.copy(controls.getObject().position);
            // mouse_ray.ray.direction.copy(controls.getDirection(mouse_ray.ray.origin));

            // var mouse_intersects = mouse_ray.intersectObjects(objects);

            // if (mouseChromosome) {
            //     if (mouse_intersects.length > 0) {
            //         var mi = mouse_intersects[0].object.index;
            //         if (session.chromosomes[mi].selected) {
            //             session.chromosomes[mi].selected = false;
            //         }
            //         else {
            //             session.chromosomes[mi].selected = true;
            //         }
            //         session.chromosomes[mi].updateAnimator();
            //     }
            // }

            controls.getObject().translateX( velocity.x * delta );
            controls.getObject().translateY( velocity.y * delta );
            controls.getObject().translateZ( velocity.z * delta );

            if ( controls.getObject().position.y < 10 ) {

                velocity.y = 0;
                controls.getObject().position.y = 10;

                canJump = true;

            }

            prevTime = time;

        }

        renderer.render( scene, camera );

        session.characterPosition = controls.getObject().position;

    }

    function onMouseDown(e) {
        // e.preventDefault();
        // mouse.x = (e.clientX / renderer.domElement.width) * 2 - 1;
        // mouse.y = (e.clientY / renderer.domElement.height) * 2 - 1;

        // mouse_ray.setFromCamera(mouse, camera);
        // mouse_ray.ray.origin.copy( controls.getObject().position );
        
        // var mouse_ray = new THREE.Raycaster(controls.getObject().position, controls.getDirection(controls.getObject().position));

        var pos = controls.getObject().position;
        var dir = new THREE.Vector3();
        controls.getDirection(dir);
        console.log("pos:");
        console.log(pos);

        var handler = function() {
            mouse_ray.set(pos, dir);
            // mouse_ray.ray.origin.copy(pos);
            // mouse_ray.ray.direction.copy(controls.getDirection(mouse_ray.ray.origin));

            console.log("position:");
            console.log(mouse_ray.ray.origin);
            var mouse_intersects = mouse_ray.intersectObjects(objects);
            console.log(mouse_intersects);
            if (mouse_intersects.length > 0) {
                var mi = mouse_intersects[0].object.index;
                session.handleClick(mi);
            }

            // mouseChromosome = true;
        };

        return handler;

    }


    document.addEventListener("mousedown", function(e) {
        if (controlsEnabled) {
            var eh = onMouseDown();
            eh();
            // mouseChromosome = true;
        }
    });

    document.addEventListener("mouseup", function() {
        // mouseChromosome = false;
    });

    document.getElementById("playBtn").addEventListener("click", function() {
        session.play();
    });

    document.getElementById("stopBtn").addEventListener("click", function() {
        session.stop();
    });

    document.getElementById("reverseBtn").addEventListener("click", function() {
        session.mutateAll("reverse");
    });

    document.getElementById("rotateBtn").addEventListener("click", function() {
        session.mutateAll("rotate");
    });

    document.getElementById("invertBtn").addEventListener("click", function() {
        session.mutateAll("invert");
    });

    document.getElementById("sortAscBtn").addEventListener("click", function() {
        session.mutateAll("sortAsc");
    });

    document.getElementById("sortDescBtn").addEventListener("click", function() {
        session.mutateAll("sortDesc");
    });

    document.getElementById("transposeBtn").addEventListener("click", function() {
        session.mutateAll("transpose");
    });

    document.getElementById("selectedBtn").addEventListener("click", function() {
        x = session.getSelected();
        console.log(x);
    });

    document.getElementById("evolveBtn").addEventListener("click", function() {
        session.evolve(objects);
        // for (var i=0; i<session.length; i++) {
        //     session.chromosomes[i].bindAnimator(objects[i]);
        // }
    });

    console.log(session.interval.interval.value);

};