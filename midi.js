/*jslint es5: true, laxbreak: true */

(function (window) {
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

var noteTable = { "G9": 0x7F, "Gb9": 0x7E, "F9": 0x7D, "E9": 0x7C, "Eb9": 0x7B,
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


var MidiWriter = window.MidiWriter = function(cfgObj) {
    this.header = HDR_CHUNKID + HDR_CHUNK_SIZE + HDR_TYPE0;
    this.trackList = cfgObj && cfgObj.tracks ? cfgObj.tracks : [];
};

MidiWriter.stringToNumArray = function(str) {
    return str.split("").map(function(char) {
            return char.charCodeAt(0);
        });
};

/*
 * Converts an array of bytes to a string of hexadecimal characters. Prepares
 * it to be converted into a base64 string.
 *
 * @param byteArray {Array} array of bytes that will be converted to a string
 * @returns hexadecimal string
 */
MidiWriter.toHexString = function(byteArray) {
    return byteArray.map(function(b) { return b.toString(16); }).join("");
};

/**
 * Translates number of ticks to MIDI timestamp format, returning an array of
 * bytes with the time values. Midi has a very particular time to express time,
 * take a good look at the spec before ever touching this function.
 *
 * @param ticks {Integer} Number of ticks to be translated
 * @returns Array of bytes that form the MIDI time value
 */
MidiWriter.translateTickTime = function(ticks) {
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

Midi.HDR_16TH    = "\x0020";
Midi.HDR_EIGHT   = "\x0040";
Midi.HDR_QUARTER = "\x0080";
Midi.HDR_DOUBLE  = "\x0100";
Midi.HDR_WHOLE   = "\x0200";

Midi.TRACK_START     = "MTrk"; // Marks the start of the track data
Midi.TRACK_END       = "\x00\xFF\x2F\x00";

MidiWriter.prototype = {
    addTrack: function(track) {
        this.trackList.push(track);
    },
    toBytes: function() {

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
    setTime: function(ticks) {
        // if the last byte is 0, a new 0 is inserted after it since
        // we need to have 2 nibbles for every time unit (eg. 81 00 -> 129
        // ticks).

        // The 0x00 byte is always the last one. This is how Midi
        // interpreters know that the time measure specification ends and the
        // rest of the event signature starts.

        this.time = Midi.translateTickTime(ticks);
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
        byteArray.push.apply(byteArray, this.time);
        byteArray.push(this.type,
                       this.channel,
                       this.param1,
                       this.param2);
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


var MidiTrack = window.MidiTrack = function(cfgObj) {
    this.events = {
        meta: [],
        midi: [],
        sysex: []
    }
};

MidiTrack.prototype = {
    header: Midi.TRACK_START,
    closed: false,

    addEvent: function(event) {
        //this.events.push(event);
    },
    addEvents: function(events) {
        this.addEvent.apply(this, events);
    },
    toBytes: function() {

    }
};

})(this);
