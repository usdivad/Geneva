// By bunnybones1
// https://github.com/bunnybones1/threejs-gui-crosshair

function Crosshair() {
    var geom = new THREE.Geometry();
    var white = new THREE.Color(1,1,1);
    var black = new THREE.Color(0,0,0);
    var petals = 8;
    var radiusInner = 0.01;
    var radiusOuter = 0.1;
    for (var i=0; i<petals; i++) {
        var ratio = i/petals;
        var angle = ratio * Math.PI * 2;

        geom.vertices.push(new THREE.Vector3(
            Math.cos(angle) * radiusInner,
            Math.sin(angle) * radiusInner,
            0
        ));
        geom.vertices.push(new THREE.Vector3(
            Math.cos(angle) * radiusOuter,
            Math.sin(angle) * radiusOuter,
            0
        ));

        var odd = (i%2) != 0;
        geom.colors.push(odd ? white : black);
        geom.colors.push(odd ? white : black);
    }

    THREE.Line.call(
        this,
        geom,
        new THREE.LineBasicMaterial({
            color: 0xffffff,
            vertexColors: true
        }),
        THREE.LinePieces
    );

    // return new THREE.Line(geom, new THREE.LineBasicMaterial({color: 0xffffff, vertexColors:true}), THREE.LinePieces);

    // console.log(this);
}

Crosshair.prototype = Object.create(THREE.Line.prototype);