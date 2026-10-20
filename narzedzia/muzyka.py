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

    def part(self, program, channel, vol=100, pan=64, rev=40):
        ev = []
        self.tracks.append((program, channel, vol, pan, rev, ev))
        return ev

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

    def drums(self, ev, grid, fills=True, crash=True, swing=0.0, v=90):
        """grid: {drum note: 16-step string}, x = hit, X = accent, o = soft"""
        for b in range(BARS):
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
    def midi(self, cycles=3):
        mid = mido.MidiFile(ticks_per_beat=TPB)
        meta = mido.MidiTrack()
        mid.tracks.append(meta)
        meta.append(mido.MetaMessage('set_tempo', tempo=self.tempo, time=0))
        cyc = BARS * 4 * TPB
        for program, ch, vol, pan, rev, ev in self.tracks:
            t = mido.MidiTrack()
            mid.tracks.append(t)
            if ch != 9:
                t.append(mido.Message('program_change', program=program, channel=ch, time=0))
            for cc, val in ((7, vol), (10, pan), (91, rev), (93, 10)):
                t.append(mido.Message('control_change', control=cc, value=val, channel=ch, time=0))
            msgs = []
            for c in range(cycles):
                for start, dur, n, v in ev:
                    s = start + c * cyc
                    msgs.append((s, 1, n, v))
                    msgs.append((s + dur, 0, n, 0))
            msgs.sort(key=lambda m: (m[0], m[1]))
            now = 0
            for tm, on, n, v in msgs:
                t.append(mido.Message('note_on' if on else 'note_off', note=n, velocity=v, channel=ch, time=tm - now))
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


def przygoda_bieg():
    s = Song('przygoda-bieg', 108, 'D', 'minor', ['Dm', 'Bb', 'F', 'C', 'Dm', 'Bb', 'C', 'A', 'Bb', 'C', 'Dm', 'Dm', 'Bb', 'C', 'A', 'A'], 21)
    s.pad(s.part(48, 0, 90, 64, 70), 62, 56)                                   # strings
    s.arp(s.part(46, 1, 85, 40, 55), 0.5, 67, 2, 58, 'up')                     # harp
    s.bass(s.part(42, 2, 95, 64, 50), [(0, 'R', 1.9), (2, '5', 1.9)], 36, 76)  # cello
    s.bass(s.part(47, 3, 100, 64, 50), [(0, 'R', 0.9), (2.5, 'R', 0.4), (3, '5', 0.9)], 36, 92)   # timpani
    s.melody(s.part(60, 4, 105, 70, 60), [
        [(0, 0, 6), (6, 1, 2), (8, 2, 4), (12, 4, 4), (16, 3, 6), (22, 2, 2), (24, 1, 8)],
        [(0, 4, 4), (4, 5, 4), (8, 6, 4), (12, 7, 4), (16, 6, 6), (22, 5, 2), (24, 4, 8)]], 67, 88)   # french horn
    s.melody(s.part(73, 5, 70, 40, 60), [[(8, 4, 8), (24, 2, 8)], [(0, 7, 8), (16, 6, 16)]], 79, 54)  # flute, high and light
    s.drums(s.part(0, 9, 80, 64, 50), {36: 'x.......x.....o.', 38: '........o.......', 51: 'o...o...o...o...'}, v=82)
    return s


def przygoda_walka():
    s = Song('przygoda-walka', 140, 'D', 'minor', ['Dm', 'C', 'Bb', 'A', 'Dm', 'C', 'Bb', 'A', 'Gm', 'Dm', 'A', 'Dm', 'Gm', 'Bb', 'A', 'A'], 22)
    s.bass(s.part(49, 0, 95, 50, 50), [(i / 2, w, 0.4) for i, w in enumerate('R5858R85')], 50, 74)   # staccato strings ostinato
    s.stabs(s.part(61, 1, 90, 78, 55), [(0, 0.6), (1.5, 0.4), (2.5, 0.4)], 62, 74)                   # brass stabs
    s.bass(s.part(58, 2, 100, 64, 40), [(0, 'R', 0.9), (1, 'R', 0.9), (2, '5', 0.9), (3, 'R', 0.9)], 36, 84)   # tuba
    s.bass(s.part(116, 3, 105, 64, 40), [(0, 'R', 0.5), (1.5, 'R', 0.5), (2, 'R', 0.5), (3, 'R', 0.3), (3.5, 'R', 0.3)], 36, 100)   # taiko
    s.melody(s.part(56, 4, 105, 64, 55), [
        [(0, 0, 3), (3, 0, 1), (4, 2, 4), (8, 4, 4), (12, 3, 2), (14, 2, 2), (16, 1, 4), (20, 0, 4), (24, -1, 8)],
        [(0, 4, 2), (2, 4, 2), (4, 5, 4), (8, 7, 6), (14, 6, 2), (16, 5, 4), (20, 4, 4), (24, 2, 8)]], 72, 92)   # trumpet
    s.drums(s.part(0, 9, 90, 64, 45), {36: 'x.....x.x.......', 38: '....x.......x...', 42: 'o.o.o.o.o.o.o.o.'}, v=88)
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


SONGS = [wesola_bieg, wesola_walka, przygoda_bieg, przygoda_walka, chill_bieg, chill_walka, elektro_bieg, elektro_walka]


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        sys.exit(f'{cmd[0]} failed: {r.stderr[-800:]}')
    return r


def render(song):
    """MIDI -> FluidSynth -> one seamless loop -> .mp3. Returns (file, loop start, loop end in seconds)."""
    import numpy as np
    os.makedirs(TMP, exist_ok=True)
    mid, wav, loop = (os.path.join(TMP, song.name + ext) for ext in ('.mid', '.wav', '.loop.wav'))
    song.midi().save(mid)
    run(['fluidsynth', '-ni', '-g', '0.5', '-r', str(SR), '-F', wav, SF2, mid])
    raw = run_bytes(['ffmpeg', '-v', 'error', '-i', wav, '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'])
    a = np.frombuffer(raw, dtype='<f4').reshape(-1, 2)
    n = round(song.loop_seconds() * SR)
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
