# JSMidi #
JSMidi is a lightweight JavaScript library that can generate and play Standard MIDI (scm) files on the fly directly from your browser or JavaScript server.

## Features ##

## How does it work? ##

JSMidi generates a Base64 string that can be saved as a MIDI file or played directly in the browser using HTML5 <audio> tag.

## Examples: ##

This is a very simple example showing how to create a single track with 3 notes.
Since timings are not specified the defaults will be taken.

    // We pass some notes to |MidiWriter.createNote| to create the MIDI
    // events that define the notes that will be in the final MIDI stream. If
    // no other parameters are specified to |createNote|, a NoteOff event
    // will be inserted automatically, instead of letting the note ring forever.

    // Disregard the |concat.apply|, it is used here simply to flatten the
    // resulting array, since |createNote| returns an array of events.

    var noteEvents = Array.prototype.concat.apply(
        ["C4", "E4", "G4"].map(MidiWriter.createNote)
    var noteEvents = Array.prototype.concat.apply([], MidiWriter.createNotes(notes));

    //.reduce(function(a, b) { return a.concat(b); });

    // Create a track that contains the events to play the notes above
    var track = new Track(noteEvents);

    // Creates an object that contains the final MIDI track in base64 and some
    // useful methods.
    var song  = MidiWriter({ tracks: [track] });

    // Alert the base64 representation of the MIDI file
    alert(song.b64);

    // Play the song
    song.play();

    // Play/save the song (depending of MIDI plugins in the browser)
    song.save();


## Still to be done ##


## Known bugs ##


