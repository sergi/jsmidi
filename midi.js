/*jslint es5: true, laxbreak: true */

(function (window) {

// Create a mock console object to void undefined errors if the console object
// is not defined.
if (!window.console || !console.firebug) {
    var names = ["log", "debug", "info", "warn", "error"];

    window.console = {};
    for (var i = 0; i < names.length; ++i) {
        window.console[names[i]] = function() {};
    }
}

// 0x4D 0x54 0x68 0x64 First 4 bytes of a SMF Midi file
var HDR_CHUNKID     = "MThd";
var HDR_CHUNK_SIZE  = "\x00\x00\x00\x06"; // Header size for SMF
var HDR_TYPE0       = "\x00\x00"; // Midi Type 0 id
var HDR_TYPE1       = "\x00\x01"; // Midi Type 1 id
var HDR_SPEED       = "\x00\x80"; // Defaults to 128 ticks per beat

// Midi event codes
var EVT_NOTE_OFF           = 0x8;
var EVT_NOTE_ON            = 0x9;
var EVT_AFTER_TOUCH        = 0xA;
var EVT_CONTROLLER         = 0xB;
var EVT_PROGRAM_CHANGE     = 0xC;
var EVT_CHANNEL_AFTERTOUCH = 0xD;
var EVT_PITCH_BEND         = 0xE;

// This is the conversion table from notes to its MIDI number. Provided for
// convenience, it is not used in this code.
var noteTable =
    window.noteTable = { "G9": 0x7F, "Gb9": 0x7E, "F9": 0x7D, "E9": 0x7C, "Eb9": 0x7B,
"D9": 0x7A, "Db9": 0x79, "C9": 0x78, "B8": 0x77, "Bb8": 0x76, "A8": 0x75, "Ab8": 0x74,
"G8": 0x73, "Gb8": 0x72, "F8": 0x71, "E8": 0x70, "Eb8": 0x6F, "D8": 0x6E, "Db8": 0x6D,
"C8": 0x6C, "B7": 0x6B, "Bb7": 0x6A, "A7": 0x69, "Ab7": 0x68, "G7": 0x67, "Gb7": 0x66,
"F7": 0x65, "E7": 0x64, "Eb7": 0x63, "D7": 0x62, "Db7": 0x61, "C7": 0x60, "B6": 0x5F,
"Bb6": 0x5E, "A6": 0x5D, "Ab6": 0x5C, "G6": 0x5B, "Gb6": 0x5A, "F6": 0x59, "E6": 0x58,
"Eb6": 0x57, "D6": 0x56, "Db6": 0x55, "C6": 0x54, "B5": 0x53, "Bb5": 0x52, "A5": 0x51,
"Ab5": 0x50, "G5": 0x4F, "Gb5": 0x4E, "F5": 0x4D, "E5": 0x4C, "Eb5": 0x4B, "D5": 0x4A,
"Db5": 0x49, "C5": 0x48, "B4": 0x47, "Bb4": 0x46, "A4": 0x45, "Ab4": 0x44, "G4": 0x43,
"Gb4": 0x42, "F4": 0x41, "E4": 0x40, "Eb4": 0x3F, "D4": 0x3E, "Db4": 0x3D, "C4": 0x3C,
"B3": 0x3B, "Bb3": 0x3A, "A3": 0x39, "Ab3": 0x38, "G3": 0x37, "Gb3": 0x36, "F3": 0x35,
"E3": 0x34, "Eb3": 0x33, "D3": 0x32, "Db3": 0x31, "C3": 0x30, "B2": 0x2F, "Bb2": 0x2E,
"A2": 0x2D, "Ab2": 0x2C, "G2": 0x2B, "Gb2": 0x2A, "F2": 0x29, "E2": 0x28, "Eb2": 0x27,
"D2": 0x26, "Db2": 0x25, "C2": 0x24, "B1": 0x23, "Bb1": 0x22, "A1": 0x21, "Ab1": 0x20,
"G1": 0x1F, "Gb1": 0x1E, "F1": 0x1D, "E1": 0x1C, "Eb1": 0x1B, "D1": 0x1A, "Db1": 0x19,
"C1": 0x18, "B0": 0x17, "Bb0": 0x16, "A0": 0x15, "Ab0": 0x14, "G0": 0x13, "Gb0": 0x12,
"F0": 0x11, "E0": 0x10, "Eb0": 0x0F, "D0": 0x0E, "Db0": 0x0D, "C0": 0x0C };

// Helper functions

/*
 * Converts a string into an array of ASCII char codes for every character of
 * the string.
 *
 * @param str {String} String to be converted
 * @returns array with the charcode values of the string
 */
function StringToNumArray(str) {
    return [].map.call(str, function(char) { return char.charCodeAt(0); });
}

/*
 * Converts an array of bytes to a string of hexadecimal characters. Prepares
 * it to be converted into a base64 string.
 *
 * @param byteArray {Array} array of bytes that will be converted to a string
 * @returns hexadecimal string
 */
function codes2Str(byteArray) {
    return String.fromCharCode(null, byteArray);
}

/*
 * Converts a String of hexadecimal values to an array of nibbles (4-bit
 * values). It can also add remaining "0" nibbles in order to have enough bytes
 * in the array as the |finalBytes| parameter.
 *
 * @param str {String} string of hexadecimal values e.g. "097B8A"
 * @param finalBytes {Integer} Optional. The desired number of bytes (not nibbles) that the returned array should contain *
 * @returns array of nibbles.
 */

function str2Bytes(str, finalBytes) {
    if (finalBytes) {
        while ((str.length / 2) < finalBytes) { str = "0" + str; }
    }

    return Array.prototype.map.call(str, function(ch) {
        return parseInt(ch, 16);
    });
}

/**
 * Translates number of ticks to MIDI timestamp format, returning an array of
 * bytes with the time values. Midi has a very particular time to express time,
 * take a good look at the spec before ever touching this function.
 *
 * @param ticks {Integer} Number of ticks to be translated
 * @returns Array of bytes that form the MIDI time value
 */
var translateTickTime = function(ticks) {
    var buffer = ticks & 0x7F;

    while (ticks = ticks >> 7) {
        buffer <<= 8;
        buffer |= ((ticks & 0x7F) | 0x80);
    }

    var bList = [];
    while (true) {
        bList.push(buffer & 0xff);

        if (buffer & 0x80) { buffer >>= 8; }
        else { break; }
    }
    return bList;
};

/*
 * This is the function that assembles the MIDI file. It writes the
 * necessary constants for the MIDI header and goes through all the tracks, appending
 * their data to the final MIDI stream.
 * It returns an object with the final values in hex and in base64, and with
 * some useful methods to play an manipulate the resulting MIDI stream.
 *
 * @param config {Object} Configuration object. It contains the tracks, tempo
 * and other values necessary to generate the MIDI stream.
 *
 * @returns An object with the hex and base64 resulting streams, as well as
 * with some useful methods.
 */
var MidiWriter = window.MidiWriter = function(config) {
    if (config) {
        var tracks  = config.tracks || [];
        // Number of tracks in hexadecimal
        var tracksLength = tracks.length.toString(16);

        // This variable will hold the whole midi stream and we will add every
        // chunk of MIDI data to it in the next lines.
        var hexMidi = HDR_CHUNKID + HDR_CHUNK_SIZE + HDR_TYPE0;

        // Appends the number of tracks expressed in 2 bytes, as the MIDI
        // standard requires.
        hexMidi += codes2Str(str2Bytes(tracksLength, 2));
        hexMidi += HDR_SPEED;
        // Goes through the tracks appending the hex strings that compose them.
        tracks.forEach(function(trk) { hexMidi += codes2Str(trk.toBytes()); });

        return {
            hex: hexMidi,
            b64: btoa(hexMidi)
        };

    } else {
        throw new Error("No parameters have been passed to MidiWriter.");
    }
};

var MidiEvent = window.MidiEvent = function(params) {
    this.timeStamp  = []; // Time stamp byte

    if (params) {
        this.setTime(params.time || 0);
        this.setType(params.type);
        this.setChannel(params.channel);
        this.setParam1(params.param1);
        this.setParam2(params.param2);
    }
};


/**
 * Returns the list of events that form a note in MIDI. If the |sustained|
 * parameter is not specified, it creates the noteOff event, which stops the
 * note after it has been played, instead of keeping it playing.
 *
 * @param note {Note} Note object
 * @param sustained {Boolean} Whether the note has to end or keep playing
 * @returns Array of events, with a maximum of two events (noteOn and noteOff)
 */

MidiEvent.createNote = function(note, sustained) {
    var events = [];

    events.push(new MidiEvent({
        time:    this.setTime(time),
        type:    EVT_NOTE_ON,
        channel: note.channel || 0,
        param1:  note.pitch,
        param2:  note.volume
    }));

    if (!sustained) {
        events.push(new MidiEvent({
            time:    this.setTime(time),
            type:    EVT_NOTE_OFF,
            channel: note.channel || 0,
            param1:  note.pitch,
            param2:  note.volume
        }));
    }

    return events;
};

MidiEvent.prototype = {
    type: 0,
    channel: 0,
    time: 0,
    setTime: function(ticks) {
        // if the last byte is 0, a new 0 is inserted after it since
        // we need to have 2 nibbles for every time unit (eg. 81 00 -> 129
        // ticks).

        // The 0x00 byte is always the last one. This is how Midi
        // interpreters know that the time measure specification ends and the
        // rest of the event signature starts.

        this.time = translateTickTime(ticks);
        if (this.time[this.time.length-1] === 0) {
            this.time.push(0);
        }
    },
    setType: function(type) {
        if (type < EVT_NOTE_OFF || type > EVT_PITCH_BEND) {
            throw new Error("Trying to set an unknown event: " + type);
        }

        this.type = type;
    },
    setChannel: function(channel) {
        if (channel < 0 || channel > 15) {
            throw new Error("Channel is out of bounds.");
        }

        this.channel = channel;
    },
    setParam1: function(p) {
        this.param1 = p;
    },
    setParam2: function(p) {
        this.param2 = p;
    },
    toBytes: function() {
        var byteArray = [];
        var typeChannelByte =
            parseInt(this.type.toString(16) + this.channel.toString(16), 16);

        byteArray.push.apply(byteArray, this.time);
        byteArray.push(typeChannelByte);
        byteArray.push.apply(byteArray, str2Bytes(this.param1.toString(16), 1));

        // Some events don't have a second parameter
        if (this.param2 !== undefined && this.param2 !== null) {
            byteArray.push.apply(byteArray, str2Bytes(this.param2.toString(16), 1));
        }
        return byteArray;
    }
};

var MetaEvent = window.MetaEvent = function(params) {
    if (params) {
        this.setType(params.type);
        this.setChannel(params.channel);
        this.setParam1(params.param1);
        this.setParam2(params.param2);
    }
};


var MidiTrack = window.MidiTrack = function(events) {
    this.events = {
        meta: [],
        midi: [],
        sysex: []
    };

    if (events) {
        for (var i=0, event; event = events[i]; i++) { this.addEvent(event); }
    }
};

//"MTrk" Marks the start of the track data
MidiTrack.TRACK_START = [0x4, 0xd, 0x5, 0x4, 0x7, 0x2, 0x6, 0xb];
MidiTrack.TRACK_END   = [0, 0, 0xF, 0xF, 0x2, 0xF, 0, 0];

MidiTrack.prototype = {
    closed: false,
    addEvent: function(event) {
        var type = "midi";

        if (event instanceof MetaEvent) { type = "meta"; }
        this.events[type].push(event);

        return this;
    },
    toBytes: function() {
        var trackLength = 0;
        var eventBytes = [];
        var metaEvents = this.events.meta;
        var midiEvents = this.events.midi;

        var addEventBytes = function(event) {
            var bytes = event.toBytes();
            Array.prototype.push.apply(eventBytes, bytes);
            trackLength += bytes.length;
        };

        metaEvents.forEach(addEventBytes);
        midiEvents.forEach(addEventBytes);

        return MidiTrack.TRACK_START.concat(
                   str2Bytes(trackLength.toString(16), 4),
                   eventBytes,
                   MidiTrack.TRACK_END);
    }
};

})(this);
