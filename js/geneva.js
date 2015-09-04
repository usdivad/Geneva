var Geneva = Geneva || {};

// Namespace-wide variables
Geneva.crossoverRate = 0.7;
Geneva.mutationRate = 0.2;
Geneva.root = 440;
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
    guqin: [1, 3/4, 2/3, 1/2, 1/3, 1/4],
    just: [1, 9/8, 5/4, 4/3, 3/2, 5/3, 15/8, 2/1]
};

// Defaults
Geneva.DEFAULT_SCALE = Geneva.tunings.guqin;
Geneva.DEFAULT_CHROMOSOMES = 10;
Geneva.DEFAULT_NOTES = 10;
Geneva.DEFAULT_OCTAVES = 3;
Geneva.DEFAULT_MAX_STEP_SIZE = 3;

Geneva.phraseMutationMethods = [Geneva.invert, Geneva.transpose, Geneva.retrograde];
Geneva.noteMutationMethods = [Geneva.addNote, Geneva.removeNote, Geneva.scaleNoteRhythm];
Geneva.pitchMutationMethods = [];
Geneva.rhythmMutationMethods = [];

// Geneva.setScale = function(tunings) {
//     if (tunings === undefined) {
//         tunings = Geneva.tunings.shierlu;
//     }
//     var scaleMatrix = Geneva.scaleMatrices[Object.keys(Geneva.scaleMatrices).choose()];
//     var scale = [];
//     for (var i=0; i<scaleMatrix.length; i++) {
//         if (scaleMatrix[i] == 1) {
//             scale.push(tunings[i]);
//         }
//     }
//     this.scale = scale;
// }


// Session class
Geneva.Session = function(tunings, root) {
    if (tunings === undefined) {
        tunings = Geneva.tunings.shierlu;
    }
    if (root === undefined) {
        root = Geneva.root;
    }
    var scaleMatrix = Geneva.scaleMatrices[Object.keys(Geneva.scaleMatrices).choose()];
    var scale = [];
    for (var i=0; i<scaleMatrix.length; i++) {
        if (scaleMatrix[i] == 1) {
            scale.push(tunings[i]);
        }
    }
    this.scale = scale;
    this.root = root;
    this.chromosomes = [];
    this.interval = T("interval");
};

Geneva.Session.prototype = {
    constructor: Geneva.Session,

    populate: function(numChromosomes, numNotes, octaveRange, mode) {
        for (var i=0; i<numChromosomes; i++) {
            var chromosome = new Geneva.Chromosome();
            chromosome.generateNotes(numNotes, this.scale, octaveRange, mode);
            this.chromosomes[i] = chromosome;
        }
    }, 

    play: function() {
        var chromosomes = this.chromosomes;
        var scale = this.scale;
        var root = this.root;

        for (var i=0; i<chromosomes.length; i++) {
            chromosomes[i].synth.play();
        }

        // for initial testing; to implement rhythm move the actual T("interval") to Chromosome class
        this.interval = T("interval", {interval: 500}, function(count) {
            console.log("<!--count " + count + "-->");
            for (var i=0; i<chromosomes.length; i++) {
                var chromosome = chromosomes[i];
                var note = chromosome.notes[count % chromosome.notes.length];
                var freq = scale[note.scaleDegree] * note.octave * root;
                chromosome.synth.noteOnWithFreq(freq, 64);
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
    this.synth = T("PluckGen", {env: T("perc", {a:50, r: 1000}), mul: 0.5});

    if (notes !== undefined) {
        this.notes = notes;
    }
};

Geneva.Chromosome.prototype = {
    constructor: Geneva.Chromosome,

    generateNotes: function(n, scale, octaveRange, mode) {
        var notes = [];

        if (scale === undefined) {
            scale = Geneva.DEFAULT_SCALE;
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
            var maxStepSize = Geneva.DEFAULT_MAX_STEP_SIZE;
            for (var i=0; i<n; i++) {
                var reverseDirection = Math.random();
                var step = Math.floor(Math.random()*maxStepSize) + 1; // up
                if (reverseDirection > 0.5) { // down
                    step *= -1;
                }
                noteIdx += step;
                noteIdx = Math.abs(noteIdx % scale.length); // normalize
                var octave = Math.min(Math.abs(Math.ceil(noteIdx / scale.length)), octaveRange);
                notes.push(new Geneva.Note(scale[noteIdx], noteIdx, octave, 1));
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
var session = new Geneva.Session();
session.populate(Geneva.DEFAULT_CHROMOSOMES, Geneva.DEFAULT_NOTES, Geneva.DEFAULT_OCTAVES, "random");
var c0 = session.chromosomes[0];
console.log(c0);
c0.invert(session.scale);