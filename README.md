# JSMidi #
JSMidi is a lightweight JavaScript library that can generate and play Standard MIDI (scm) files on the fly directly from your browser or JavaScript server.

## Features ##

## How does it work? ##

JSMidi generates a Base64 string that can be saved as a MIDI file or played directly in the browser using HTML5 <audio> tag.

## Examples: ##

This is a very simple example showing how to create a single track with 3 notes.
Since timings are not specified the defaults will be taken.

    // We pass the notes we want to |MidiWriter.createNote| to create the MIDI
    // events that actually make the NoteOn/NoteOff events that will go to the
    // final MIDI stream. If no other parameters are specified, a NoteOff event
    // will be inserted automatically, instead of letting the note ring forever.
    // The |reduce| is used here simply to flatten the resulting array, since
    // |createNote| returns an array of events already.
    var events = ["C4", "E4", "G4"].map(MidiWriter.createNote)
                                   .reduce(function(a, b) { return a.concat(b); });

    var track1 = MidiWriter.createTrack({ events: events });
    var song   = new MidiWriter({ tracks: [track1] });

    // Get the base64 representation of the MIDI file
    song.toBytes();

    // Play the song
    song.play();


## Still to be done ##


## Known bugs ##


