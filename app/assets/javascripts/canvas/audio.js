

// copied from: http://www.kevlindev.com/tutorials/javascript/inheritance/index.htm#Anchor-Creatin-49778
function extend(subClass, baseClass) {
   function inheritance() {}
   inheritance.prototype = baseClass.prototype;

   subClass.prototype = new inheritance();
   subClass.prototype.constructor = subClass;
   subClass.baseConstructor = baseClass;
   subClass.superClass = baseClass.prototype;
}


// I actually wrote these three, with some help:
// http://0xfe.blogspot.com/2011/08/generating-tones-with-web-audio-api.html


AudioNode = function(audioContext, node) {
  this.audioContext = audioContext
  this.node = node
  this.sampleRate = this.audioContext.sampleRate
  this.connected = false
}
AudioNode.prototype.setGain = function(gain) {
  if(this.node && this.node.gain) {
    this.node.gain.value = gain
  } else if(this.gain) {
    this.gain = gain
  } else {
    debugger
  }
}
AudioNode.prototype.connect = function(dest) {
  this.node.connect(dest ? dest.node : this.audioContext.destination)
  this.connected = true
}
AudioNode.prototype.disconnect = function() {
  if(this.connected) {
    this.node.disconnect()
    this.connected = false
  }
}


JSAudioNode = function(audioContext) {
  var node = audioContext.createJavaScriptNode(256 /* buffer size */, 1 /* inputs */, 1 /* outputs */)
  node.onaudioprocess = this.process.bind(this)
  JSAudioNode.baseConstructor.call(this, audioContext, node)
  
  this.gain = 1.0
}
extend(JSAudioNode, AudioNode)


UpMixer = function(audioContext) {
  UpMixer.baseConstructor.call(this, audioContext)
}
extend(UpMixer, JSAudioNode)
UpMixer.prototype.process = function(e) {
  var inputSamples = e.inputBuffer.getChannelData(0)
  var outputSamples1 = e.outputBuffer.getChannelData(0)
  var outputSamples2 = e.outputBuffer.getChannelData(1)

  for(var i = 0; i < inputSamples.length; i++) {
    var s = this.gain * inputSamples[i]
    outputSamples1[i] = outputSamples2[i] = s
  }
}


Noise = function(audioContext) {
  OnePole.baseConstructor.call(this, audioContext)
}
extend(Noise, JSAudioNode)
Noise.prototype.process = function(e) {
  var outputSamples = e.outputBuffer.getChannelData(0);

  for(var i = 0; i < outputSamples.length; i++) {
    outputSamples[i] = this.gain * Math.random() * 2 - 1;
  }
}


/* I copied this from ChucK. I forget which license it is. */

function mtof(m) { return Math.pow(2, (m-69)/12) * 440 }


/*
Much of the code below (before the next block comment) was ported from STK 4.4.3: https://ccrma.stanford.edu/software/stk/
STK has an "MIT-like license" under which I'm also releasing this code.
*/

OnePole = function(audioContext, pole) {
  OnePole.baseConstructor.call(this, audioContext);
  
  if(!pole) {
    pole = 0.99
  }
  
  this.inputs = [0.0];
  this.outputs = [0.0, 0.0];
  
  this.setPole(pole)
}
extend(OnePole, JSAudioNode)
OnePole.prototype.setPole = function(pole) {
  this.a = [1.0, -pole];
  this.b = [pole > 0 ? 1 - pole : 1 + pole];
}
OnePole.prototype.process = function(e) {
  var inputSamples = e.inputBuffer.getChannelData(0);
  var outputSamples = e.outputBuffer.getChannelData(0);

  for(var i = 0; i < inputSamples.length; i++) {
    this.inputs[0] = this.gain * inputSamples[i]
    outputSamples[i] = this.b[0] * this.inputs[0] - this.a[1] * this.outputs[1]
    this.outputs[1] = outputSamples[i]
  }
}


TwoZero = function(audioContext, b0, b1, b2) {
  TwoZero.baseConstructor.call(this, audioContext);
  
  this.inputs = [0.0, 0.0, 0.0];
  this.b = [b0, b1, b2];
}
extend(TwoZero, JSAudioNode)
TwoZero.prototype.process = function(e) {
  var inputSamples = e.inputBuffer.getChannelData(0);
  var outputSamples = e.outputBuffer.getChannelData(0);

  for(var i = 0; i < inputSamples.length; i++) {
    this.inputs[0] = this.gain * inputSamples[i];
    outputSamples[i] = this.b[2] * this.inputs[2] + this.b[1] * this.inputs[1] + this.b[0] * this.inputs[0];
    this.inputs[2] = this.inputs[1];
    this.inputs[1] = this.inputs[0];
  }
}


BiQuad = function(audioContext) {
  BiQuad.baseConstructor.call(this, audioContext);
  
  this.inputs = [0.0, 0.0, 0.0]
  this.outputs = [0.0, 0.0, 0.0]
  this.a = [1.0, 0.0, 0.0]
  this.b = [1.0, 0.0, 0.0]
}
extend(BiQuad, JSAudioNode)
BiQuad.prototype.setResonance = function(frequency, radius, normalize) {
  this.a[2] = radius * radius
  this.a[1] = -2 * radius * Math.cos(2*Math.PI * frequency / this.audioContext.sampleRate)
  
  if(normalize) {
    this.b[0] = 0.5 - 0.5 * this.a[2]
    this.b[1] = 0.0
    this.b[2] = -this.b[0]
  }
}
BiQuad.prototype.setEqualGainZeroes = function() {
  this.b = [1.0, 0.0, -1.0]
}
BiQuad.prototype.process = function(e) {
  var inputSamples = e.inputBuffer.getChannelData(0);
  var outputSamples = e.outputBuffer.getChannelData(0);

  for(var i = 0; i < inputSamples.length; i++) {
    this.inputs[0] = this.gain * inputSamples[i]
    outputSamples[i] = this.b[0] * this.inputs[0] + this.b[1] * this.inputs[1] + this.b[2] * this.inputs[2]
    outputSamples[i] -= this.a[2] * this.outputs[2] + this.a[1] * this.outputs[1]
    this.inputs[2] = this.inputs[1]
    this.inputs[1] = this.inputs[0]
    this.outputs[2] = this.outputs[1]
    this.outputs[1] = outputSamples[i]
  }
}


TwoPole = function(audioContext, frequency, radius) {
  TwoPole.baseConstructor.call(this, audioContext);
  
  this.b = [1.0];
  this.a = [1.0, 0.0, 0.0];
  this.inputs = [0.0];
  this.outputs = [0.0, 0.0, 0.0];

  this.setResonance(frequency, radius);
}
extend(TwoPole, JSAudioNode)
TwoPole.prototype.process = function(e) {
  var inputSamples = e.inputBuffer.getChannelData(0);
  var outputSamples = e.outputBuffer.getChannelData(0);

  for(var i = 0; i < inputSamples.length; i++) {
    this.inputs[0] = this.gain * inputSamples[i];
    outputSamples[i] = this.b[0] * this.inputs[0] - this.a[1] * this.outputs[1] - this.a[2] * this.outputs[2];
    this.outputs[2] = this.outputs[1];
    this.outputs[1] = outputSamples[i];
  }
}
TwoPole.prototype.setResonance = function(frequency, radius) {
  this.a = [1.0, -2.0 * radius * Math.cos((2 * Math.PI) * frequency / this.sampleRate), radius * radius];
}


Impulser = function(audioContext) {
  Impulser.baseConstructor.call(this, audioContext);

  this.frequency = 440;
  this.phase = 0;
  this.vibratoFrequency = 5;
  this.vibratoAmount = 0;
  this.vibratoPhase = 0;
}
extend(Impulser, JSAudioNode)
Impulser.prototype.process = function(e) {
  var outputSamples = e.outputBuffer.getChannelData(0);

  for(var i = 0; i < outputSamples.length; i++) {
    this.vibratoPhase += this.vibratoFrequency / this.sampleRate;

    this.phase += (this.frequency + Math.sin( this.vibratoPhase * Math.PI * 2.0 ) * this.vibratoAmount) / this.sampleRate;
    outputSamples[i] = this.phase > 1 ? this.gain : 0.0;
    while(this.phase > 1) this.phase -= 1;
  }
}


Envelope = function(audioContext) {
  Envelope.baseConstructor.call(this, audioContext)
  
  this.target = 0.0
  this.value = 0.0
  this.rate = 0.001
  this.state = 0
}
extend(Envelope, JSAudioNode)
Envelope.prototype.setRate = function(rate) {
  this.rate = rate
}
Envelope.prototype.setTarget = function(target) {
  this.target = target
  
  if(this.value != target) {
    this.state = 1
  }
}
Envelope.prototype.setValue = function(value) {
  this.state = 0
  this.target = value
  this.value = value
}
Envelope.prototype.process = function(e) {
  var inputSamples = e.inputBuffer.getChannelData(0)
  var outputSamples = e.outputBuffer.getChannelData(0)

  for(var i = 0; i < inputSamples.length; i++) {
    if(this.state > 0) {
      if(this.target > this.value) {
        this.value += this.rate
        if(this.value >= this.target) {
          this.value = this.target
          this.state = 0
        }
      } else {
        this.value -= this.rate
        if(this.value <= this.target) {
          this.value = this.target
          this.state = 0
        }
      }
    }
    
    outputSamples[i] = this.value * inputSamples[i]
  }
}


ModalStrike = function(audioContext) {
  // AudioNode doesn't really need a node until connect(); we'll provide one by then
  ModalStrike.baseConstructor.call(this, audioContext, null /* node */)
  
  if(!ModalStrike.modalStrikeBuffer) {
    this._createBuffer()
  }
  
  this.gain = 1
}
extend(ModalStrike, AudioNode)
ModalStrike.prototype._createBuffer = function() {
  ModalStrike.modalStrikeBuffer = this.audioContext.createBuffer(1, ModalStrike.modalStrikeRaw.length, this.audioContext.sampleRate)
  data = ModalStrike.modalStrikeBuffer.getChannelData(0)
  for(var i in ModalStrike.modalStrikeRaw) {
    data[i] = ModalStrike.modalStrikeRaw[i] / 32768
  }
}
ModalStrike.prototype._createNode = function() {
  this.node = this.audioContext.createBufferSource()
  this.node.buffer = ModalStrike.modalStrikeBuffer
  // node.loop = true
  
  this.node.gain.value = this.gain
  
  if(this.rate) {
    this.node.playbackRate.value = this.rate
  }
}
ModalStrike.prototype.setRate = function(rate) {
  this.rate = rate
  if(this.node) {
    this.node.playbackRate.value = rate
  }
}
ModalStrike.prototype.connect = function(dest) {
  this.play(dest)
}
ModalStrike.prototype.play = function(dest) {
  this.disconnect()
  this._createNode()
  
  ModalStrike.superClass.connect.call(this, dest)
  this.node.noteOn(0)
}
// 16-bit PCM, 11,025 sample rate
// ModalStrike.modalStrikeRaw = [20,-113,523,-1235,2061,5526,-7416,-663,560,1074,924,-2154,3356,-4436,-2897,4436,1213,988,-769,-1668,3951,-7321,7708,-9702,12603,-11917,6756,2520,-8600,10046,-11439,11770,-9988,5139,740,-2085,571,803,-533,-1845,3064,-3566,7061,-11628,10386,-5397,937,3114,-5429,7169,-7835,5992,-861,-544,-1382,2639,-4043,2345,-703,-18,2627,-6172,7561,-5646,1093,3646,-4179,3887,-4467,2256,1374,-4133,4395,-815,-3104,4483,-4616,4061,-2634,-1104,5491,-6389,4963,-1389,-938,1011,-2607,2331,884,-2480,3608,-2507,-1423,2068,-3261,4512,-2825,1545,737,-3046,2317,-1198,-162,1678,-1395,1380,-798,-1309,2706,-3096,1293,1214,-2007,2649,-2299,1218,288,-2560,3082,-1587,316,665,-1062,716,-698,-1088,3349,-2940,1732,-50,-2307,3587,-3414,3812,-2435,-145,2010,-2973,1859,-503,-342,644,8,-568,2144,-3927,3456,-1683,-799,2817,-3269,3998,-3240,1248,1125,-2340,1295,-566,-56,1030,-909,432,442,-2747,3394,-2019,884,1194,-2579,2927,-2964,1143,639,-2298,3360,-2324,1300,671,-2577,2130,-1501,910,397,-616,512,-354,-1407,2036,-1074,158,922,-2218,2559,-2066,1286,404,-1714,2438,-2086,1126,450,-1449,1390,-1547,653,673,-1305,1596,-844,-557,1260,-1836,2017,-470,-757,1699,-2289,1437,-545,76,1106,-1302,694,-341]
// 16-bit PCM, 44,100 sample rate
ModalStrike.modalStrikeRaw = [269,34,-272,-491,-484,-188,303,795,1005,758,23,-971,-1811,-2042,-1310,378,2700,4970,6430,6470,4875,1942,-1591,-4786,-6797,-7163,-5956,-3703,-1210,756,1747,1706,1009,199,-221,-2,739,1632,2177,2038,1130,-255,-1617,-2394,-2224,-1088,641,2325,3259,2955,1309,-1300,-4123,-6272,-7006,-6009,-3507,-211,2903,4957,5448,4458,2592,731,-317,-181,930,2332,3133,2725,1007,-1424,-3593,-4491,-3610,-1192,1811,4101,4618,3031,-75,-3383,-5445,-5293,-2959,536,3581,4706,3307,-62,-3829,-6120,-5611,-2209,2833,7327,9196,7292,2123,-4369,-9515,-11049,-8141,-1763,5604,11030,12305,8932,2297,-4906,-9782,-10511,-7023,-1026,4809,7978,7293,3227,-2206,-6529,-7788,-5487,-687,4428,7615,7480,4120,-1017,-5745,-8145,-7294,-3658,1235,5451,7476,6786,3942,236,-2896,-4481,-4301,-2828,-895,721,1633,1835,1634,1293,954,529,-106,-968,-1825,-2315,-2072,-1056,426,1740,2238,1612,62,-1644,-2601,-2110,-148,2562,4781,5319,3550,-122,-4437,-7658,-8357,-6038,-1407,3822,7643,8558,6213,1596,-3414,-6777,-7186,-4574,-140,4202,6629,6208,3222,-941,-4461,-5858,-4604,-1350,2441,5112,5534,3580,98,-3432,-5583,-5537,-3359,29,3370,5468,5756,4325,1883,-668,-2541,-3356,-3150,-2256,-1096,4,870,1429,1665,1501,908,-102,-1322,-2400,-2917,-2585,-1394,284,1850,2648,2338,997,-780,-2193,-2517,-1494,532,2704,4015,3723,1752,-1260,-4142,-5684,-5130,-2539,1191,4666,6507,5948,3125,-939,-4714,-6788,-6366,-3630,388,4186,6398,6300,4066,664,-2557,-4404,-4290,-2435,270,2648,3699,3013,875,-1830,-4020,-4793,-3813,-1399,1599,4089,5184,4471,2183,-893,-3698,-5262,-5027,-3059,7,3148,5314,5772,4369,1559,-1691,-4308,-5395,-4631,-2322,660,3219,4420,3855,1778,-957,-3257,-4189,-3354,-1095,1710,3865,4474,3188,449,-2698,-5015,-5521,-3938,-777,2819,5519,6321,4924,1852,-1753,-4582,-5621,-4575,-1885,1391,4061,5197,4497,2325,-418,-2738,-3829,-3447,-1895,127,1766,2422,1876,397,-1406,-2832,-3319,-2659,-1045,1014,2841,3863,3740,2523,601,-1405,-2837,-3227,-2436,-713,1351,3062,3791,3245,1557,-743,-2894,-4172,-4159,-2899,-869,1147,2417,2493,1399,-364,-2033,-2894,-2523,-1043,1023,2863,3765,3375,1824,-271,-2122,-3000,-2603,-1085,920,2642,3377,2854,1240,-871,-2716,-3664,-3407,-2098,-236,1503,2532,2548,1631,167,-1271,-2173,-2243,-1487,-210,1128,2071,2314,1819,791,-380,-1280,-1593,-1227,-328,751,1603,1863,1406,329,-1006,-2136,-2636,-2280,-1140,426,1888,2717,2596,1515,-172,-1897,-3050,-3205,-2280,-584,1310,2741,3216,2604,1143,-586,-1953,-2442,-1910,-578,992,2201,2542,1902,522,-1060,-2216,-2505,-1802,-390,1192,2309,2537,1749,237,-1452,-2707,-3068,-2409,-973,751,2163,2821,2552,1498,81,-1219,-1957,-1950,-1247,-155,932,1628,1727,1204,286,-714,-1436,-1638,-1255,-429,539,1279,1487,1031,33,-1196,-2185,-2537,-2015,-716,1001,2542,3373,3142,1883,9,-1822,-2933,-2911,-1741,112,1946,3007,2862,1537,-472,-2370,-3407,-3153,-1711,370,2244,3200,2861,1423,-501,-2073,-2640,-1935,-276,1672,3061,3303,2264,309,-1791,-3248,-3504,-2486,-605,1408,2805,3098,2234,584,-1214,-2528,-2924,-2363,-1096,364,1541,2073,1879,1106,66,-879,-1465,-1534,-1114,-357,504,1211,1546,1406,803,-73,-946,-1480,-1444,-772,343,1523,2288,2268,1359,-223,-1928,-3139,-3335,-2362,-511,1574,3109,3491,2544,600,-1608,-3214,-3603,-2597,-609,1588,3129,3423,2391,487,-1476,-2697,-2656,-1411,537,2347,3282,2924,1423,-661,-2488,-3376,-2981,-1481,549,2337,3249,2986,1706,-91,-1745,-2724,-2744,-1926,-620,660,1498,1668,1200,345,-559,-1178,-1328,-972,-262,573,1245,1555,1392,804,-33,-851,-1377,-1416,-910,-32,952,1634,1737,1123,-62,-1441,-2527,-2884,-2308,-933,813,2323,3060,2740,1485,-257,-1806,-2576,-2259,-967,796,2333,3034,2598,1177,-684,-2269,-2962,-2489,-1049,779,2269,2801,2160,572,-1347,-2843,-3330,-2594,-923,1059,2580,3063,2331,673,-1254,-2699,-3095,-2281,-571,1395,2869,3310,2575,965,-886,-2270,-2675,-1965,-448,1278,2545,2868,2137,625,-1102,-2432,-2915,-2438,-1237,217,1382,1889,1616,754,-310,-1163,-1480,-1193,-431,496,1250,1590,1422,850,84,-615,-1030,-1060,-721,-150,457,900,1013,752,138,-640,-1378,-1815,-1788,-1244,-307,764,1635,2014,1752,933,-187,-1180,-1709,-1539,-745,381,1387,1861,1578,623,-656,-1759,-2239,-1885,-809,583,1752,2235,1838,720,-679,-1790,-2156,-1621,-377,1085,2184,2483,1847,516,-997,-2104,-2389,-1735,-416,1065,2132,2386,1739,458,-966,-1978,-2216,-1590,-368,997,1978,2239,1697,578,-683,-1640,-1951,-1551,-635,427,1221,1447,1046,179,-817,-1551,-1755,-1340,-449,603,1454,1805,1545,770,-240,-1128,-1581,-1439,-749,243,1190,1749,1714,1081,60,-998,-1726,-1867,-1372,-422,639,1411,1616,1158,226,-849,-1619,-1792,-1244,-161,1081,2034,2324,1850,757,-548,-1592,-1996,-1619,-621,603,1583,1931,1521,507,-728,-1709,-2092,-1734,-808,330,1241,1605,1316,546,-381,-1064,-1233,-844,-33,835,1453,1568,1155,381,-467,-1084,-1284,-1031,-478,148,613,758,596,207,-206,-500,-569,-428,-162,104,268,282,169,3,-140,-195,-158,-57,56,128,133,80,-4,-72,-101,-78,-31,33,64,71,38,1,-40,-47,-42,-14,15,29,36,17,2,-17,-23,-18,-7,4,14,14,8,3,-9,-8,-8,-3,3,4,7,-1,5,-8,2,-5,1,2,-2,4,-3,2,-2,1,0,-1,1,-1,2,-3,3,-2,1,1,-3,3,-2,2,-2,2,-2,1,1,-2,2,-1,0,1,-2,2,-1,0,0,-1,3,-4,3,-3,3,-1,0,-1,1,0,0,1,-2,2,-2,2,-2,2,-1,0,0,0,0,0,0,0,-1,3,-4,3,-2,2,-2,2,-2,1]


Modal = function(audioContext, striker, numModes) {
  if(!numModes) {
    numModes = 4
  }
  
  this.audioContext = audioContext
  
  this.baseFrequency = 440.0
  this.strikePosition = 0.561
  
  this.ratios = []
  this.radii = []
  this.filters = []
  for(var i = 0; i < numModes; i++) {
    this.ratios.push(0.0)
    this.radii.push(0.0)
    
    var filter = new BiQuad(audioContext)
    this.filters.push(filter)
    filter.setEqualGainZeroes()
  }
  
  this.wav = striker
  // this.envelope = new Envelope(audioContext)
  this.onepole = new OnePole(audioContext)
  this.directGain = new AudioNode(audioContext, audioContext.createGainNode())
  this.oneMinusDirectGain = new AudioNode(audioContext, audioContext.createGainNode())
  
  this.setDirectGain(0)
}
Modal.prototype.setFrequency = function(frequency) {
  this.baseFrequency = frequency
  for(var i in this.filters) {
    this.setRatioAndRadius(i, this.ratios[i], this.radii[i])
  }
}
Modal.prototype.setRatioAndRadius = function(modeIndex, ratio, radius) {
  var nyquist = this.audioContext.sampleRate / 2.0
  
  if(ratio * this.baseFrequency < nyquist) {
    this.ratios[modeIndex] = ratio
  } else {
    var temp = ratio;
    while(temp * this.baseFrequency > nyquist) temp *= 0.5
    this.ratios[modeIndex] = temp
  }
  
  this.radii[modeIndex] = radius
  this.filters[modeIndex].setResonance(ratio < 0 ? -ratio : ratio * this.baseFrequency, radius)
}
Modal.prototype.setModeGain = function(modeIndex, gain) {
  this.filters[modeIndex].setGain(gain)
}
Modal.prototype.strike = function(frequency, amplitude) {
  if(frequency) {
    this.setFrequency(frequency)
  }
  
  if(!amplitude) {
    amplitude = 1
  }
  
  // this.envelope.setRate(1)
  // this.envelope.setTarget(amplitude)
  // this.envelope.tick() // why?
  
  this.onepole.setPole(1 - amplitude)
  
  for(var i in this.filters) {
    if(this.ratios[i] < 0) {
      this.filters[i].setResonance(-this.ratios[i], this.radii[i])
    } else {
      this.filters[i].setResonance(this.ratios[i] * this.baseFrequency, this.radii[i])
    }
  }
  
  this.wav.play(this.onepole)
}
Modal.prototype.damp = function(amplitude) {
  // invert amplitude so that high amplitude means more damping
  amplitude = 1 - (amplitude * 0.03)
  
  for(var i in this.filters) {
    if(this.ratios[i] < 0) {
      this.filters[i].setResonance(-this.ratios[i], this.radii[i] * amplitude)
    } else {
      this.filters[i].setResonance(this.ratios[i] * this.baseFrequency, this.radii[i] * amplitude)
    }
  }
}
Modal.prototype.setMasterGain = function(gain) {
  this.onepole.setGain(gain)
}
Modal.prototype.setDirectGain = function(gain) {
  this.directGain.setGain(gain)
  this.oneMinusDirectGain.setGain(1 - gain)
}
Modal.prototype.connect = function(dest) {
  // this.wav.connect(this.envelope) // we call wav.play() every time we want to play it, which connects for us
  // this.envelope.connect(this.onepole) // tom: took this out because it seems useless?
  
  // branch 1
  this.onepole.connect(this.directGain)
  this.directGain.connect(dest)
  
  // branch 2
  for(var i in this.filters) {
    this.onepole.connect(this.filters[i])
    this.filters[i].connect(this.oneMinusDirectGain)
  }
  this.oneMinusDirectGain.connect(dest)
  
  // wav => envelope => onepole(masterGain) => directGain => out
  //                    onepole(masterGain) => filters[] => 1 - directGain => out
}


ModalBar = function(audioContext) {
  ModalBar.baseConstructor.call(this, audioContext, new ModalStrike(audioContext))
  
  this.setPreset(0)
}
extend(ModalBar, Modal)
ModalBar.prototype.setStickHardness = function(hardness) {
  this.stickHardness = hardness
  this.wav.setRate(Math.pow(4, this.stickHardness))
  this.setMasterGain(0.1 + (1.8 * this.stickHardness))
}
ModalBar.prototype.setStrikePosition = function(position) {
  this.strikePosition = position
  
  // hack only first three modes
  var temp2 = position * Math.PI
  
  this.setModeGain(0, 0.12 * Math.sin(temp2))
  this.setModeGain(1, -0.03 * Math.sin(0.05 + (3.9 * temp2)))
  this.setModeGain(2, 0.11 * Math.sin(-0.05 + (11 * temp2)))
}
ModalBar.prototype.setPreset = function(preset) {
  // Presets:
  //     First line:  relative modal frequencies (negative number is
  //                  a fixed mode that doesn't scale with frequency
  //     Second line: resonances of the modes
  //     Third line:  mode volumes
  //     Fourth line: stickHardness, strikePosition, and direct stick
  //                  gain (mixed directly into the output
  
  // vibraphone (copied from stk)
  var presets = [
    [[1.0, 3.99, 10.65, -2443],   // Marimba
     [0.9996, 0.9994, 0.9994, 0.999],
     [0.04, 0.01, 0.01, 0.008],
     [0.429688, 0.445312, 0.093750]],
    [[1.0, 2.01, 3.9, 14.37],     // Vibraphone
     [0.99995, 0.99991, 0.99992, 0.9999], 
     [0.025, 0.015, 0.015, 0.015 ],
     [0.390625,0.570312,0.078125]],
    [[1.0, 4.08, 6.669, -3725.0],   // Agogo 
     [0.999, 0.999, 0.999, 0.999],  
     [0.06, 0.05, 0.03, 0.02],
     [0.609375,0.359375,0.140625]],
    [[1.0, 2.777, 7.378, 15.377],   // Wood1
     [0.996, 0.994, 0.994, 0.99], 
     [0.04, 0.01, 0.01, 0.008],
     [0.460938,0.375000,0.046875]],
    [[1.0, 2.777, 7.378, 15.377],   // Reso
     [0.99996, 0.99994, 0.99994, 0.9999], 
     [0.02, 0.005, 0.005, 0.004],
     [0.453125,0.250000,0.101562]],
    [[1.0, 1.777, 2.378, 3.377],    // Wood2
     [0.996, 0.994, 0.994, 0.99], 
     [0.04, 0.01, 0.01, 0.008],
     [0.312500,0.445312,0.109375]],
    [[1.0, 1.004, 1.013, 2.377],    // Beats
     [0.9999, 0.9999, 0.9999, 0.999], 
     [0.02, 0.005, 0.005, 0.004],
     [0.398438,0.296875,0.070312]],
    [[1.0, 4.0, -1320.0, -3960.0],    // 2Fix
     [0.9996, 0.999, 0.9994, 0.999],  
     [0.04, 0.01, 0.01, 0.008],
     [0.453125,0.453125,0.070312]],
    [[1.0, 1.217, 1.475, 1.729],    // Clump
     [0.999, 0.999, 0.999, 0.999],  
     [0.03, 0.03, 0.03, 0.03 ],
     [0.390625,0.570312,0.078125]],
  ]
  
  for(var i in this.filters) {
    this.setRatioAndRadius(i, presets[preset][0][i], presets[preset][1][i])
    this.setModeGain(i, presets[preset][2][i])
  }
  
  this.setStickHardness(presets[preset][3][0])
  this.setStrikePosition(presets[preset][3][1])
  this.setDirectGain(presets[preset][3][2])
  
  // if(preset == 1) {
  //   this.vibratoGain = 0.2
  // } else {
  //   this.vibratoGain = 0.0
  // }
}


ModalBarMP3 = function(audioContext, audioBuffer) {
  ModalBarMP3.baseConstructor.call(this, audioContext, audioContext.createGainNode())
  
  this.buffer = audioBuffer
}
extend(ModalBarMP3, AudioNode)
ModalBarMP3.prototype.strike = function(midi, amplitude) {
  midi = Math.floor(midi)
  if(midi < 40 || midi >= 120)
    return
  
  var node = this.audioContext.createBufferSource()
  node.buffer = this.buffer
  node.connect(this.node)
  
  var now = this.audioContext.currentTime
  var offset = (midi - 40) * 6
  offset += 2 * Math.floor(Math.random() * 3)
  
  node.noteGrainOn(now, offset, 2)
  node.noteOff(now + 2)
}


function MultiBar(audioContext, count) {
  MultiBar.baseConstructor.call(this, audioContext, audioContext.createGainNode())
  
  this.xylos = []
  this.nextXylo = 0
  
  for(var i = 0; i < count; i++) {
    this.xylos.push({ connected: false, bar: new ModalBar(audioContext) })
    this.xylos[i].bar.setPreset(1)
  }
}
extend(MultiBar, AudioNode)
MultiBar.prototype.strike = function() {
  var xylo = this.xylos[this.nextXylo]
  if(!xylo.connected) {
    xylo.bar.connect(this)
    xylo.connected = true
  }
  xylo.bar.strike.apply(xylo.bar, arguments)
  this.nextXylo = (this.nextXylo + 1) % this.xylos.length
}



/*
Much of the code below was ported from this (GPL) ChucK script: http://smelt.cs.princeton.edu/pieces/JoyOfChant/JoyOfChant.ck
So I'm also releasing it under the GPL.
*/

Voicer = function(audioContext) {
  this.noise = new Noise(audioContext);

  this.impulser = new Impulser(audioContext);
  this.twozero1 = new TwoZero(audioContext, 1.0, 0.0, -1.0);
  this.twozero2 = new TwoZero(audioContext, 1.0, 0.0, 1.0);
  this.onepole = new OnePole(audioContext, 0.99);
  this.formantFilter1 = new TwoPole(audioContext, 703, 0.997);
  this.formantFilter2 = new TwoPole(audioContext, 1475, 0.997);
  this.formantFilter3 = new TwoPole(audioContext, 2984, 0.997);

  this.noise.setGain(0)
  this.impulser.setGain(5.0)
  this.impulser.vibratoFrequency = 5
  this.impulser.vibratoAmount = 5
  this.onepole.setGain(0.5)
  this.formantFilter1.setGain(0.4 * 1.0)
  this.formantFilter2.setGain(0.4 * 0.8)
  this.formantFilter3.setGain(0.4 * 0.6)
}
Voicer.prototype.setFrequency = function(frequency) {
  this.impulser.frequency = frequency;
}
Voicer.prototype.setVibratoFrequency = function(frequency) {
  this.impulser.vibratoFrequency = frequency;
}
Voicer.prototype.setVibratoAmount = function(amount) {
  this.impulser.vibratoAmount = amount;
}
// x and y range from 0 to 1
Voicer.prototype.setVowel = function(x, y) {
  function dist(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
  }
  var A = dist(x, y, 0, 1);
  var B = dist(x, y, 1, 1);
  var C = dist(x, y, 0, 0);
  var D = dist(x, y, 1, 0);

  var wA = 1.0 / (A + .001);
  var wB = 1.0 / (B + .001);
  var wC = 1.0 / (C + .001);
  var wD = 1.0 / (D + .001);

  var norm = 1 / (wA + wB + wC + wD);

  // var formants = 
  //   [ [ 740.0, 1108.0, 2489.0 ], // ah
  //     [ 530.0, 1864.0, 2637.0 ], // e
  //     [ 349.0, 932.0, 2489.0 ],  // oo
  //     [ 196.0, 2637.0, 2793.0 ]  // i
  //   ];

  // var formants = 
  //   [ [ 703.0, 1475.0, 2984.0 ], // ah
  //     [ 530.0, 1864.0, 2637.0 ], // e
  //     [ 390.0, 1450.0, 2906.0 ], // oo
  //     [ 431.0, 2434.0, 2913.0 ]  // i
  //   ];

  // my favorite
  // var formants = 
  //   [ [ 703.0, 1475.0, 2984.0 ], // ah
  //     [ 530.0, 1864.0, 2637.0 ], // e
  //     [ 400.0,  800.0, 3250.0 ], // oo
  //     [ 431.0, 2434.0, 2913.0 ]  // i
  //   ];

  // female
  var formants = 
    [ [ 590.0, 1220.0, 2810.0 ], // ah
      [ 610.0, 2330.0, 2990.0 ], // e
      [ 370.0,  950.0, 2670.0 ], // oo
      [ 310.0, 2790.0, 3310.0 ]  // i
    ];
  
  var f1freq = (wA * formants[0][0] + wB * formants[1][0] + wC * formants[2][0] + wD * formants[3][0]) * norm * 1.15;
  var f2freq = (wA * formants[0][1] + wB * formants[1][1] + wC * formants[2][1] + wD * formants[3][1]) * norm * 1.15;
  var f3freq = (wA * formants[0][2] + wB * formants[1][2] + wC * formants[2][2] + wD * formants[3][2]) * norm * 1.15;

  this.formantFilter1.setResonance(f1freq, 0.997);
  this.formantFilter2.setResonance(f2freq, 0.997);
  this.formantFilter3.setResonance(f3freq, 0.997);
}
Voicer.prototype.connect = function(dest) {
  this.noise.connect(this.twozero1);
  this.impulser.connect(this.twozero1);
  this.twozero1.connect(this.twozero2);
  this.twozero2.connect(this.onepole);
  this.onepole.connect(this.formantFilter1);
  this.onepole.connect(this.formantFilter2);
  this.onepole.connect(this.formantFilter3);
  this.formantFilter1.connect();
  this.formantFilter2.connect();
  this.formantFilter3.connect();
}
Voicer.prototype.disconnect = function() {
  this.formantFilter3.disconnect();
  this.formantFilter2.disconnect();
  this.formantFilter1.disconnect();
  this.onepole.disconnect();
  this.onepole.disconnect();
  this.onepole.disconnect();
  this.twozero2.disconnect();
  this.twozero1.disconnect();
  this.impulser.disconnect();
}
