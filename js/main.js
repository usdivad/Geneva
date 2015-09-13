
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
        session.evolve();
    });

};