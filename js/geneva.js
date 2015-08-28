var Geneva = Geneva || {};

// Namespace-wide variables
Geneva.crossoverRate = 0.7;
Geneva.mutationRate = 0.2;
Geneva.root = 60;
Geneva.phraseMutationMethods = [Geneva.invert, Geneva.transpose, Geneva.retrograde];
Geneva.noteMutationMethods = [Geneva.addNote, Geneva.removeNote, Geneva.scaleNoteRhythm];
Geneva.pitchMutationMethods = [];
Geneva.rhythmMutationMethods = [];

// Chromosome class
Geneva.Chromosome = function() {
    this.notes = [];
    this.timbre = {};
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
};

Geneva.crossover = function(c1, c2) {

};

// Note class
Geneva.Note = function(p, r) {
    this.pitch = p;
    this.rhythm = r;
}

Geneva.Note.prototype = {
    mutateRhythm: function() {
        var mutationMethod = Geneva.rhythmMutationMethods.choose();
        return mutationMethod(this);
    }

};



