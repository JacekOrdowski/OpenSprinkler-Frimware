#!/usr/bin/env python3
"""Muzyka do gry Śmierdzipacha.

Utwory są skomponowane w kodzie (nuty jako MIDI), zagrane instrumentami z zestawu FluidR3_GM
(licencja MIT) i zapisane jako pętle .mp3 w folderze muzyka/ (MP3 odtwarza każda przeglądarka).
Potrzebne: python3 z biblioteką mido, fluidsynth, fluid-soundfont-gm, ffmpeg.
Uruchomienie: python3 narzedzia/muzyka.py

Każdy utwór to 16 taktów (8 taktów części A i 8 części B). Program gra go 3 razy pod rząd i wycina środek,
więc pogłos z końca pętli płynnie przechodzi w jej początek. W pliku pętla zaczyna się po 0,5 s
i trwa dokładnie 16 taktów; na końcu program wypisuje te czasy dla gra.js (MUSIC_LOOPS).
"""
import json, os, random, subprocess, sys
import mido

SF2 = '/usr/share/sounds/sf2/FluidR3_GM.sf2'
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'muzyka')
TMP = os.environ.get('TMPDIR_MUZYKA', '/var/tmp/muzyka')
TPB = 480                      # MIDI ticks per beat
BARS, LEAD = 16, 0.5           # bars in a loop, seconds of the loop repeated before and after it in the file
SR, XFADE, TARGET_DB = 44100, 0.05, -21   # sample rate, cross-fade at the loop point, loudness (RMS, dB)
NOTE = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
SCALES = {'major': [0, 2, 4, 5, 7, 9, 11], 'minor': [0, 2, 3, 5, 7, 8, 10]}
QUAL = {'': [0, 4, 7], 'm': [0, 3, 7], '7': [0, 4, 7, 10], 'maj7': [0, 4, 7, 11], 'm7': [0, 3, 7, 10], 'sus4': [0, 5, 7]}


def chord(name):
    r, i = NOTE[name[0]], 1
    if i < len(name) and name[i] in '#b':
        r += 1 if name[i] == '#' else -1
        i += 1
    return r % 12, QUAL[name[i:]]


def near(pcs, target):
    """MIDI note with one of the pitch classes, nearest to target"""
    best = None
    for pc in pcs:
        for o in range(0, 10):
            n = pc + 12 * o
            if best is None or abs(n - target) < abs(best - target):
                best = n
    return best


def voicing(root, iv, center):
    """chord notes within an octave around center"""
    return sorted(near([(root + x) % 12], center) for x in iv)


class Song:
    def __init__(self, name, bpm, key, mode, prog, seed=1):
        self.name, self.bpm, self.mode = name, bpm, mode
        self.key = NOTE[key[0]] + (1 if key[1:] == '#' else -1 if key[1:] == 'b' else 0)
        self.prog = [chord(c) for c in prog]
        assert len(self.prog) == BARS
        self.tracks = []       # (program, channel, volume, pan, reverb, events)
        self.rng = random.Random(seed)
        self.tempo = mido.bpm2tempo(bpm)

    def part(self, program, channel, vol=100, pan=64, rev=40, pump=False, detune=0, lfo=None):
        """pump: the part ducks on every beat like in dance music; detune: in cents, for a wider sound;
        lfo: (beats per wobble for every bar, lowest volume 0-127) for a wobbling bass"""
        ev = []
        self.tracks.append((program, channel, vol, pan, rev, ev, {'pump': pump, 'detune': detune, 'lfo': lfo}))
        return ev

    @staticmethod
    def keep(ev, bars):
        """keep only the notes in the given bars (to leave a part out of a section)"""
        bars = set(bars)
        ev[:] = [e for e in ev if e[0] // (4 * TPB) in bars]

    def vel(self, v):
        return max(1, min(127, v + self.rng.randint(-5, 5)))

    def note(self, ev, bar, beat, dur, n, v):
        start = int((bar * 4 + beat) * TPB)
        ev.append((start, max(10, int(dur * TPB)), n, self.vel(v)))

    # ---------- patterns ----------
    def pad(self, ev, center=64, v=55, beats=4):
        for b, (r, iv) in enumerate(self.prog):
            for n in voicing(r, iv, center):
                self.note(ev, b, 0, beats - 0.05, n, v)

    def stabs(self, ev, hits, center=64, v=70):
        """chords on given (beat, length) hits in every bar"""
        for b, (r, iv) in enumerate(self.prog):
            for beat, dur in hits:
                for k, n in enumerate(voicing(r, iv, center)):
                    self.note(ev, b, beat + k * 0.01, dur, n, v)

    def arp(self, ev, step=0.5, center=67, span=2, v=62, shape='updown'):
        for b, (r, iv) in enumerate(self.prog):
            tones = voicing(r, iv, center - 4)
            tones = tones + [t + 12 for t in tones][:span]
            order = tones + tones[-2:0:-1] if shape == 'updown' else tones
            k = 0
            t = 0.0
            while t < 3.999:
                self.note(ev, b, t, step * 0.9, order[k % len(order)], v - (8 if (t * 2) % 2 else 0))
                t += step
                k += 1

    def bass(self, ev, pattern, octave=36, v=88):
        """pattern: (beat, which, length) with which in R (root), 5 (fifth), 8 (octave), 3 (third)"""
        for b, (r, iv) in enumerate(self.prog):
            root = near([r], octave + 6)
            for beat, which, dur in pattern:
                n = root + {'R': 0, '5': 7, '8': 12, '3': iv[1], '-': -12}[which]
                self.note(ev, b, beat, dur, n, v)

    def melody(self, ev, motifs, center=74, v=84, octave_up=False):
        """motifs[0] for bars 0-7, motifs[1] for bars 8-15: (sixteenth 0-31, scale step, length in sixteenths);
        the motif repeats every 2 bars from the chord of that bar; notes on strong beats land on chord tones"""
        scale = SCALES[self.mode]
        def deg_note(d):
            o, i = divmod(d, 7)
            return self.key + scale[i] + 12 * o
        for pair in range(BARS // 2):
            b0 = pair * 2
            r, iv = self.prog[b0]
            # anchor: the chord root as a scale degree near the centre
            rd = min(range(7), key=lambda i: abs(((self.key + scale[i]) - r) % 12))
            cands = [rd + 7 * o for o in range(0, 12)]
            anchor = min(cands, key=lambda d: abs(deg_note(d) - center))
            motif = motifs[0] if b0 < 8 else motifs[1]
            for pos, stepd, dur in motif:
                bar = b0 + pos // 16
                n = deg_note(anchor + stepd)
                if pos % 8 == 0:
                    cr, civ = self.prog[bar]
                    n = near([(cr + x) % 12 for x in civ], n)
                beat = (pos % 16) / 4
                self.note(ev, bar, beat, dur / 4 * 0.95, n, v + (6 if pos % 16 == 0 else 0))
                if octave_up:
                    self.note(ev, bar, beat, dur / 4 * 0.95, n + 12, v - 30)

    def drums(self, ev, grid, fills=True, crash=True, swing=0.0, v=90, roll=False):
        """grid: {drum note: 16-step string}, x = hit, X = accent, o = soft; roll: snare roll before the second half"""
        for b in range(BARS):
            if roll and b == 7:
                for i in range(16):
                    self.note(ev, b, i / 4, 0.2, 38, v - 40 + i * 3)
                for n, pat in grid.items():
                    if n not in (38, 39, 40):
                        for i, ch in enumerate(pat[:8]):
                            if ch != '.':
                                self.note(ev, b, i / 4, 0.2, n, {'x': v, 'X': v + 18, 'o': v - 30}[ch])
                continue
            last = fills and b in (7, 15)
            for n, pat in grid.items():
                for i, ch in enumerate(pat):
                    if ch == '.' or (last and i >= 12 and n in (38, 39, 40)):
                        continue
                    beat = i / 4 + (swing / 4 if i % 2 else 0)
                    self.note(ev, b, beat, 0.2, n, {'x': v, 'X': v + 18, 'o': v - 30}[ch])
            if last:
                for k in range(4):
                    self.note(ev, b, 3 + k / 4, 0.2, 38, v - 20 + k * 10)
            if crash and b in (0, 8):
                self.note(ev, b, 0, 1, 49, v + 5)

    # ---------- output ----------
    def midi(self, cycles=3, pump=None):
        """pump=None: all parts; True or False: only the parts that duck on the beat, or only the others"""
        import math
        mid = mido.MidiFile(ticks_per_beat=TPB)
        meta = mido.MidiTrack()
        mid.tracks.append(meta)
        meta.append(mido.MetaMessage('set_tempo', tempo=self.tempo, time=0))
        cyc = BARS * 4 * TPB
        for program, ch, vol, pan, rev, ev, opt in self.tracks:
            if pump is not None and opt['pump'] != pump:
                continue
            t = mido.MidiTrack()
            mid.tracks.append(t)
            if ch != 9:
                t.append(mido.Message('program_change', program=program, channel=ch, time=0))
            for cc, val in ((7, vol), (10, pan), (91, rev), (93, 10)):
                t.append(mido.Message('control_change', control=cc, value=val, channel=ch, time=0))
            if opt['detune']:
                t.append(mido.Message('pitchwheel', pitch=int(opt['detune'] / 200 * 8191), channel=ch, time=0))
            msgs = []
            for c in range(cycles):
                for start, dur, n, v in ev:
                    s = start + c * cyc
                    msgs.append((s, 2, n, v))
                    msgs.append((s + dur, 0, n, 0))
            if opt['lfo']:
                rates, low = opt['lfo']
                step = TPB // 32
                for c in range(cycles):
                    for k in range(0, cyc, step):
                        per = rates[(k // (4 * TPB)) % len(rates)] * TPB
                        ph = (k % per) / per
                        msgs.append((k + c * cyc, 1, 11, int(low + (127 - low) * (0.5 - 0.5 * math.cos(2 * math.pi * ph)))))
            msgs.sort(key=lambda m: (m[0], m[1]))
            now = 0
            for tm, kind, n, v in msgs:
                if kind == 1:
                    t.append(mido.Message('control_change', control=n, value=v, channel=ch, time=tm - now))
                else:
                    t.append(mido.Message('note_on' if kind == 2 else 'note_off', note=n, velocity=v, channel=ch, time=tm - now))
                now = tm
        return mid

    def loop_seconds(self):
        return BARS * 4 * self.tempo / 1e6


# ---------- the songs ----------
def wesola_bieg():
    s = Song('wesola-bieg', 116, 'C', 'major', ['C', 'G', 'Am', 'F', 'C', 'G', 'F', 'G', 'F', 'G', 'Em', 'Am', 'F', 'G', 'C', 'G'], 11)
    s.arp(s.part(12, 0, 92, 40, 30), 0.5, 69, 2, 66)                          # marimba
    s.stabs(s.part(24, 1, 70, 90, 35), [(1, 0.3), (1.5, 0.3), (3, 0.3), (3.5, 0.3)], 60, 52)   # nylon guitar, ukulele-like
    s.bass(s.part(32, 2, 100, 64, 20), [(0, 'R', 1.4), (1.5, 'R', 0.4), (2, '5', 1.4), (3.5, '8', 0.4)], 36, 86)
    s.melody(s.part(73, 3, 100, 70, 45), [
        [(0, 0, 2), (2, 1, 2), (4, 2, 4), (8, 4, 2), (10, 2, 2), (12, 1, 4), (16, 0, 2), (18, 2, 2), (20, 4, 4), (24, 5, 4), (28, 4, 4)],
        [(0, 4, 6), (6, 3, 2), (8, 2, 4), (12, 1, 4), (16, 2, 6), (22, 1, 2), (24, 0, 8)]], 74, 80)
    s.melody(s.part(9, 4, 60, 50, 50), [[(0, 0, 2), (8, 4, 2), (16, 2, 2), (24, 5, 2)], [(0, 4, 4), (8, 2, 4), (16, 2, 4), (24, 0, 4)]], 86, 60)   # glockenspiel sparkles
    s.drums(s.part(0, 9, 90, 64, 25), {36: 'x.......x.......', 39: '....x.......x...', 70: '..o...o...o...o.', 42: 'o.o.o.o.o.o.o.o.', 54: '............o...'}, v=84)
    return s


def wesola_walka():
    s = Song('wesola-walka', 132, 'A', 'minor', ['Am', 'F', 'C', 'G', 'Am', 'F', 'G', 'G', 'F', 'G', 'Am', 'Am', 'F', 'G', 'E', 'E'], 12)
    s.arp(s.part(12, 0, 90, 40, 30), 0.25, 69, 2, 60)                         # marimba sixteenths
    s.stabs(s.part(45, 1, 80, 88, 35), [(0, 0.2), (0.5, 0.2), (1, 0.2), (1.5, 0.2), (2, 0.2), (2.5, 0.2), (3, 0.2), (3.5, 0.2)], 62, 50)   # pizzicato strings
    s.bass(s.part(33, 2, 100, 64, 15), [(0, 'R', 0.4), (0.5, 'R', 0.4), (1, 'R', 0.4), (1.5, '8', 0.4), (2, '5', 0.4), (2.5, '5', 0.4), (3, '8', 0.4), (3.5, '5', 0.4)], 36, 84)
    s.melody(s.part(13, 3, 100, 64, 40), [
        [(0, 0, 2), (2, 0, 2), (4, 2, 2), (6, 4, 2), (8, 5, 4), (12, 4, 4), (16, 2, 2), (18, 2, 2), (20, 4, 2), (22, 2, 2), (24, 1, 4), (28, -1, 4)],
        [(0, 4, 4), (4, 5, 4), (8, 4, 2), (10, 2, 2), (12, 0, 4), (16, 1, 4), (20, 2, 4), (24, 4, 8)]], 76, 86)
    s.melody(s.part(73, 4, 80, 50, 45), [[(0, 0, 4), (8, 2, 8)], [(0, 4, 8), (16, 2, 8)]], 72, 62)                           # flute
    s.drums(s.part(0, 9, 95, 64, 20), {36: 'x...x...x...x...', 38: '....x.......x...', 42: 'x.x.x.x.x.x.x.x.', 47: '..............o.'}, v=90)
    return s


def chill_bieg():
    s = Song('chill-bieg', 84, 'F', 'major', ['Fmaj7', 'Em7', 'Dm7', 'Cmaj7', 'Bbmaj7', 'Am7', 'Gm7', 'C7', 'Dm7', 'Gm7', 'C7', 'Fmaj7', 'Bbmaj7', 'Gm7', 'Am7', 'C7'], 31)
    s.stabs(s.part(4, 0, 95, 54, 55), [(0, 1.8), (2.5, 1.3)], 62, 58)           # electric piano
    s.pad(s.part(89, 1, 55, 74, 70), 58, 40)                                   # warm pad, quiet
    s.bass(s.part(33, 2, 100, 64, 20), [(0, 'R', 1.4), (1.75, '5', 0.5), (2.5, 'R', 0.9), (3.5, '3', 0.4)], 36, 78)
    s.melody(s.part(11, 3, 95, 76, 55), [
        [(0, 4, 6), (8, 2, 2), (10, 1, 2), (12, 0, 4), (16, 2, 8), (28, 1, 4)],
        [(0, 0, 4), (4, 2, 4), (8, 4, 4), (12, 6, 4), (16, 5, 8), (24, 4, 8)]], 74, 72)   # vibraphone
    s.drums(s.part(0, 9, 85, 64, 25), {36: 'x.....x...x.....', 37: '....x.......x...', 42: 'o.o.o.o.o.o.o.o.'}, fills=False, crash=False, swing=0.33, v=80)
    return s


def chill_walka():
    s = Song('chill-walka', 94, 'D', 'minor', ['Dm7', 'Bbmaj7', 'Gm7', 'A7', 'Dm7', 'Bbmaj7', 'Gm7', 'A7', 'Bbmaj7', 'C7', 'Am7', 'Dm7', 'Gm7', 'C7', 'A7', 'A7'], 32)
    s.stabs(s.part(4, 0, 95, 54, 55), [(0, 0.9), (1.5, 0.4), (2.5, 0.9)], 62, 60)
    s.pad(s.part(89, 1, 60, 74, 70), 58, 42)
    s.bass(s.part(39, 2, 95, 64, 15), [(0, 'R', 0.7), (0.75, 'R', 0.2), (1.5, '5', 0.4), (2, 'R', 0.7), (3, '8', 0.4), (3.5, '5', 0.4)], 36, 82)
    s.melody(s.part(27, 3, 95, 76, 50), [
        [(0, 0, 4), (4, 2, 2), (6, 4, 2), (8, 3, 6), (16, 2, 4), (20, 0, 4), (24, -1, 8)],
        [(0, 4, 4), (4, 5, 4), (8, 7, 4), (12, 5, 4), (16, 4, 8), (24, 2, 8)]], 72, 76)   # clean electric guitar
    s.drums(s.part(0, 9, 90, 64, 25), {36: 'x..x..x...x..x..', 38: '....x.......x...', 42: 'oooooooooooooooo'}, crash=False, swing=0.25, v=84)
    return s


def elektro_bieg():
    s = Song('elektro-bieg', 118, 'A', 'minor', ['Am', 'F', 'C', 'G', 'Am', 'F', 'C', 'G', 'Dm', 'F', 'Am', 'G', 'Dm', 'F', 'E', 'E'], 41)
    s.bass(s.part(38, 0, 100, 64, 20), [(i / 2, 'R' if i % 2 == 0 else '8', 0.4) for i in range(8)], 33, 86)   # synth bass, octave pulses
    s.pad(s.part(90, 1, 70, 64, 70), 60, 50)                                   # polysynth pad
    s.arp(s.part(80, 2, 55, 90, 40), 0.25, 74, 2, 48, 'up')                    # square-wave arpeggio, quiet
    s.melody(s.part(81, 3, 90, 50, 50), [
        [(0, 0, 4), (4, 2, 4), (8, 4, 6), (14, 2, 2), (16, 1, 4), (20, 0, 4), (24, -1, 4), (28, 0, 4)],
        [(0, 4, 2), (2, 5, 2), (4, 4, 4), (8, 2, 4), (12, 0, 4), (16, 4, 2), (18, 5, 2), (20, 7, 4), (24, 6, 8)]], 72, 78)   # saw lead
    s.drums(s.part(0, 9, 95, 64, 30), {36: 'x...x...x...x...', 38: '....x.......x...', 39: '....o.......o...', 46: '..o...o...o...o.', 42: 'o.o.o.o.o.o.o.o.'}, v=88)
    return s


def elektro_walka():
    s = Song('elektro-walka', 134, 'E', 'minor', ['Em', 'C', 'D', 'B', 'Em', 'C', 'D', 'B', 'Am', 'Em', 'C', 'D', 'Am', 'Em', 'B', 'B'], 42)
    s.bass(s.part(38, 0, 100, 64, 15), [(i / 4, 'R' if i % 4 != 3 else '8', 0.2) for i in range(16)], 33, 84)   # sixteenth-note synth bass
    s.pad(s.part(90, 1, 65, 64, 60), 62, 50)
    s.arp(s.part(80, 2, 55, 96, 35), 0.25, 76, 2, 46)
    s.melody(s.part(81, 3, 92, 40, 45), [
        [(0, 0, 2), (2, 0, 2), (4, 2, 2), (6, 0, 2), (8, 4, 4), (12, 3, 4), (16, 2, 2), (18, 2, 2), (20, 4, 2), (22, 2, 2), (24, 1, 8)],
        [(0, 4, 4), (4, 7, 4), (8, 6, 4), (12, 4, 4), (16, 5, 4), (20, 4, 4), (24, 2, 8)]], 74, 82)
    s.drums(s.part(0, 9, 100, 64, 25), {36: 'x...x...x...x..o', 38: '....X.......X...', 39: '....x.......x...', 42: 'xoxoxoxoxoxoxoxo', 46: '..o...o...o...o.'}, v=90)
    return s


# ---------- fast dance tunes in the spirit of Geometry Dash: pumping chords, sharp synths, a drum roll before the drop ----------
HOUSE = {36: 'x...x...x...x...', 39: '....x.......x...', 46: '..x...x...x...x.', 42: 'o.o.o.o.o.o.o.o.'}
HALF = {36: 'x.........x.....', 38: '........X.......', 39: '........x.......', 46: '..o...o...o...o.', 42: 'oooooooooooooooo'}


def turbo_bieg():
    """electro house"""
    s = Song('turbo-bieg', 128, 'G', 'major', ['G', 'D', 'Em', 'C', 'G', 'D', 'Em', 'C', 'C', 'D', 'Em', 'Em', 'C', 'D', 'G', 'D'], 51)
    s.pad(s.part(81, 0, 72, 40, 45, pump=True, detune=12), 62, 58)            # two slightly detuned saw chords, pumping
    s.pad(s.part(81, 1, 72, 88, 45, pump=True, detune=-12), 62, 58)
    s.bass(s.part(39, 2, 100, 64, 15), [(0.5, 'R', 0.35), (1.5, 'R', 0.35), (2.5, 'R', 0.35), (3.5, '8', 0.35)], 36, 92)   # bass on the off-beats
    arp = s.part(80, 3, 62, 96, 35)
    s.arp(arp, 0.25, 74, 2, 50, 'up')
    s.keep(arp, range(8))
    s.melody(s.part(80, 4, 92, 54, 40), [
        [(0, 4, 2), (3, 4, 1), (4, 2, 2), (6, 4, 2), (8, 5, 2), (10, 4, 2), (12, 2, 2), (14, 1, 2), (16, 0, 2), (19, 0, 1), (20, 1, 2), (22, 2, 2), (24, 4, 4), (28, 2, 4)],
        []], 74, 82)                                                          # square lead in the first half
    s.melody(s.part(81, 5, 100, 70, 45), [[], [
        (0, 0, 2), (2, 2, 2), (4, 4, 3), (7, 5, 1), (8, 4, 2), (10, 2, 2), (12, 4, 2), (14, 7, 2), (16, 6, 3), (19, 5, 1), (20, 4, 2), (22, 2, 2), (24, 4, 4), (28, 5, 2), (30, 4, 2)]],
        74, 88, octave_up=True)                                               # saw lead with its octave: the drop
    s.drums(s.part(0, 9, 100, 64, 20), HOUSE, fills=True, roll=True, v=92)
    return s


def turbo_walka():
    s = Song('turbo-walka', 140, 'E', 'minor', ['Em', 'C', 'G', 'D', 'Em', 'C', 'G', 'B', 'C', 'D', 'Em', 'Em', 'C', 'D', 'B', 'B'], 52)
    s.pad(s.part(81, 0, 70, 40, 40, pump=True, detune=14), 62, 58)
    s.pad(s.part(81, 1, 70, 88, 40, pump=True, detune=-14), 62, 58)
    s.bass(s.part(39, 2, 100, 64, 10), [(i / 4, 'R' if i % 8 != 6 else '8', 0.2) for i in range(16)], 36, 90)   # rolling sixteenths
    s.arp(s.part(80, 3, 58, 96, 30), 0.25, 76, 2, 46)
    s.melody(s.part(81, 4, 100, 60, 40), [
        [(0, 0, 2), (2, 0, 2), (4, 2, 2), (6, 4, 2), (8, 3, 2), (10, 2, 2), (12, 0, 2), (14, 2, 2), (16, 4, 2), (18, 4, 2), (20, 5, 2), (22, 4, 2), (24, 2, 4), (28, 1, 4)],
        [(0, 4, 2), (2, 7, 2), (4, 6, 2), (6, 4, 2), (8, 5, 4), (12, 4, 2), (14, 2, 2), (16, 4, 2), (18, 2, 2), (20, 0, 2), (22, 2, 2), (24, 4, 6), (30, 5, 2)]],
        76, 90, octave_up=True)
    s.drums(s.part(0, 9, 100, 64, 20), {**HOUSE, 38: '....x.......x...'}, roll=True, v=94)
    return s


def neon_bieg():
    """chiptune dance: square-wave melodies and quick arpeggios"""
    s = Song('neon-bieg', 136, 'A', 'minor', ['Am', 'F', 'C', 'G', 'Am', 'F', 'G', 'E', 'F', 'G', 'Am', 'Am', 'F', 'G', 'E', 'E'], 61)
    s.pad(s.part(90, 0, 60, 64, 50, pump=True), 60, 50)                       # soft synth chords, pumping
    s.bass(s.part(38, 1, 100, 64, 10), [(i / 2, 'R' if i % 2 == 0 else '8', 0.4) for i in range(8)], 33, 90)
    s.arp(s.part(80, 2, 66, 30, 30), 0.25, 79, 3, 52, 'up')                   # fast square arpeggio
    s.melody(s.part(80, 3, 100, 80, 35), [
        [(0, 0, 1), (1, 2, 1), (2, 4, 2), (4, 2, 2), (6, 4, 2), (8, 5, 2), (10, 4, 1), (11, 2, 1), (12, 4, 4), (16, 0, 1), (17, 2, 1), (18, 4, 2), (20, 7, 2), (22, 6, 2), (24, 4, 4), (28, 2, 4)],
        [(0, 7, 2), (2, 6, 2), (4, 7, 2), (6, 4, 2), (8, 5, 2), (10, 4, 2), (12, 2, 2), (14, 4, 2), (16, 0, 2), (18, 2, 2), (20, 4, 2), (22, 5, 2), (24, 4, 8)]],
        76, 88)
    s.melody(s.part(98, 4, 60, 40, 60), [[(0, 7, 2), (16, 9, 2)], [(0, 7, 2), (8, 9, 2), (16, 11, 2), (24, 9, 2)]], 84, 60)   # crystal sparkles
    s.drums(s.part(0, 9, 98, 64, 20), {36: 'x...x...x...x...', 38: '....x.......x...', 42: 'xoxoxoxoxoxoxoxo', 46: '..............o.'}, roll=True, v=90)
    return s


def neon_walka():
    s = Song('neon-walka', 150, 'D', 'minor', ['Dm', 'Bb', 'C', 'A', 'Dm', 'Bb', 'C', 'A', 'Gm', 'A', 'Dm', 'Dm', 'Bb', 'C', 'A', 'A'], 62)
    s.pad(s.part(90, 0, 60, 64, 45, pump=True), 60, 50)
    s.bass(s.part(38, 1, 100, 64, 10), [(i / 4, ['R', 'R', '8', 'R'][i % 4], 0.2) for i in range(16)], 33, 88)
    s.arp(s.part(80, 2, 62, 30, 25), 0.25, 79, 3, 50)
    s.melody(s.part(80, 3, 100, 80, 35), [
        [(0, 0, 2), (2, 4, 2), (4, 7, 2), (6, 4, 2), (8, 5, 2), (10, 4, 2), (12, 2, 2), (14, 1, 2), (16, 0, 2), (18, 4, 2), (20, 7, 2), (22, 9, 2), (24, 7, 4), (28, 5, 4)],
        [(0, 7, 1), (1, 7, 1), (2, 9, 2), (4, 7, 2), (6, 5, 2), (8, 4, 2), (10, 5, 2), (12, 4, 2), (14, 2, 2), (16, 0, 1), (17, 0, 1), (18, 2, 2), (20, 4, 2), (22, 5, 2), (24, 4, 4), (28, 2, 4)]],
        76, 90, octave_up=True)
    s.drums(s.part(0, 9, 100, 64, 20), {36: 'x...x...x...x.x.', 38: '....X.......X...', 42: 'xxxxxxxxxxxxxxxx', 46: '..o...o...o...o.'}, roll=True, v=92)
    return s


def skok_bieg():
    """half-time dance with a wobbling bass"""
    s = Song('skok-bieg', 140, 'F', 'minor', ['Fm', 'Db', 'Ab', 'Eb', 'Fm', 'Db', 'Ab', 'Eb', 'Db', 'Eb', 'Fm', 'Fm', 'Db', 'Eb', 'C', 'C'], 71)
    s.bass(s.part(38, 0, 110, 64, 10, lfo=([1, 0.5, 1, 0.5, 0.5, 0.5, 1, 0.25] * 2, 18)), [(0, 'R', 1.95), (2, 'R', 1.45), (3.5, '8', 0.45)], 33, 100)   # wobble bass
    s.pad(s.part(89, 1, 55, 64, 70, pump=True), 60, 46)
    arp = s.part(81, 2, 55, 90, 50)
    s.arp(arp, 0.5, 72, 2, 50, 'up')
    s.keep(arp, range(8))
    s.melody(s.part(81, 3, 100, 50, 45), [
        [(0, 0, 4), (6, 2, 2), (8, 4, 4), (12, 3, 4), (16, 2, 4), (22, 0, 2), (24, -1, 8)],
        [(0, 4, 2), (2, 4, 1), (3, 5, 1), (4, 4, 2), (6, 2, 2), (8, 7, 4), (12, 6, 2), (14, 4, 2), (16, 5, 2), (18, 4, 2), (20, 2, 2), (22, 4, 2), (24, 0, 8)]],
        74, 88, octave_up=True)
    s.drums(s.part(0, 9, 100, 64, 25), HALF, roll=True, v=94)
    return s


def skok_walka():
    s = Song('skok-walka', 150, 'C#', 'minor', ['C#m', 'A', 'E', 'B', 'C#m', 'A', 'E', 'B', 'A', 'B', 'C#m', 'C#m', 'A', 'B', 'G#', 'G#'], 72)
    s.bass(s.part(38, 0, 110, 64, 10, lfo=([0.5, 0.25, 0.5, 1 / 6, 0.25, 0.25, 0.5, 1 / 6] * 2, 14)), [(0, 'R', 1.45), (1.5, 'R', 0.45), (2, '8', 0.95), (3, 'R', 0.95)], 33, 100)
    s.pad(s.part(89, 1, 55, 64, 70, pump=True), 60, 46)
    s.arp(s.part(80, 2, 52, 90, 35), 0.25, 76, 2, 44, 'up')
    s.melody(s.part(81, 3, 100, 50, 45), [
        [(0, 0, 2), (2, 0, 1), (3, 2, 1), (4, 4, 2), (6, 2, 2), (8, 5, 4), (12, 4, 2), (14, 2, 2), (16, 0, 2), (18, 2, 2), (20, 4, 2), (22, 7, 2), (24, 6, 4), (28, 4, 4)],
        [(0, 7, 2), (2, 7, 2), (4, 9, 2), (6, 7, 2), (8, 6, 2), (10, 4, 2), (12, 6, 2), (14, 7, 2), (16, 4, 4), (20, 2, 2), (22, 4, 2), (24, 0, 8)]],
        74, 90, octave_up=True)
    s.drums(s.part(0, 9, 100, 64, 25), {**HALF, 36: 'x.........x...x.', 42: 'xoxoxoxoxoxoxoxo'}, roll=True, v=96)
    return s


SONGS = [wesola_bieg, wesola_walka, chill_bieg, chill_walka, elektro_bieg, elektro_walka,
         turbo_bieg, turbo_walka, neon_bieg, neon_walka, skok_bieg, skok_walka]


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        sys.exit(f'{cmd[0]} failed: {r.stderr[-800:]}')
    return r


def render(song):
    """MIDI -> FluidSynth -> one seamless loop -> .mp3. Returns (file, loop start, loop end in seconds)."""
    import numpy as np
    os.makedirs(TMP, exist_ok=True)
    loop = os.path.join(TMP, song.name + '.loop.wav')
    def synth(tag, pump):
        mid, wav = (os.path.join(TMP, song.name + tag + ext) for ext in ('.mid', '.wav'))
        song.midi(pump=pump).save(mid)
        run(['fluidsynth', '-ni', '-g', '0.5', '-r', str(SR), '-F', wav, SF2, mid])
        raw = run_bytes(['ffmpeg', '-v', 'error', '-i', wav, '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'])
        return np.frombuffer(raw, dtype='<f4').reshape(-1, 2)
    n = round(song.loop_seconds() * SR)
    if any(opt['pump'] for *_, opt in song.tracks):
        a, p = synth('', False), synth('.pump', True)
        m = min(len(a), len(p))
        beat = 60 / song.bpm * SR
        ph = (np.arange(m) % beat) / beat                          # where in the beat every sample is
        env = 0.3 + 0.7 * np.minimum(1, ph / 0.55) ** 0.8          # duck at the kick, come back within half a beat
        a = a[:m] + p[:m] * env[:, None]
    else:
        a = synth('', None)
    # the middle repeat already holds the echo of the one before; its start is cross-faded with what really
    # follows its end, so the jump from the end of the loop back to its start is smooth
    f = a[n:2 * n].copy()
    c = int(XFADE * SR)
    k = np.linspace(0, 1, c, endpoint=False)[:, None]
    f[:c] = a[n:n + c] * k + a[2 * n:2 * n + c] * (1 - k)
    lead = int(LEAD * SR)
    g = np.concatenate([f[-lead:], f, f[:lead]])        # one loop with a bit of itself on both sides
    rms = float(np.sqrt(np.mean(f ** 2)))
    g = g * min(10 ** (TARGET_DB / 20) / max(rms, 1e-6), 0.89 / float(np.max(np.abs(g))))
    with open(loop, 'wb') as fh:
        fh.write(wav_bytes(g.astype('<f4')))
    out = os.path.join(OUT, song.name + '.mp3')
    run(['ffmpeg', '-hide_banner', '-y', '-i', loop, '-c:a', 'libmp3lame', '-b:a', '128k', '-ar', str(SR), out])
    return out, lead / SR, (lead + n) / SR


def run_bytes(cmd):
    r = subprocess.run(cmd, capture_output=True)
    if r.returncode:
        sys.exit(f'{cmd[0]} failed')
    return r.stdout


def wav_bytes(x):
    """32-bit float stereo WAV"""
    import struct
    data = x.tobytes()
    hdr = b'RIFF' + struct.pack('<I', 36 + len(data)) + b'WAVEfmt ' + struct.pack('<IHHIIHH', 16, 3, 2, SR, SR * 8, 8, 32)
    return hdr + b'data' + struct.pack('<I', len(data)) + data


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    only = sys.argv[1:]
    loops = {}
    for make in SONGS:
        song = make()
        if only and song.name not in only:
            continue
        out, start, end = render(song)
        loops[song.name] = [round(start, 6), round(end, 6)]
        print(f'{song.name}: {song.bpm} bpm, pętla {start:.3f}–{end:.3f} s, plik {os.path.getsize(out) // 1024} KB')
    print('Dla gra.js (MUSIC_LOOPS):', json.dumps(loops))
