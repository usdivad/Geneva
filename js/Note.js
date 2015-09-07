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