// Note class
// Can be constructed with scaleDegree, octave
// OR absoluteDegree, scale
Geneva.Note = function(s, v) {
    this.scaleDegree = s;
    this.octave = v;

    if (typeof(v) == "object") {
        this.scaleDegree = s % v.length;
        this.octave = Math.floor(s / v.length);
    }
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