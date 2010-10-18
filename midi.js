var MIDI = new function() {}

MIDI.HDR_CHUNKID     = "\x4D\x54\x68\x64"; // First 4 bytes of a SMF Midi file
MIDI.prototype = { }
MIDI.HDR_CHUNK_SIZE  = "\x00\x00\x00\x06"; // Header size for SMF
MIDI.HDR_TYPE0       = "\x00\x00"; // Midi Type 0 id
MIDI.HDR_TYPE1       = "\x00\x01"; // Midi Type 1 id

MIDI.HDR_16TH        = "\x0020";
MIDI.HDR_EIGHT       = "\x0040";
MIDI.HDR_QUARTER     = "\x0080";
MIDI.HDR_DOUBLE      = "\x0100";
MIDI.HDR_WHOLE       = "\x0200";

MIDI.TRACK_START    = "\x4D\x54\x72\x6B"; // Marks the start of the track data
MIDI.TRACK_END      = "\x00\xFF\x2F\x00";

var MidiEvent = function(params) {
    this.timeStamp  = []; // Time stamp byte

    if (params) {
        this.setType(params.type);
        this.setChannel(params.channel);
        this.setParam1(params.param1);
        this.setParam2(params.param2);
    }
}

MidiEvent.EVT_NOTE_OFF           = 0x8;
MidiEvent.EVT_NOTE_ON            = 0x9;
MidiEvent.EVT_AFTER_TOUCH        = 0xA;
MidiEvent.EVT_CONTROLLER         = 0xB;
MidiEvent.EVT_PROGRAM_CHANGE     = 0xC;
MidiEvent.EVT_CHANNEL_AFTERTOUCH = 0xD;
MidiEvent.EVT_PITCH_BEND         = 0xE;

MidiEvent.createNote = function(note, sustained) {
    var events = [];

    events.push(new MidiEvent({
        type:    MidiEvent.EVT_NOTE_ON,
        channel: note.channel,
        param1:  note.pitch,
        param2:  note.volume
    }));

    if (!sustained) {
        events.push(new MidiEvent({
            type:    MidiEvent.EVT_NOTE_OFF,
            channel: note.channel,
            param1:  note.pitch,
            param2:  note.volume
        }));
    }

    return events;
}

MidiEvent.prototype = {
    setTimeStamp: function(ts) {
        this.bytes[0] = ts & 0xff;
    },
    setType: function(type) {
        if (type < MidiEvent.EVT_NOTE_OFF || type > MidiEvent.EVT_PITCH_BEND)
            throw new Error("Trying to set an unknown event: " + type);

        this.type = type;
    },
    setChannel: function(channel) {
        if (channel < 0 || channel > 15)
            throw new Error("Channel is out of bounds.");

        this.channel = channel;
    },
    setParam1: function(p) {
        this.param1 = p;
    },
    setParam2: function(p) {
        this.param2 = p;
    },

}

}
