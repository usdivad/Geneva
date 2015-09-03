var Geneva = Geneva || {};

// Namespace-wide variables
Geneva.crossoverRate = 0.7;
Geneva.mutationRate = 0.2;
Geneva.root = 440;
Geneva.phraseMutationMethods = [Geneva.invert, Geneva.transpose, Geneva.retrograde];
Geneva.noteMutationMethods = [Geneva.addNote, Geneva.removeNote, Geneva.scaleNoteRhythm];
Geneva.pitchMutationMethods = [];
Geneva.rhythmMutationMethods = [];


// Session class
Geneva.Session = function(tunings) {
    if (tunings == undefined) {
        tunings = Geneva.scale.shierlu;
    }
    var scaleMatrix = Geneva.scaleMatrices.choose();
    var scale = [];
    for (var i=0; i<scaleMatrix.length; i++) {
        if (scaleMatrix[i] == 1) {
            scale.push(tunings[i]);
        }
    }
    this.scale = scale;
    this.chromosomes = [];
}

Geneva.Session.prototype = {
    constructor: Geneva.Session,

    populate: function(n) {
        for (i=0; i<n; i++) {
            var notes = this.generateNotes();
            this.chromosomes[i] = new Geneva.Chromosome(notes);
        }
    },

    generateNotes: function(n, mode="random") {
        var notes = [];

        if (mode == "random") {
            for (var i=0; i<n; i++) {
                var note = this.scale[Math.floor(Math.random()*this.scale.length)];
                notes.push(new Geneva.Note(note, 1));
            }
        }
        else if (mode == "drunk") {
            var noteIdx = Math.floor(Math.random()*this.scale.length);
            var maxStepSize = 3;
            for (var i=0; i<n; i++) {
                var reverseDirection = Math.random();
                var step = Math.floor(Math.random()*maxStepSize) + 1; // up
                if (reverseDirection > 0.5) { // down
                    step *= -1;
                }
                noteIdx += step;
                noteIdx = Math.abs(noteIdx % this.scale.length); // normalize
                notes.push(new Geneva.Note(this.scale[noteIdx], 1));
            }

        }
        else if (mode == "arpeggio") {

        }

        return notes;
    }
}

// Chromosome class
Geneva.Chromosome = function(notes) {
    this.notes = [];
    this.timbre = {};

    if (notes != undefined) {
        this.notes = notes;
    }
};

Geneva.Chromosome.prototype = {
    constructor: Geneva.Chromosome,

    mutate: function() {
        // Phrase mutation

        // Note-by-note mutation
        for (var i=0; i<this.notes.length; i++) {
            var dice = Math.random();
            if (dice > Geneva.crossoverRate) {
                var note = this.notes[i].mutate();
                var p = note.pitch;
                var r = note.rhythm;
                if (r == 0) { // removeNote
                    this.notes = this.notes.splice(i, 1);
                }
                else if (r < 0) { // addNote; use absolute value of r
                    this.notes = this.notes.splice(i+1, 0, new Geneva.Note(p, Math.abs(r)));
                    
                }
                else {
                    this.notes[i] = new Geneva.Note(p, r);
                }
            }
        }
    }

    invert: function(root) {
        for (var i=0; i<this.notes.length; i++) {
            var pitch = this.notes[i].pitch;
            // invert around root
        }
    }
};

Geneva.crossover = function(c1, c2) {

};

// Note class
// pitch represented as tuning ratio (during performance, multiplied by Geneva.root)
Geneva.Note = function(p, r) {
    this.pitch = p;
    this.rhythm = r;
}

Geneva.Note.prototype = {
    mutateRhythm: function() {
        var mutationMethod = Geneva.rhythmMutationMethods.choose(); //this.rhythmMutationMethods?
        return mutationMethod(this);
    }

    transpose: function(step, scale) {
        if (typeof(scale) === undefined) {
            this.pitch += step;
        }
        else {
            // modulo stuff and w scales
        }
    }

};


Geneva.scaleMatrices = {
    // MIDI absolute notes
    // pentatonic: [60, 63, 65, 67, 70],
    // pentatonicDorian: [60, 63, 65, 67, 69, 70]

    // MIDI relative distances
    // pentatonic: [0, 3, 5, 7, 10],
    // pentatonicDorian: [0, 3, 5, 7, 9, 10]

    // Scale booleans based on shierlu tuning ratios    
    yu:      [1,0,0,1,0,1,0,1,0,0,1,0],
    shang:   [1,0,1,0,0,1,0,1,0,0,1,0],
    gong:    [1,0,1,0,1,0,0,1,0,1,0,0],
    jue:     [1,0,0,1,0,1,0,0,1,0,1,0],
    zhi:     [1,0,1,0,0,1,0,1,0,1,0,0]
}

Geneva.tunings = {
    shierlu: [1, 2187/2048, 9/8, 1968/1630, 81/64, 1771/1311, 729/512, 3/2, 6561/4096, 27/16, 5905/3277, 243/128],
    just: [1, 9/8, 5/4, 4/3, 3/2, 5/3, 15/8, 2/1]
};


/*
 * TESTING
 */
var session = new Geneva.Session(Geneva.tunings.shierlu);