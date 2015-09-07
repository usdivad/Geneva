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
    root: 220,
    numChromosomes: 2,
    numNotes: 16,
    octaveRange: 3,
    maxStepSize: 2,
    restPrb: 5/24,

    // Gen
    crossoverRate: 0.7,
    mutationRate: 0.2,
    maxRotations: 5,

    // Performance
    interval: 200,
    velocity: 64
};
Geneva.REST = -1;
// Geneva.HOLD = -2;

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

    // Add rests and holds
    // scale = Geneva.addRestsAndHolds(scale);
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
        var cd = document.getElementById("chromosomes");
        var cdHtml = "<h2>Chromosomes</h2>\n";

        for (var i=0; i<numChromosomes; i++) {
            var chromosome = new Geneva.Chromosome();
            chromosome.generateNotes(numNotes, this.scale, octaveRange, mode);
            this.chromosomes[i] = chromosome;

            cdHtml += "<div class=\"chromosomeDisplay\" id=\"chromosome" + i + "\">"
                    + chromosome.toHTML()
                    + "</div>\n";
        }

        cd.innerHTML = cdHtml;
    },

    invertAll: function() {
        for (var i=0; i<this.chromosomes.length; i++) {
            this.chromosomes[i].invert(this.scale);
            document.getElementById("chromosome" + i).innerHTML = this.chromosomes[i].toHTML();
        }
    },

    transposeAll: function() {
        console.log("asdf");
        for (var i=0; i<this.chromosomes.length; i++) {
            this.chromosomes[i].transpose(this.scale);
            document.getElementById("chromosome" + i).innerHTML = this.chromosomes[i].toHTML();
        }
    },

    mutateAll: function(method) {
        for (var i=0; i<this.chromosomes.length; i++) {
            switch(method) {
                case "reverse":
                    this.chromosomes[i].reverse();
                    break;
                case "rotate":
                    this.chromosomes[i].rotate();
                    break;
                case "invert":
                    this.chromosomes[i].invert(this.scale);
                    break;
                case "sortAsc":
                    this.chromosomes[i].sortAsc();
                    break;
                case "sortDesc":
                    this.chromosomes[i].sortDesc();
                    break;
                case "transpose":
                    this.chromosomes[i].transpose(this.scale);
                    break;
                default:
                    console.log("invalid mutation method " + method);
            }
            document.getElementById("chromosome" + i).innerHTML = this.chromosomes[i].toHTML();
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

                if (note.scaleDegree < 0) {
                    console.log("chromosome " + i + " is resting");
                    continue;
                }

                var freq = scale[note.scaleDegree] * (note.octave + 1) * root;
                console.log("ratio:" + scale[note.scaleDegree] + ", sd:" + note.scaleDegree + ", oct:" + note.octave + ", root:" + root);
                chromosome.synth.noteOnWithFreq(freq, vel);
                console.log("chromosome " + i + " playing scale degree " + note.scaleDegree + " (" + freq + "Hz)");
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
    // this.synth = T("PluckGen", {env: T("perc", {a:50, r: 1000}), mul: 0.1}).play();
    this.synth = T("OscGen", {env: T("perc", {a: 10, r: 50}), mul: 0.1}).play();
    // this.synth = T("OscGen", {env: T("perc", {a: (Math.random()*50) + 25, r: Math.random() * Geneva.defaults.interval}), mul:0.1}).play();

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

                var restPrb = Math.random() < Geneva.defaults.restPrb;
                if (restPrb) {
                    scaleDegree = Geneva.REST;
                }

                notes.push(new Geneva.Note(scaleDegree, octave, 1));
            }
        }
        // Drunk walk along scale
        else if (mode == "drunk") {
            var noteIdx = Math.floor(Math.random()*scale.length);
            var octave = Math.floor(Math.random()*octaveRange);
            var maxStepSize = Geneva.defaults.maxStepSize;
            // console.log(noteIdx + ", " + octave);
            notes.push(new Geneva.Note(noteIdx, octave, 1));

            for (var i=1; i<n; i++) {
                var reverseDirection = Math.random();
                var step = Math.floor(Math.random()*maxStepSize) + 1; // up
                if (reverseDirection > 0.5) { // down
                    step *= -1;
                }
                noteIdx += step;
                // console.log(noteIdx);
                if (Math.abs(noteIdx) > scale.length) {
                    octave += Math.floor(noteIdx/scale.length);
                    if (octave > octaveRange) {
                        octave = octaveRange;
                    }
                    else if (octave < 0) {
                        octave = 0;
                    }
                    // console.log("oc");
                }
                noteIdx = Math.abs(noteIdx % scale.length); // normalize
                
                // var octave = Math.min(Math.abs(Math.floor(noteIdx / scale.length)), octaveRange);
                // console.log(noteIdx + ", " + octave);

                var restPrb = Math.random() < Geneva.defaults.restPrb;
                if (restPrb) {
                    notes.push(new Geneva.Note(Geneva.REST, octave, 1));
                }
                else {
                    notes.push(new Geneva.Note(noteIdx, octave, 1));
                }
            }

        }
        else if (mode == "arpeggio") {

        }

        this.notes = notes;
    },

    mutate: function(scale) {
        var mutationMethod = Geneva.noteMutationMethods.choose();
        switch(mutationMethod) {
            case "reverse":
                this.reverse();
                break;
            case "rotate":
                this.rotate();
                break;
            case "invert":
                this.invert(scale);
                break;
            case "sortAsc":
                this.sortAsc();
                break;
            case "sortDesc":
                this.sortDesc();
                break;
            case "transpose":
                this.transpose(scale);
                break;
            default:
                console.log("invalid mutation method " + mutationMethod);
        }
    },

    // Reverse the order of notes
    reverse: function() {
        this.notes.reverse();
    },

    // Rotate by up to max steps
    rotate: function(max) {
        if (max === undefined) {
            max = Geneva.defaults.maxRotations;
        }
        var r = Math.floor(max.rand2()); // from -max to max
        this.notes = this.notes.rotate(r);
    },

    // Invert pitches, based on scale, around the first note in the sequence
    // Assert that c.invert().invert() == c, EXCEPT for notes where the inversion's octave < 0
    invert: function(scale) {
        var center = this.notes[0];
        var str = "";
        for (var i=1; i<this.notes.length; i++) {
            var note = this.notes[i];
            if (note.scaleDegree == Geneva.REST) {
                str += "skipping rest";
                continue;
            }
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

    // TODO: account for rests in sorting
    sortAsc: function() {
        this.notes.sort();
    },

    sortDesc: function() {
        this.notes.sort().reverse();
    },

    // Transpose along scale (num steps determined by max)
    transpose: function(scale, max, octaveRange) {
        if (max === undefined) {
            max = Geneva.defaults.maxStepSize;
        }
        if (octaveRange === undefined) {
            octaveRange = Geneva.defaults.octaveRange;
        }

        var distance = Math.floor(max.rand2());
        console.log("distance: " + distance);

        for (var i=0; i<this.notes.length; i++) {
            var note = this.notes[i];
            if (note.scaleDegree == Geneva.REST) {
                // str += "skipping rest";
                continue;
            }


            // Calculate scale degree and octave
            note.scaleDegree = (note.scaleDegree + (distance % scale.length)) % scale.length;
            note.octave = note.octave + Math.floor(distance / scale.length);

            // Adjustments based on boundaries
            if (note.scaleDegree < 0) {
                note.scaleDegree = scale.length + note.scaleDegree;
            }
            if (note.octave < 0) {
                note.octave = 0;
            }

            // note.scaleDegree += step;
            // if (Math.abs(note.scaleDegree) > scale.length) {
            //     var sd = note.scaleDegree;
            //     note.scaleDegree = sd % scale.length;
            //     if (note.scaleDegree < 0) {
            //         note.scaleDegree += scale.length;
            //     }
            //     note.octave += Math.floor(sd / scale.length);
            //     if (note.octave > octaveRange) {
            //         note.octave = octaveRange;
            //     }
            //     if (note.octave < 0) {
            //         note.octave = 0;
            //     }
            // }

            this.notes[i] = note;
        }
    },

    toString: function() {
        var str = "";
        for (var i=0; i<this.notes.length; i++) {
            str += this.notes[i].toString() + "\n";
        }
        return str;
    },

    toHTML: function() {
        var htmlArr = [];
        for (var i=0; i<this.notes.length; i++) {
            htmlArr.push(this.notes[i].scaleDegree * (this.notes[i].octave + 1));
        }
        return htmlArr.join(" ");
    }
};

Geneva.crossover = function(c1, c2) {

};

// Note class
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

Geneva.addRestsAndHolds = function(scale) {
    scale.push(Geneva.REST);
    scale.push(Geneva.HOLD);
    return scale;
}


/*
 * TESTING
 */
window.onload = function() {
    var session = new Geneva.Session();
    console.log(session);
    session.setScale(Geneva.tunings.just, Geneva.scaleMatrices.ones);
    session.setScale(Geneva.tunings.shierlu, Geneva.scaleMatrices.yu);
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