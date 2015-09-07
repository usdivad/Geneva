
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
    console.log(c0);
    // c0.invert(session.scale);


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

};