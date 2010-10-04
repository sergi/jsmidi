var MIDI = new function() {}

MIDI.HDR_CHUNKID     = "\x4D\x54\x68\x64"; // First 4 bytes of a SMF Midi file
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

MIDI.prototype = {
}

var MidiEvent = function() {
}

MidiEvent.prototype = {

}
