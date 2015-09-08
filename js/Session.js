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
        var scale = Geneva.createScale(tunings, matrix);
        this.scale = scale;
        console.log(this.scale);
    },

    populate: function(numChromosomes, numNotes, octaveRange, mode) {
        var cd = document.getElementById("chromosomes");
        var cdHtml = "<h2>Chromosomes</h2>\n";

        for (var i=0; i<numChromosomes; i++) {
            var chromosome = new Geneva.Chromosome();
            var id = "chromosome" + i;
            chromosome.generateNotes(numNotes, this.scale, octaveRange, mode);
            this.chromosomes[i] = chromosome;

            cdHtml += "<div class=\"chromosomeDisplay\" id=\"" + id + "\">"
                    + chromosome.toHTML()
                    + "</div>\n";
        }

        cd.innerHTML = cdHtml;

        // Add click functionality after display elms are created
        for (var i=0; i<numChromosomes; i++) {
            var id = "chromosome" + i;
            document.getElementById(id).addEventListener("click", function(e) {
                console.log(this);
            });
        }

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

    crossover: function(ci, cj) {
        var c0 = this.chromosomes[ci];
        var c1 = this.chromosomes[cj];

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
                // console.log("ratio:" + scale[note.scaleDegree] + ", sd:" + note.scaleDegree + ", oct:" + note.octave + ", root:" + root);
                chromosome.synth.noteOnWithFreq(freq, vel);
                console.log("chromosome " + i + " playing scale degree " + note.scaleDegree + " (" + freq + "Hz)");
            }
        }).start();
    },

    stop: function() {
        this.interval.stop();
    },

    updateDisplays: function() {
        for (var i=0; i<this.chromosomes.length; i++) {
            document.getElementById("chromosome" + i).innerHTML = this.chromosomes[i].toHTML();
        }
    }
};