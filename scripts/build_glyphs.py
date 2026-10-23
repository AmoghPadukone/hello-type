"""Builds src/core/glyphs/glyph-data.json: a lowercase cursive alphabet cut out of Apple's "hello" strokes.

Run with `npm run glyphs` (or `python3 scripts/build_glyphs.py`) after editing a glyph, then `npm test`.

How it works:

1. Each source word (data/source/hello-<lang>.json) is a list of pen strokes, and each stroke is
   a chain of cubic Béziers over points [x, y, z, r]. z is the depth Apple's 3D "hello" sweeps
   through (upstrokes behind, downstrokes in front, so loops pass each other); r is the tube radius.
2. Every letter is cut out at baseline minima, where the pen bottoms out with a horizontal
   tangent. All glyphs therefore start and end the same way and chain by translation alone.
   Letters the words don't contain are assembled from pieces of the ones that do, plus a few
   hand-drawn segments whose tangents match where they meet.
3. Every glyph is remapped in y to shared metrics: one x-height, ascender and descender.
4. Coordinates are rounded to 0.1 and written out for src/core/glyphs/compose.ts.

The file reads top to bottom in that order: geometry helpers, the Glyph record, shared pieces,
the alphabet (one `G['x'] = glyph(...)` entry per letter), shared metrics, output.
"""
from __future__ import annotations

import json
import sys
from collections.abc import Callable, Sequence
from dataclasses import asdict, dataclass, replace
from functools import lru_cache
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE_DIR = ROOT / 'data' / 'source'
DEST = ROOT / 'src' / 'core' / 'glyphs' / 'glyph-data.json'

Point = list[float]  # [x, y, z, r]
Segment = list[Point]  # cubic Bézier: start, control, control, end
Stroke = list[Segment]  # one continuous pen stroke

RADIUS = 30.0  # Apple's tube radius (stroke width 60)


# Geometry -------------------------------------------------------------------------------------


@lru_cache(maxsize=None)
def _source(lang: str) -> list:
    with open(SOURCE_DIR / f'hello-{lang}.json') as f:
        return json.load(f)['strokes']


def ref(lang: str, stroke: int, first: int, last: int | None = None) -> Stroke:
    """Segments first..last (inclusive) of a source stroke, as fresh lists.

    ref('tr', 6, 9, 10) is segments 9-10 of stroke 6 of the Turkish word ("merhaba")."""
    last = first if last is None else last
    return [[list(seg[k][:4]) for k in ('p0', 'p1', 'p2', 'p3')]
            for seg in _source(lang)[stroke][first:last + 1]]


def start(segs: Stroke) -> Point:
    return segs[0][0]


def end(segs: Stroke) -> Point:
    return segs[-1][3]


def move(segs: Stroke, dx: float, dy: float = 0) -> Stroke:
    return [[[x + dx, y + dy, *zr] for x, y, *zr in seg] for seg in segs]


def at(segs: Stroke, point: Sequence[float]) -> Stroke:
    """Translates segs so they start at point (x/y only)."""
    x, y = start(segs)[:2]
    return move(segs, point[0] - x, point[1] - y)


def ending_at(segs: Stroke, point: Sequence[float]) -> Stroke:
    """Translates segs so they end at point (x/y only)."""
    x, y = end(segs)[:2]
    return move(segs, point[0] - x, point[1] - y)


def norm(dx: float, dy: float) -> float:
    return (dx * dx + dy * dy) ** 0.5


def direction(a: Sequence[float], b: Sequence[float]) -> tuple[float, float]:
    """Unit x/y vector from a to b."""
    dx, dy = b[0] - a[0], b[1] - a[1]
    n = norm(dx, dy) or 1.0
    return dx / n, dy / n


def entry_direction(segs: Stroke) -> tuple[float, float]:
    """The direction the pen sets off in at the start of segs."""
    return direction(start(segs), segs[0][1])


def exit_direction(segs: Stroke) -> tuple[float, float]:
    """The direction the pen is travelling at the end of segs."""
    return direction(segs[-1][2], end(segs))


def lerp_point(a: Point, b: Point, t: float) -> Point:
    return [a[k] + (b[k] - a[k]) * t for k in range(4)]


def bezier(seg: Segment, t: float) -> Point:
    u = 1 - t
    weights = (u ** 3, 3 * u * u * t, 3 * u * t * t, t ** 3)
    return [sum(w * p[k] for w, p in zip(weights, seg)) for k in range(4)]


def snap(a: Stroke, b: Stroke) -> Stroke:
    """Stroke b, moved to start exactly where stroke a ends.

    Position moves with the first control pair, so b leaves in the same direction; depth and
    radius are eased in over the first segment, so the 3D tube has no step."""
    d = [end(a)[k] - start(b)[k] for k in range(4)]
    pos_weights, zr_weights = (1, 1, 0, 0), (1, 2 / 3, 1 / 3, 0)
    first = [[x + d[0] * p, y + d[1] * p, z + d[2] * w, r + d[3] * w]
             for (x, y, z, r), p, w in zip(b[0], pos_weights, zr_weights)]
    return [first] + b[1:]


def chain(origin: Sequence[float], *offsets: tuple[float, float]) -> list[list[list[float]]]:
    """A hand-drawn cubic chain in x/y, given as offsets from origin: p0, (c1, c2, p3)*."""
    ox, oy = origin[:2]
    pts = [[ox + x, oy + y] for x, y in offsets]
    return [pts[i:i + 4] for i in range(0, len(pts) - 1, 3)]


def shade(segs2d: list, z0: float, z1: float | None = None, radius: float = RADIUS) -> Stroke:
    """Gives hand-drawn x/y segments a depth like Apple's.

    z follows the stroke direction (rising strokes behind, falling in front), then is bent
    linearly so it meets z0 at the start and z1 (default: the same offset as z0) at the end."""
    def depth(a, b):
        tx, ty = b[0] - a[0], b[1] - a[1]
        n = norm(tx, ty) or 1.0
        return 13 + 16 * tx / n - 41 * ty / n

    zs = [[depth(p0, p1 if p1 != p0 else p2), depth(p0, p2), depth(p1, p3), depth(p2 if p2 != p3 else p1, p3)]
          for p0, p1, p2, p3 in segs2d]
    for here, after in zip(zs, zs[1:]):  # one depth per shared point, even at a sharp turn
        here[3] = after[0] = (here[3] + after[0]) / 2
    lo = z0 - zs[0][0]
    hi = lo if z1 is None else z1 - zs[-1][3]
    count = len(segs2d) * 4 - 1 or 1
    return [[[x, y, zs[i][j] + lo + (hi - lo) * (i * 4 + j) / count, radius]
             for j, (x, y, *_) in enumerate(seg)]
            for i, seg in enumerate(segs2d)]


def level(segs2d: list, z0: float, z1: float, radius: float) -> Stroke:
    """Gives x/y segments a depth that runs straight from z0 to z1, with no up/down swing."""
    count = len(segs2d) * 4 - 1 or 1
    return [[[x, y, z0 + (z1 - z0) * (i * 4 + j) / count, radius] for j, (x, y, *_) in enumerate(seg)]
            for i, seg in enumerate(segs2d)]


def rel(origin: Point, *offsets: tuple[float, float], z0: float | None = None, z1: float | None = None) -> Stroke:
    """A hand-drawn, shaded cubic chain (see chain and shade). Depth starts at z0, by default the origin's."""
    return shade(chain(origin, *offsets), origin[2] if z0 is None else z0, z1)


def with_radius(segs: Stroke, radius: float) -> Stroke:
    return [[[x, y, z, radius] for x, y, z, _ in seg] for seg in segs]


# The glyph record -----------------------------------------------------------------------------


@dataclass
class Glyph:
    """One letter, entered at x = 0 (all coordinates y-up). Mirrors Glyph in src/core/glyphs/glyph.types.ts.

    Field order is the JSON key order; to_json renames fields to camelCase."""

    lead: list[Stroke]  # strokes that carry the pen in from the previous letter's baseline exit
    join: bool  # lead's last stroke flows straight into body[0]
    tail: bool  # lead is a detached tail stroke (bowl letters), dropped word-initially
    body: list[Stroke]  # the letter itself
    marks: list[Stroke]  # dots and crossbars, drawn once the word is finished
    exit: Point  # where the pen leaves the letter
    exit_type: str  # 'low' (baseline), 'high' (x-height: o b v w) or 'rise' (out of a descender)
    detached: bool  # exit is not the end of the last body stroke (next letter starts a new stroke)
    initial: list[Stroke] | None  # lead used instead when the letter starts a word
    # The remaining fields shape joins after a high exit (see docs/glyphs-and-composition.md).
    hi: float  # x nudge after a high exit
    # The last body segments form a rising tail that is dropped when the next letter is entered
    # low (o: Apple's tail climbs to x-height, which suits n m u i r but makes a hump before e).
    tail_segs: int
    # Share of the end of the real lead-in kept after a high exit (e keeps the rise that forms the
    # bottom of its eye, so it is always entered from below-left).
    hi_lead: float
    # Body drawn instead after a high exit (o uses Apple's own o from "bonjour", which is designed
    # to be entered from a b's high link).
    hi_body: list[Stroke] | None
    # Extra room after this letter's high exit before a variant join (v and w exit further left
    # than b's long link, so the o drawn for that join needs more room).
    exit_gap: float
    # After a high exit, enter the letter at the start of its body (r's knot, s's peak) in one
    # stroke, close to the previous letter, through its shortened link (link_cut).
    hi_tight: bool
    # Share of the high link kept before a hi_tight letter (b's link is drawn to reach into a
    # following bowl, as in "merhaba" and "bonjour", which leaves a long bare line before r s).
    link_cut: float
    # Extra room after this letter's high exit, whatever follows (o's link would otherwise set the
    # next letter close against its bowl, as in "og").
    exit_room: float

    def to_json(self) -> dict:
        return {camel_case(k): v for k, v in asdict(self).items()}


def camel_case(name: str) -> str:
    first, *rest = name.split('_')
    return first + ''.join(w.title() for w in rest)


def glyph(lead: list[Stroke], body: list[Stroke], *, join: bool, exit: Point | None = None,
          exit_type: str = 'low', marks: Sequence[Stroke] = (), tail: bool = False, detached: bool = False,
          initial: list[Stroke] | None = None, hi: float = 0, tail_segs: int = 0, hi_lead: float = 0,
          hi_body: list[Stroke] | None = None, exit_gap: float = 0, hi_tight: bool = False,
          link_cut: float = 0, exit_room: float = 0) -> Glyph:
    """A Glyph, shifted so the lead starts at x = 0. The exit defaults to the end of the body."""
    if join:  # lead and body come from different source strokes: close any rounding gap
        body = [snap(lead[-1], body[0])] + list(body[1:])
    entry_x = start(lead[0])[0]

    def shift(strokes):
        return [move(s, -entry_x) for s in strokes]

    exit = exit if exit is not None else end(body[-1])
    return Glyph(
        lead=shift(lead), join=join, tail=tail, body=shift(body), marks=shift(marks),
        exit=[exit[0] - entry_x, *exit[1:]], exit_type=exit_type, detached=detached,
        initial=shift(initial) if initial else None, hi=hi, tail_segs=tail_segs, hi_lead=hi_lead,
        hi_body=shift(hi_body) if hi_body else None, exit_gap=exit_gap, hi_tight=hi_tight, link_cut=link_cut,
        exit_room=exit_room,
    )


# Shared pieces --------------------------------------------------------------------------------

# Baseline → top of x-height, ending heading up (the lead of n m u i j p v w y).
RISE_TOP = ref('hr', 10, 3, 4)
# Baseline → mid-height tail stroke that bowl letters (a c d g q) start beside.
BOWL_TAIL = ref('tr', 4, 4)
BOWL_TAIL_TO_BOWL = 2806 - 2294.0  # tail start → bowl start in x, from "merhaba"
# The a-bowl from "merhaba" and its stem top.
BOWL = ref('tr', 5, 0, 4)
# From the top of x-height, down, loop left, rising exit (j's descender, also hung off f g y).
DESCENDER_LOOP = ref('fr', 4, 0, 3)
# h's rising loop from the baseline, and its stem back down (shared with k).
LOOP_LEAD = ref('tr', 3, 3)
LOOP_STEM = ref('tr', 3, 4, 7)
# l's lead-in and loop (shared with f).
L_LEAD = ref('en', 1, 9)
# u's two strokes from "bonjour" (shared with w y), and its right side rising to x-height.
U_FIRST = ref('fr', 5, 0, 4)
U_SECOND = ref('fr', 6, 0, 1)
U_RISE = ref('fr', 5, 3, 4)
# n's hump (shared with p).
N_HUMP = ref('hr', 12, 0, 3)
# b's closing curl from a baseline minimum, plus its horizontal link stroke.
B_CURL = ref('tr', 6, 9, 10)
B_LINK = ref('tr', 7, 0)
# "hello"'s lead-in stroke, used when h or k starts a word.
H_LEAD_IN = ref('en', 0, 0)
# Word-final flick from the baseline.
FLICK = ref('tr', 9, 3)


def rise_to(point: Point) -> Stroke:
    return ending_at(RISE_TOP, point)


def widened(segs: Stroke, dx: float) -> Stroke:
    """segs stretched in x about their start so their end moves dx further right."""
    x0, x1 = start(segs)[0], end(segs)[0]
    k = (x1 - x0 + dx) / (x1 - x0)
    return [[[x0 + (x - x0) * k, *rest] for x, *rest in seg] for seg in segs]


def lead_in_to(point: Point) -> Stroke:
    return ending_at(H_LEAD_IN, point)


def bowl_tail(bowl_start: Point) -> Stroke:
    return at(BOWL_TAIL, [bowl_start[0] - BOWL_TAIL_TO_BOWL, start(BOWL_TAIL)[1]])


def hang_descender(stroke: Stroke, loop: Stroke = DESCENDER_LOOP) -> Stroke:
    """The descender loop, continuing from the end of stroke."""
    return snap(stroke, at(loop, end(stroke)))


def stem_foot(stem: Stroke, arch: Stroke) -> Stroke:
    """Apple's hump starts a little above where the stem ends, so in 3D the stem's end was welded
    up off the baseline. A short straight piece carries the hump's start down to the stem's foot."""
    a, b = end(stem), start(arch)
    return [[a, lerp_point(a, b, 1 / 3), lerp_point(a, b, 2 / 3), b]] + arch


def bow_link(curl: Stroke) -> Stroke:
    """b/v/w's exit: Apple draws the curl and the link as two strokes with a gap, which shows
    as a knob in 3D. Instead the link continues from the curl's end, carrying on in the
    curl's direction and arcing over into Apple's link end, so the pen never lifts."""
    e = end(curl)
    ux, uy = exit_direction(curl)
    link_end = end(B_LINK)
    # Apple's offset from the end of its curl to the end of its link.
    tx = link_end[0] - start(B_LINK)[0] + (start(B_LINK)[0] - end(B_CURL)[0])
    ty = link_end[1] - start(B_LINK)[1] + (start(B_LINK)[1] - end(B_CURL)[1])
    to = [e[0] + tx, e[1] + ty, link_end[2], link_end[3]]
    return [[
        list(e),
        [e[0] + ux * 55, e[1] + uy * 55, e[2], e[3]],
        [to[0] - 190, to[1] + 12, (e[2] + to[2]) / 2, e[3]],
        to,
    ]]


VW_EXIT_GAP = 180  # from u's baseline minimum up its right side to x-height


def vw_finish(start_point: Point) -> Stroke:
    """v and w end the classic cursive way: the last upstroke rises to x-height, curls a small
    loop back over itself, and leaves to the right a little below the top (the high exit)."""
    rise = at(U_RISE, start_point)
    # Big enough that the loop stays open at stroke width 60; it leaves at about mid-height,
    # heading slightly down, so the next letter is joined by a flat, gliding stroke.
    loop = rel(end(rise),
               (0, 0), (9, 92), (-92, 106), (-70, 13),
               (-53, -57), (40, -100), (140, -115))
    return rise + snap(rise, loop)


def r_knot(lead: Stroke, stroke: Stroke) -> Stroke:
    """A tiny closed loop from the end of r's lead-in to the start of its stroke, leaving along the
    stroke's own tangent. It is small enough to fill in at stroke width 60, so it reads as a dot on
    top of the r. Its depth runs straight from one end to the other: an up/down swing would read as
    a twisted tube in 3D rather than a smooth bead."""
    a, b = end(lead), start(stroke)
    tx, ty = entry_direction(stroke)
    bx, by = b[0] - a[0], b[1] - a[1]
    loop = chain(a,
                 (0, 0), (6, 32), (-30, 42), (-32, 12),
                 (-33, -6), (bx - tx * 30, by - ty * 30), (bx, by))
    return level(loop, a[2], b[2], a[3])


def s_turn(curl: Stroke, exit_point: Point) -> Stroke:
    """Carries s's curl on round the bottom into its baseline exit. Apple lifts the pen after the
    curl and starts the exit stroke beside it, which shows as a loose cap in 3D.

    The turn is a rounded hook (up and over, then down into the exit) rather than a hairpin: a
    reversal tighter than the tube's radius folds the tube into a bulge in 3D."""
    e = end(curl)
    ux, uy = exit_direction(curl)
    top_x, top_y = e[0] + 44, e[1] + 46
    # Apple's curl ends in front (z 58, a downstroke) while the exit runs further back; the hook
    # eases between the two depths so it doesn't stand proud of the rest of the s.
    z, r = (e[2] + exit_point[2]) / 2, e[3]
    return [
        [list(e), [e[0] + ux * 30, e[1] + uy * 30, e[2], r], [top_x - 36, top_y, z, r], [top_x, top_y, z, r]],
        [[top_x, top_y, z, r], [top_x + 45, top_y, z, r], [exit_point[0] - 60, *exit_point[1:]], list(exit_point)],
    ]


def lead_into(body: Stroke) -> Stroke:
    """A hand-drawn lead from the baseline into x's hook. Its last control point lies along the
    hook's starting direction, so the two meet smoothly."""
    tx, ty = entry_direction(body)
    return rel(start(body), (-150, -300), (-80, -300), (-tx * 70, -ty * 70), (0, 0),
               z0=20, z1=start(body)[2])


# The alphabet ---------------------------------------------------------------------------------

G: dict[str, Glyph] = {}

# a — "merhaba": tail, bowl, stem down to the baseline.
G['a'] = glyph([BOWL_TAIL], [BOWL, ref('tr', 6, 0, 2)], join=False, tail=True, hi=-52)

# b — "merhaba": rising loop, stem, closing curl, link stroke (exits high).
b_body = ref('tr', 6, 4, 10)
G['b'] = glyph([ref('tr', 6, 3)], [b_body + bow_link(b_body)], join=True,
               exit_type='high', hi=150, link_cut=0.5)

# c — "cześć": bowl, cut at its baseline minimum.
c_bowl = ref('pl', 0, 0, 2)
G['c'] = glyph([bowl_tail(start(c_bowl))], [c_bowl], join=False, tail=True, hi=-52)

# d — "dobar": bowl rising to the ascender, stem back down.
d_bowl = ref('hr', 0, 0, 4)
G['d'] = glyph([bowl_tail(start(d_bowl))], [d_bowl, ref('hr', 1, 0, 2)], join=False,
               tail=True, hi=-52)

# e — "hello".
G['e'] = glyph([ref('en', 1, 4)], [ref('en', 1, 5, 8)], join=True, hi=-60)

# f — l's loop continued into the descender. The descender's depth is mirrored so the
# stem passes in front of f's rising lead-in and the loop returns behind it.
f_top = ref('en', 1, 10, 13)
f_loop = [[[x, y, 40 - z, r] for x, y, z, r in seg] for seg in DESCENDER_LOOP]
G['f'] = glyph([L_LEAD], [f_top + hang_descender(f_top, f_loop)], join=True, exit_type='rise', hi=200)

# g — a's bowl with the descender hung off its stem.
G['g'] = glyph([bowl_tail(start(BOWL))], [BOWL, hang_descender(BOWL)], join=False,
               tail=True, exit_type='rise', hi=-52)

# h — "merhaba": rising loop down to the baseline, then the hump.
G['h'] = glyph([LOOP_LEAD], [LOOP_STEM, stem_foot(LOOP_STEM, ref('tr', 4, 0, 3))], join=True, hi=200,
               initial=[lead_in_to(end(LOOP_LEAD))])

# i — "xin": rise, stem, dot.
G['i'] = glyph([ref('vi', 0, 4, 5)], [ref('vi', 2, 0, 2)], join=False, marks=[ref('vi', 5, 0)])

# j — "bonjour": rise, descender, dot.
G['j'] = glyph([rise_to(start(DESCENDER_LOOP))], [DESCENDER_LOOP], join=False, exit_type='rise',
               marks=[ref('fr', 8, 0)])

# k — h's loop, then a small hand-drawn loop and leg in place of the hump.
k_arch = ref('tr', 4, 0)
k_rest = rel(end(k_arch),
             (0, 0), (60, 2), (100, -40), (88, -95),
             (78, -145), (-20, -170), (-70, -150),
             (10, -160), (60, -230), (85, -310),
             (100, -360), (120, -376), (155, -376))
G['k'] = glyph([LOOP_LEAD], [LOOP_STEM, stem_foot(LOOP_STEM, k_arch + snap(k_arch, k_rest))],
               join=True, hi=200, initial=[lead_in_to(end(LOOP_LEAD))])

# l — "hello".
G['l'] = glyph([L_LEAD], [ref('en', 1, 10, 14)], join=True, hi=200)

# m — "merhaba": three separate strokes; the opening hook is used word-initially. Its rise is
# stretched so the m sits further from the letter before it than n does (its three humps read as
# crowded otherwise, as in "am").
M_ROOM = 60
m_body = [ref('tr', 0, 1, 2), ref('tr', 1, 0, 2), ref('tr', 2, 0, 3)]
m_rise = widened(RISE_TOP, M_ROOM)
G['m'] = glyph([ending_at(m_rise, start(m_body[0]))], m_body, join=False, initial=[ref('tr', 0, 0)])

# n — "dan".
n_stem = ref('hr', 11, 0)
G['n'] = glyph([RISE_TOP], [n_stem, N_HUMP], join=False)

# o — "hello". After a high exit (b o v w) the o is Apple's o from "bonjour" (entered at its
# top-left, as Apple joins b → o), aligned so its bowl sits where hello's o bowl does.
G['o'] = glyph([ref('en', 1, 21)], [ref('en', 1, 22, 28)], join=True, exit_type='high', hi=0, tail_segs=1, exit_room=50,
               hi_body=[move(ref('fr', 1, 1, 7), 2052 - 788)])

# p — stem through the descender, then n's hump.
p_top = start(n_stem)
p_stem = rel(p_top, (0, 0), (-12, -230), (-30, -500), (-40, -700))
G['p'] = glyph([rise_to(p_top)], [p_stem, N_HUMP], join=False)

# q — bowl, stem down, a rounded turn at the bottom, then a tail flicking up to the right
# (hand-drawn; tangents match at every joint so the tube stays smooth).
q_desc = rel(end(BOWL),
             (0, 0), (-10, -260), (-25, -520), (-25, -640),
             (-25, -715), (40, -740), (75, -680),
             (117, -608), (150, -520), (200, -460))
G['q'] = glyph([bowl_tail(start(BOWL))], [BOWL, q_desc], join=False, tail=True, exit_type='rise', hi=-52)

# r — Apple's r from "merhaba" (rising lead-in, then the r stroke), with a tiny closed knot at
# the peak joining the two. After a high exit (b o v w) the r keeps the top of its lead-in, so the
# link drops and climbs into the same knot as after a baseline exit (ar, cr) instead of running
# flat into it.
r_lead = ref('tr', 2, 9)
r_stroke = ref('tr', 3, 0, 2)
r_top = r_knot(r_lead, r_stroke)
G['r'] = glyph([r_lead], [r_top + snap(r_top, r_stroke)], join=True, hi=300, hi_tight=True, hi_lead=0.25)

# s — "cześć": rise, the s curl, then a hook into the baseline exit. Apple's curl is a touch thinner
# than the lead-in (26-28 vs 30); in 3D that reads as the pipe narrowing where it meets the rest of
# the s, so the whole letter is drawn at one radius.
s_curl = ref('pl', 3, 0, 2)
s_body = with_radius(s_curl + s_turn(s_curl, start(ref('pl', 4, 0))), 30)
G['s'] = glyph([with_radius(ref('pl', 2, 9), 30)], [s_body], join=False, hi=150, hi_tight=True, exit_gap=230)

# t — "salut": u's tail, stem, crossbar.
G['t'] = glyph([ref('ro', 6, 2)], [ref('ro', 7, 0, 1)], join=False, marks=[ref('ro', 8, 0)], hi=150)

# u — "bonjour".
G['u'] = glyph([rise_to(start(U_FIRST))], [U_FIRST, U_SECOND], join=False)

# v — down, round the bottom, up into the hook (vw_finish).
v_down = ref('fr', 5, 0, 2)
G['v'] = glyph([rise_to(start(v_down))], [v_down + vw_finish(end(v_down))],
               join=False, exit_type='high', exit_gap=VW_EXIT_GAP)

# w — u's two strokes, then up into the hook (vw_finish).
G['w'] = glyph([rise_to(start(U_FIRST))], [U_FIRST, U_SECOND + vw_finish(end(U_SECOND))],
               join=False, exit_type='high', exit_gap=VW_EXIT_GAP)

# x — "xin": hooked stroke, with the crossing stroke as a mark; hand-drawn lead into the hook.
x_body = ref('vi', 0, 0, 3)
G['x'] = glyph([lead_into(x_body)], [x_body], join=True, marks=[ref('vi', 1, 0)], hi=120)

# y — u's first stroke, then the descender.
G['y'] = glyph([rise_to(start(U_FIRST))], [U_FIRST, hang_descender(U_FIRST)], join=False, exit_type='rise')

# z — "cześć": c's tail rising into the z.
z_top = ref('pl', 1, 0)
G['z'] = glyph([ref('pl', 0, 3)], [z_top + snap(z_top, ref('pl', 2, 0, 3))], join=True, hi=150)


# Shared metrics -------------------------------------------------------------------------------
#
# Apple's words are hand-tuned per word, so the same letter height drifts between source
# strokes (b 750, d 695, v 455, q −333 …). Every glyph is snapped to shared metrics, like a
# typeface: one x-height, one ascender, one descender. The maps are piecewise linear in y and
# fix the baseline, so joins at y = 0 are untouched.

X_HEIGHT, ASCENDER, DESCENDER = 380.0, 737.0, -320.0
TALL = 'bdfhkl'
# t is a short ascender, but Apple's own (540) looks stunted beside l at 737, so only the
# part above the crossbar is stretched; the crossbar stays at x-height.
T_TOP = 700.0
# Bowl top inside tall glyphs that have one, so it stays at x-height while the stem moves.
BOWL_TOP = {'b': 382.0, 'd': 390.0}


def y_extent(strokes: list[Stroke]) -> tuple[float, float]:
    """Lowest and highest y along the curves (not the control points), baseline included."""
    ys = [bezier(seg, i / 40)[1] for s in strokes for seg in s for i in range(41)]
    return min(0.0, *ys), max(0.0, *ys)


def height_map(ch: str, g: Glyph) -> Callable[[float], float]:
    """A piecewise-linear map of y that moves this glyph's extremes onto the shared metrics."""
    lo, hi = y_extent(g.body)
    knots = []  # (from, to), ascending
    if lo < -200:
        knots.append((lo, DESCENDER))
    knots.append((0.0, 0.0))
    if ch == 't':
        knots += [(X_HEIGHT, X_HEIGHT), (hi, T_TOP)]
    elif ch in TALL:
        if ch in BOWL_TOP:
            knots.append((BOWL_TOP[ch], X_HEIGHT if ch == 'd' else BOWL_TOP[ch]))
        knots.append((hi, ASCENDER))
    else:
        knots.append((hi, X_HEIGHT))
    pieces = list(zip(knots, knots[1:]))

    def f(y):
        for (a0, b0), (a1, b1) in pieces:
            if y <= a1:
                return b0 + (y - a0) * (b1 - b0) / (a1 - a0)
        # Control points can overshoot the curve's extent: past the last knot, the last piece carries on.
        (a0, b0), (a1, b1) = pieces[-1]
        return b1 + (y - a1) * (b1 - b0) / (a1 - a0)
    return f


def normalised(ch: str, g: Glyph) -> Glyph:
    f = height_map(ch, g)

    def strokes(ss):
        return None if ss is None else [[[[x, f(y), z, r] for x, y, z, r in seg] for seg in s] for s in ss]

    x, y, *zr = g.exit
    return replace(
        g, lead=strokes(g.lead), body=strokes(g.body), initial=strokes(g.initial), hi_body=strokes(g.hi_body),
        exit=[x, f(y), *zr],
        marks=g.marks if ch in 'ij' else strokes(g.marks),  # dots keep their height
    )


# Output ---------------------------------------------------------------------------------------


def rounded(o):
    """o with every float rounded to 0.1, at any depth."""
    if isinstance(o, float):
        return round(o, 1)
    if isinstance(o, list):
        return [rounded(v) for v in o]
    if isinstance(o, dict):
        return {k: rounded(v) for k, v in o.items()}
    return o


def main() -> None:
    out = {
        '_comment': 'Generated by scripts/build_glyphs.py from the SF-Hello stroke data. Do not edit.',
        'glyphs': {ch: rounded(normalised(ch, g).to_json()) for ch, g in sorted(G.items())},
        'flick': rounded(at(FLICK, (0, 0))),
    }
    with open(DEST, 'w') as f:
        json.dump(out, f, separators=(',', ':'))
        f.write('\n')
    print(f'wrote {len(G)} glyphs to {DEST.relative_to(ROOT)}', file=sys.stderr)


if __name__ == '__main__':
    main()
