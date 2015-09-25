var Geneva = Geneva || {};

// Namespace-wide variables
Geneva.scaleMatrices = {
    // MIDI absolute notes
    // pentatonic: [60, 63, 65, 67, 70],
    // pentatonicDorian: [60, 63, 65, 67, 69, 70]

    // MIDI relative distances
    // pentatonic: [0, 3, 5, 7, 10],
    // pentatonicDorian: [0, 3, 5, 7, 9, 10]

    // Scale booleans based on shierlu tuning ratios
    ones:     [1,1,1,1,1,1,1,1,1,1,1,1],    
    yu:      [1,0,0,1,0,1,0,1,0,0,1,0],
    shang:   [1,0,1,0,0,1,0,1,0,0,1,0],
    gong:    [1,0,1,0,1,0,0,1,0,1,0,0],
    jue:     [1,0,0,1,0,1,0,0,1,0,1,0],
    zhi:     [1,0,1,0,0,1,0,1,0,1,0,0]
}

Geneva.tunings = {
    shierlu: [1, 2187/2048, 9/8, 1968/1630, 81/64, 1771/1311, 729/512, 3/2, 6561/4096, 27/16, 5905/3277, 243/128],
    // shierlu: [1, 1.06787109375, 1.125, 1.207361963190184, 1.265625, 1.3508771929824561, 1.423828125, 1.5, 1.601806640625, 1.6875, 1.801953005797986, 1.8984375],
    guqin: [1, 3/4, 2/3, 1/2, 1/3, 1/4],
    just: [1, 9/8, 5/4, 4/3, 3/2, 5/3, 15/8]
};

// Defaults
Geneva.defaults = {
    // Population settings
    tuning: Geneva.tunings.shierlu,
    matrix: Geneva.scaleMatrices.ones,
    root: 220,
    numChromosomes: 10,
    numNotes: 32,
    octaveRange: 5,
    maxStepSize: 3,
    restPrb: 3/5,

    // Gen
    crossoverRate: 0.7,
    mutationRate: 1,
    maxRotations: 5,

    // Performance
    interval: 250,
    velocity: 64,
    accFactor: 50
};
Geneva.REST = -1;
// Geneva.HOLD = -2;

Geneva.waves = ["sin", "saw", "tri", "pulse", "fami"];


Geneva.mutationMethods = ["reverse", "rotate", "invert", "sortAsc", "sortDesc", "transpose"];
Geneva.mutationPrbs =    [ 0.20,      0.20,     0.20,     0.05,      0.05,       0.3];
// Geneva.phraseMutationMethods = [Geneva.invert, Geneva.transpose, Geneva.retrograde];
// Geneva.noteMutationMethods = [Geneva.addNote, Geneva.removeNote, Geneva.scaleNoteRhythm];
// Geneva.pitchMutationMethods = [];
// Geneva.rhythmMutationMethods = [];


//  Functions
Geneva.createScale = function(tunings, matrix) {
    var scale = [];
    for (var i=0; i<Math.min(matrix.length, tunings.length); i++) {
        if (matrix[i] == 1) {
            scale.push(tunings[i]);
        }
    }
    return scale;
}

Geneva.distance =  function(x0,y0,z0,x1,y1,z1) {
    var dx = x1 - x0;
    var dy = y1 - y0;
    var dz = z1 - z0;

    // adjustments for playability
    // if (dz > dx) {
    //     dx = 0;
    // }
    dz *= 0.5;


    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}