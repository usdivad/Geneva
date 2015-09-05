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
    just: [1, 9/8, 5/4, 4/3, 3/2, 5/3, 15/8, 2/1]
};

// Defaults
Geneva.defaults = {
    // Population settings
    tuning: Geneva.tunings.shierlu,
    root: 220,
    numChromosomes: 1,
    numNotes: 8,
    octaveRange: 2,
    maxStepSize: 2,

    // Gen
    crossoverRate: 0.7,
    mutationRate: 0.2,

    // Performance
    interval: 500,
    velocity: 64
};

Geneva.phraseMutationMethods = [Geneva.invert, Geneva.transpose, Geneva.retrograde];
Geneva.noteMutationMethods = [Geneva.addNote, Geneva.removeNote, Geneva.scaleNoteRhythm];
Geneva.pitchMutationMethods = [];
Geneva.rhythmMutationMethods = [];

// Session class
Geneva.Session = function(tunings, root) {
    if (tunings === undefined) {
        tunings = Geneva.defaults.tuning;
    }
    if (root === undefined) {
        root = Geneva.defaults.root;
    }

    var scaleMatrix = Geneva.scaleMatrices[Object.keys(Geneva.scaleMatrices).choose()];
    var scale = [];
    for (var i=0; i<Math.min(scaleMatrix.length, tunings.length); i++) {
        if (scaleMatrix[i] == 1) {
            scale.push(tunings[i]);
        }
    }
    this.scale = scale;
    console.log(this.scale);
    this.root = root;
    this.chromosomes = [];
    this.interval = T("interval");
};

Geneva.Session.prototype = {
    constructor: Geneva.Session,

    // Create scale from tuning based on scale matrix
    setScale: function(tunings, matrix) {
        var scale = [];
        for (var i=0; i<Math.min(matrix.length, tunings.length); i++) {
            if (matrix[i] == 1) {
                scale.push(tunings[i]);
            }
        }
        this.scale = scale;
        console.log(this.scale);
    },

    populate: function(numChromosomes, numNotes, octaveRange, mode) {
        for (var i=0; i<numChromosomes; i++) {
            var chromosome = new Geneva.Chromosome();
            chromosome.generateNotes(numNotes, this.scale, octaveRange, mode);
            this.chromosomes[i] = chromosome;
        }
    },

    invertAll: function() {
        for (var i=0; i<this.chromosomes.length; i++) {
            this.chromosomes[i].invert(this.scale);
        }
    },

    play: function() {
        var chromosomes = this.chromosomes;
        var scale = this.scale;
        var root = this.root;
        var interval = Geneva.defaults.interval;
        var vel = Geneva.defaults.velocity;

        for (var i=0; i<chromosomes.length; i++) {
            chromosomes[i].synth.play();
        }

        // for initial testing; to implement rhythm move the actual T("interval") to Chromosome class
        this.interval = T("interval", {interval: interval}, function(count) {
            console.log("<!--count " + count + "-->");
            for (var i=0; i<chromosomes.length; i++) {
                var chromosome = chromosomes[i];
                var note = chromosome.notes[count % chromosome.notes.length];
                var freq = scale[note.scaleDegree] * (note.octave + 1) * root;
                console.log("ratio:" + scale[note.scaleDegree] + ", sd:" + note.scaleDegree + ", oct:" + note.octave + ", root:" + root);
                chromosome.synth.noteOnWithFreq(freq, vel);
                console.log("chromosome " + i + " playing " + freq);
            }
        }).start();
    },

    stop: function() {
        this.interval.stop();
    }
};

// Chromosome class
Geneva.Chromosome = function(notes) {
    this.notes = [];
    this.synth = T("PluckGen", {env: T("perc", {a:50, r: 1000}), mul: 0.5}).play();
    // this.interval = T("interval", {interval: 500});

    if (notes !== undefined) {
        this.notes = notes;
    }
};

Geneva.Chromosome.prototype = {
    constructor: Geneva.Chromosome,

    generateNotes: function(n, scale, octaveRange, mode) {
        var notes = [];

        if (scale === undefined) {
            console.log("No scale selected!");
            return;
        }

        // Choose random notes from scale
        if (mode == "random" || mode === undefined) {
            for (var i=0; i<n; i++) {
                var scaleDegree = Math.floor(Math.random()*scale.length);
                var note = scale[scaleDegree];
                var octave = Math.floor(Math.random()*octaveRange);
                notes.push(new Geneva.Note(scaleDegree, octave, 1));
            }
        }
        // Drunk walk along scale
        else if (mode == "drunk") {
            var noteIdx = Math.floor(Math.random()*scale.length);
            var maxStepSize = Geneva.defaults.maxStepSize;
            for (var i=0; i<n; i++) {
                var reverseDirection = Math.random();
                var step = Math.floor(Math.random()*maxStepSize) + 1; // up
                if (reverseDirection > 0.5) { // down
                    step *= -1;
                }
                noteIdx += step;
                noteIdx = Math.abs(noteIdx % scale.length); // normalize
                var octave = Math.min(Math.abs(Math.floor(noteIdx / scale.length)), octaveRange);
                console.log(octave);
                notes.push(new Geneva.Note(noteIdx, octave, 1));
            }

        }
        else if (mode == "arpeggio") {

        }

        this.notes = notes;
    },

    mutate: function() {
        // Chromosome mutation

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
    },

    // Invert pitches, based on scale, around the first note in the sequence
    // Assert that c.invert().invert() == c, EXCEPT for notes where the inversion's octave < 0
    invert: function(scale) {
        var center = this.notes[0];
        var str = "";
        for (var i=1; i<this.notes.length; i++) {
            var note = this.notes[i];
            str += "note before: " + note.toString() + "\n";
            
            var distance = (center.scaleDegree + (center.octave*scale.length)) - (note.scaleDegree + (note.octave*scale.length));
            str += "center: " + center.toString() + "\n";
            str += "distance: " + distance + "\n"

            // Calculate scale degree and octave
            note.scaleDegree = (center.scaleDegree + (distance % scale.length)) % scale.length;
            note.octave = center.octave + Math.floor(distance / scale.length);

            // Adjustments based on boundaries
            if (note.scaleDegree < 0) {
                note.scaleDegree = scale.length + note.scaleDegree;
            }
            if (note.octave < 0) {
                note.octave = 0;
            }

            str += "note after: " + note.toString() + "\n\n";
            
            // Debug output
            console.log(str);
            
            this.notes[i] = note;
        }
    },

    transpose: function(maxStepSize) {

    },

    toString: function() {
        var str = "";
        for (var i=0; i<this.notes.length; i++) {
            str += this.notes[i].toString() + "\n";
        }
        return str;
    }
};

Geneva.crossover = function(c1, c2) {

};

// Note class
// pitch represented as tuning ratio (during performance, multiplied by Geneva.root)
Geneva.Note = function(s, v, r) {
    // this.pitch = p;
    this.scaleDegree = s;
    this.octave = v;
    this.rhythm = r;
}

Geneva.Note.prototype = {
    mutateRhythm: function() {
        var mutationMethod = Geneva.rhythmMutationMethods.choose(); //this.rhythmMutationMethods?
        return mutationMethod(this);
    },

    transpose: function(step, scale) {
        if (typeof(scale) === undefined) {
            this.pitch += step;
        }
        else {
            // modulo stuff and w scales
        }
    },

    toPitch: function(scale) {
        return scale[this.scaleDegree] * this.octave;
    },

    toString: function() {
        return "{scaleDegree: " + this.scaleDegree
                + ", octave: " + this.octave
                + ", rhythm: " + this.rhythm
                + "}";
    }

};


/*
 * TESTING
 */
window.onload = function() {
    var session = new Geneva.Session();
    session.setScale(Geneva.tunings.just, Geneva.scaleMatrices.ones);
    session.populate(Geneva.defaults.numChromosomes, Geneva.defaults.numNotes, Geneva.defaults.octaveRange, "drunk");
    var c0 = session.chromosomes[0];
    console.log(c0);
    // c0.invert(session.scale);


    document.getElementById("playBtn").addEventListener("click", function() {
        session.play();
    });

    document.getElementById("stopBtn").addEventListener("click", function() {
        session.stop();
    });

    document.getElementById("invertBtn").addEventListener("click", function() {
        session.invertAll();
    });
};