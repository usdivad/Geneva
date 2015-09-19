
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

    var n0 = Array.apply(null, Array(Geneva.defaults.numNotes)).map(Number.prototype.valueOf, 0);
    c0 = new Geneva.Chromosome(n0, session.scale);
    session.chromosomes[0] = c0;
    session.updateDisplays();
    // c0.invert(session.scale);

    var c1 = session.chromosomes[1];
    var cc = session.crossover(0, 1);
    console.log("crossover'd: " + cc.toHTML());

    

    // Setup scene with three.js
    var camera, scene, renderer;
    var geometry, material, mesh;
    var controls;

    var objects = [];

    var raycaster;

    var blocker = document.getElementById( 'content' );
    var instructions = document.getElementById( 'gameBtn' );

    // http://www.html5rocks.com/en/tutorials/pointerlock/intro/

    var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;

    if ( havePointerLock ) {

        var element = document.body;

        var pointerlockchange = function ( event ) {

            if ( document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element ) {

                controlsEnabled = true;
                controls.enabled = true;

                blocker.style.display = 'none';

            } else {

                controls.enabled = false;

                blocker.style.display = '-webkit-box';
                blocker.style.display = '-moz-box';
                blocker.style.display = 'box';

                instructions.style.display = '';

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
                    if ( canJump === true ) velocity.y += 1000;
                    canJump = false;
                    break;

            }

        };

        var onKeyUp = function ( event ) {

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

        material = new THREE.MeshBasicMaterial( { vertexColors: THREE.VertexColors } );

        mesh = new THREE.Mesh( geometry, material );
        scene.add( mesh );

        // objects

        geometry = new THREE.BoxGeometry( 20, 20, 20 );

        for ( var i = 0, l = geometry.faces.length; i < l; i ++ ) {

            var face = geometry.faces[ i ];
            face.vertexColors[ 0 ] = new THREE.Color().setHSL( Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );
            face.vertexColors[ 1 ] = new THREE.Color().setHSL( Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );
            face.vertexColors[ 2 ] = new THREE.Color().setHSL( Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );

        }

        // this is where the boxes get created
        for ( var i = 0; i < session.chromosomes.length; i ++ ) {

            material = new THREE.MeshPhongMaterial( { specular: 0xffffff, shading: THREE.FlatShading, vertexColors: THREE.VertexColors } );

            var mesh = new THREE.Mesh( geometry, material );
            // mesh.position.x = Math.floor( Math.random() * 20 - 10 ) * 20;
            // mesh.position.y = Math.floor( Math.random() * 20 ) * 20 + 10;
            // mesh.position.z = Math.floor( Math.random() * 20 - 10 ) * 20;

            var halfway = session.chromosomes.length/2;
            if (i < halfway) {
                mesh.position.x = -30 * Math.abs(halfway-i);
            }
            else {
                mesh.position.x = 30 * Math.abs(halfway-i);
            }
            mesh.position.y = 10;
            mesh.position.z = -50;
            mesh.name = "chromosomeMesh" + i;
            scene.add( mesh );

            material.color.setHSL( Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );

            objects.push( mesh );

            // bind to chromosomes
            session.chromosomes[i].bindAnimator(mesh);

        }

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
            raycaster.ray.origin.y -= 10;

            var intersections = raycaster.intersectObjects( objects );

            var isOnObject = intersections.length > 0;

            var time = performance.now();
            var delta = ( time - prevTime ) / 1000;

            velocity.x -= velocity.x * 10.0 * delta;
            velocity.z -= velocity.z * 10.0 * delta;

            velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

            if ( moveForward ) velocity.z -= 400.0 * delta;
            if ( moveBackward ) velocity.z += 400.0 * delta;

            if ( moveLeft ) velocity.x -= 400.0 * delta;
            if ( moveRight ) velocity.x += 400.0 * delta;

            if ( isOnObject === true ) {
                velocity.y = Math.max( 0, velocity.y );

                canJump = true;
            }

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

    }


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


};