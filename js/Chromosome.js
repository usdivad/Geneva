// Chromosome class
Geneva.Chromosome = function(notes, scale) {
    this.notes = [];
    this.env = T("perc", {a: (Math.random()*50) + 25, r: Math.random() * Geneva.defaults.interval});
    this.mul = 1/Geneva.defaults.numChromosomes;
    this.osc = T(Geneva.waves.choose());
    // this.synth = T("PluckGen", {env: T("perc", {a:50, r: 1000}), mul: 0.1}).play();
    // this.synth = T("OscGen", {env: T("perc", {a: 10, r: 50}), mul: 1/Geneva.defaults.numChromosomes}).play();
    // this.synth = T("OscGen", {env: this.env, mul: this.mul}).play();
    this.synth = [
        T("OscGen", {osc: this.osc, env: this.env, mul: this.mul}).play(),
        T("PluckGen", {env: this.env, mul: this.mul}).play()
    ].choose();
    this.fitness = 0;
    this.selected = false; // deprecated, use Session.selected list now
    this.animator = null;
    this.vel = Geneva.defaults.velocity;
    this.tweet = "The greatest thing you'll ever learn is just to #love and be loved in return";
    // this.mul = 1/Geneva.defaults.numChromosomes;
    this.muted = false;

    if (notes !== undefined) {
        if (typeof(notes[0]) === "number") {
            if (scale === undefined) {
                scale = Geneva.createScale(Geneva.defaults.tuning, geneva.defaults.matrix);
            }
            for (i=0; i<notes.length; i++) {
                this.notes.push(new Geneva.Note(notes[i], scale));
            }
        }
        else {
            this.notes = notes;
        }
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

                notes.push(new Geneva.Note(scaleDegree, octave));
            }
        }
        // Drunk walk along scale
        else if (mode == "drunk") {
            var noteIdx = Math.floor(Math.random()*scale.length);
            var octave = Math.floor(Math.random()*octaveRange);
            var maxStepSize = Geneva.defaults.maxStepSize;
            // console.log(noteIdx + ", " + octave);
            notes.push(new Geneva.Note(noteIdx, octave));

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
                    notes.push(new Geneva.Note(Geneva.REST, octave));
                }
                else {
                    notes.push(new Geneva.Note(noteIdx, octave));
                }
            }

        }
        else if (mode == "arpeggio") {

        }

        this.notes = notes;
    },

    mutate: function(scale) {
        var mutationMethod = Geneva.mutationMethods.wchoose(Geneva.mutationPrbs);
        console.log(mutationMethod);
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
            // console.log(str);
            
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

    bindAnimator: function(a) {
        this.animator = a;
    },

    animate: function(freq, vel) {
        if (this.animator) {
            // console.log(this.animator);
            if (freq < 0) { // "rest"
                this.animator.position.y = 10;
                // this.animator.scale.set(1, 1, 1);
            }
            else {
                this.animator.position.y = freq/10;
                // var s = freq/1000;
                // this.animator.scale.set(s, s, s);
            }
        }
        // console.log(this.tweet);
    },

    updateAnimator: function() {
        if (this.animator) {
           var dynamicTexture = new THREEx.DynamicTexture(1024, 1024);
            dynamicTexture.font = "Helvetica";
            if (this.selected) {
                dynamicTexture.clear("green");
            }
            else if (this.muted) {
                dynamicTexture.clear("red");
            }
            else {
                dynamicTexture.clear("white");
            }
            dynamicTexture.drawTextCooked({
                text: this.tweet,
            });

            // var material = new THREE.MeshPhongMaterial( { map: dynamicTexture.texture, specular: 0xffffff, shading: THREE.FlatShading, vertexColors: THREE.VertexColors } );
            // this.animator.material = material;

            this.animator.material.map = dynamicTexture.texture;
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