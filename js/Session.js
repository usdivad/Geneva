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
    this.selected = [];
    this.generations = 0;
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
            (function(i, session) {
                var id = "chromosome" + i;
                document.getElementById(id).addEventListener("click", function(e) {
                    // console.log(this);
                    this.style.color = "#FF6200";
                    console.log(i);
                    session.chromosomes[i].selected = true; // deprecated
                    session.selected.push(i);
                });
            })(i, this);
        }

    },

    getSelected: function() {
        var selected = [];
        console.log(this.chromosomes[0]);
        for (var i=0; i<this.chromosomes.length; i++) {
            if (this.chromosomes[i].selected) {
                selected.push(this.chromosomes[i]);
                console.log("chromosome " + i + " was selected");
            }
        }
        console.log(selected.length + " selected chromosomes");
        return selected;
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

    crossover: function(ci, cj, mr) {
        if (mr === undefined) {
            mr = Geneva.defaults.mutationRate;
        }
        // determine which goes first/second
        var cdice = Math.random();
        var c0 = this.chromosomes[ci];
        var c1 = this.chromosomes[cj];
        if (cdice > 0.5) {
            c0 = this.chromosomes[cj];
            c1 = this.chromosomes[ci];
        }
        var n0 = c0.notes;
        var n1 = c1.notes;

        // random crossing point
        var crossIdx = Math.floor(Math.random()*Math.min(n0.length, n1.length));
        var n0 = n0.slice(0, crossIdx);
        var n1 = n1.slice(crossIdx);

        // mutate (or not) according to mutation rate
        var mutate_n0 = (Math.random() < mr);
        var mutate_n1 = (Math.random() < mr);

        if (mutate_n0) {
            var ctemp = new Geneva.Chromosome(n0);
            ctemp.mutate(this.scale);
            n0 = ctemp.notes;
        }
        if (mutate_n1) {
            var ctemp = new Geneva.Chromosome(n1);
            ctemp.mutate(this.scale);
            n1 = ctemp.notes;
        }

        // combine the two note arrs
        var n2 = n0.concat(n1);
        var c2 = new Geneva.Chromosome(n2);
        return c2;
    },

    evolve: function() {
        if (this.selected.length > 0) {
            if (this.selected.length < 2) { // mutate
                var parent = this.chromosomes[this.selected[0]];
                for (var i=0; i<this.chromosomes.length; i++) {
                    this.chromosomes[i].notes = parent.notes.copy();
                    this.chromosomes[i].mutate(this.scale);
                    // console.log("parent: " + parent.toHTML());
                    // console.log("child: " + this.chromosomes[i].toHTML());
                }
            }
            else { // crossover
                // var parent1 = this.chromosomes[this.selected[0]];
                // var parent2 = this.chromosomes[this.selected[1]];
                for (var i=0; i<this.chromosomes.length; i++) {
                    this.chromosomes[i] = this.crossover(this.selected[0], this.selected[1]);
                }
            }
    
        }
        else { // repopulate / mutate all
            for (var i=0; i<this.chromosomes.length; i++) {
                this.chromosomes[i].mutate(this.scale);
            }
        }

        this.selected = [];
        this.generations++;
        this.updateDisplays();
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
            var cd = document.getElementById("chromosome" + i);
            cd.innerHTML = this.chromosomes[i].toHTML();
            cd.style.color = "#000000";
        }
        document.getElementById("genCount").innerHTML = this.generations + " generations";
    }
};