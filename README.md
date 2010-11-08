JSMidi
======

JSMidi is a lightweight JavaScript library that can generate and play Standard MIDI (scm) files on the fly directly from your browser or JavaScript server.

Disclaimer: This is Work In Progress, and it is by no means finished yet.

How does it work?
-----------------

JSMidi generates a Base64 string that can be saved as a MIDI file or played directly in the browser using HTML5 <audio> tag.

Example
-------

This is a very simple example showing how to create a single track with 3 notes.
Since timings are not specified the defaults will be taken.

    // We pass some notes to |MidiWriter.createNote| to create the MIDI
    // events that define the notes that will be in the final MIDI stream. If
    // no other parameters are specified to |createNote|, a NoteOff event
    // will be inserted automatically, instead of letting the note ring forever.

    // Disregard the |push.apply|, it is used here simply to flatten the
    // resulting array, since |createNote| returns an array of events.

    var noteEvents = [];
    ["C4", "E4", "G4"].forEach(function(note) {
        Array.prototype.push.apply(noteEvents, MidiEvent.createNote(note));
    });

    // Create a track that contains the events to play the notes above
    var track = new MidiTrack({ events: noteEvents });

    // Creates an object that contains the final MIDI track in base64 and some
    // useful methods.
    var song  = MidiWriter({ tracks: [track] });

    // Alert the base64 representation of the MIDI file
    alert(song.b64);

    // Play the song
    song.play();

    // Play/save the song (depending of MIDI plugins in the browser). It opens
    // a new window and loads the generated MIDI file with the proper MIME type
    song.save();


Still to be done
----------------

* MetaEvents won't be processed properly right now (this is important, and will be solved soon).
* MetaEvents shortcuts
* Reading MIDI files (it only writes to them now)
* MIDI Type 0 & 1 differences and validations

Contributors
------------

* Sergi Mansilla <sergi.mansilla@gmail.com>

License
-------

This material is licensed by Sergi Mansilla under the [Creative Commons Attribution-ShareAlike 3.0 license](http://creativecommons.org/licenses/by-sa/3.0/). You are free to copy, distribute, transmit, and remix this work, provided you attribute the work to Sergi Mansilla as the original author and reference this repository.
If you alter, transform, or build upon this work, you may distribute the resulting work only under the same, similar or compatible license. Any of the above conditions can be waived if you get permission from the copyright holder. For any reuse or distribution, you must make clear to others the license terms of this work. The best way to do this is with a link to the [Creative Commons Attribution-Share Alike 3.0](http://creativecommons.org/licenses/by-sa/3.0/).
