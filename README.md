#Geneva

![Screenshot](screenshot1.png?raw=true "Screenshot")

Geneva is an interactive exploration of genetic algorithms as applied to sonification of tweets pertaining to the 1949 Geneva Convention. The tweets are scraped in real time and converted to music using sentiment analysis; by exploring user-determined recombination and musical interpretation of the tweets, Geneva evokes the decay and fragmentation of information as well as questioning the power of words. The evolutionary processes that take place also loosely mirror the development of the Geneva Conventions, with treaties added in 1864, 1906, 1929, and 1949.

The work is in many ways a musical adaptation of and homage to Karl Sims' Genetic Images (1993); to facilitate the listener/user's simultaneous evaluation of multiple melodies, each chromosome is placed in a 3D space, allowing for different combinations to be heard depending on the player's location. In addition, the first-person controls allow for easy control and manipulation of both sonic (mute, solo) and genetic (select, reject, evolve) aspects of the population. Mutation and crossover algorithms, which affect pitch, rhythm, and timbre as well as the tweet content itself, are heavily influenced by John Biles' GenJam.

Geneva was presented as an art installation at the [2016 Web Audio Conference](http://webaudio.gatech.edu/) at Georgia Tech. It makes use of the Web Audio API (timbre.js, subcollider.js), WebGL (THREE.js), and the Twitter API (version 1.1); it is available to play at http://usdivad.com/geneva.