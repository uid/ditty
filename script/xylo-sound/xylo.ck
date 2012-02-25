ModalBar bar => WvOut wav => dac;
"xylo.wav" => wav.wavFilename;
0.95 => bar.gain;
1 => bar.preset;
0.15 => bar.vibratoGain;
0 => bar.directGain;

for(40 => int i; i < 120; i++) {
	i => Std.mtof => bar.freq;

	for(0 => int c; c < 3; c++) {
		1 => bar.noteOn;
		2::second => now;
	}
}
