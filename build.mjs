import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "./source/kit/iso-kit.mjs";
import * as G from "./source/kit/lathe.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "public");
mkdirSync(join(OUT, "assets"), { recursive: true });

const W = 760;
const H = 520;
const BASE = { x: -150, y: -92, w: 300, d: 184, r: 14 };
const P = k.fitProjection(
  [...k.boxCorners(BASE, -18, 104), [-170, -110, 0], [170, 110, 0]],
  W,
  H,
  { pad: 36, azimuth: 44 },
);
const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (paths, style) => k.lineSvg(paths, style);
const D = (points, style) => k.dotsSvg(points, style);
const group = (name, move, body) => `<g data-organ="${name}" data-move="${move.join(",")}">${body}</g>`;
const depth = (points) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));

function base() {
  const out = [`<path class="iso-halo" d="${k.haloOf(BASE, -18, 16, P)}"/>`];
  for (const [x, y] of depth(k.corners(BASE, 24))) {
    out.push(S(k.cylinder(x, y, 8, -18, 3, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.8, -15, 5, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(BASE, -10, 10, P, 10, 1.8), { tone: "mid" }));
  out.push(S(k.slabOf(k.insetPlan(BASE, 7), 0, 5, P, 10, 1.1), { tone: "lo" }));
  out.push(L(k.planOutline(k.insetPlan(BASE, 12), 5, P), { tone: "faint" }));
  const screws = [...k.corners(BASE, 15), [-106, 0], [106, 0]];
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.5, 5, P, 18)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 5])), { size: 0.55 }));
  const strip = { x: -118, y: 71, w: 236, d: 8, r: 1.5 };
  out.push(S(k.slabOf(strip, 5, 0.8, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(-112, 112, 4, 5, 72, 5.8, [2, 4], P);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  return out.join("");
}

function brain() {
  const out = [];
  out.push(S(k.cylinder(0, 0, 45, 5, 8, P, 72, 1), { tone: "mid" }));
  out.push(S(k.cylinder(0, 0, 38, 13, 8, P, 72, 0.8), { tone: "hi" }));
  out.push(L(k.knurl(0, 0, 38, 13, 21, 72, P, 0.4), { tone: "lo" }));
  out.push(S(k.cylinder(0, 0, 28, 21, 13, P, 64, 0.8), { tone: "mid" }));
  out.push(L(k.ring(0, 0, 22, 34, P, 64), { tone: "hi" }));
  const ticks = k.radialTicks(0, 0, 25, 24, 3, 34.2, [2.2, 5], P);
  out.push(`<g data-rotor>${L(ticks.minor, { tone: "lo" })}${L(ticks.major, { tone: "hi" })}</g>`);
  for (const [x, y] of [[-23,-23],[23,-23],[-23,23],[23,23]]) {
    out.push(L(k.ring(x, y, 2.2, 21, P, 16), { tone: "lo" }));
    out.push(D([at([x, y, 21])], { size: 0.55 }));
  }
  out.push(S(k.cylinder(0, 0, 7, 34, 9, P, 32), { tone: "hi", lit: true }));
  out.push(L(k.sideArc(0, 0, 7, 39, P, 24), { tone: "hi" }));
  return group("brain", [0, -34], out.join(""));
}

function eyes() {
  const out = [];
  for (const x of [-88, -58]) {
    out.push(S(k.cylinder(x, -42, 8, 5, 5, P, 28), { tone: "mid" }));
    out.push(S(k.cylinder(x, -42, 4, 10, 25, P, 24), { tone: "mid", crease: "none" }));
    out.push(S(k.slabOf({ x: x - 11, y: -51, w: 22, d: 18, r: 4 }, 34, 15, P, 6, 1), { tone: "hi" }));
    out.push(S(k.cylinder(x, -33, 6.5, 39, 8, P, 28), { tone: "hi" }));
    out.push(L(k.ring(x, -33, 4.2, 47, P, 28), { tone: "hi" }));
    out.push(D([at([x, -33, 47])], { size: 1.25, tone: "hi", pulse: true }));
  }
  out.push(S(k.slabOf({ x: -99, y: -48, w: 52, d: 6, r: 2 }, 27, 5, P, 4), { tone: "mid" }));
  return group("eyes", [-34, -18], out.join(""));
}

function memory() {
  const out = [];
  const box = { x: -126, y: 16, w: 48, d: 52, r: 5 };
  out.push(S(k.slabOf(box, 5, 61, P, 7, 1), { tone: "mid" }));
  for (let i = 0; i < 6; i++) {
    const z = 10 + i * 8.5;
    const drawer = { x: -123, y: 64, w: 42, d: 4, r: 1 };
    out.push(S(k.slabOf(drawer, z, 6.5, P, 3, 0.4), { tone: i === 4 ? "hi" : "mid", lit: i === 4 }));
    out.push(S(k.cylinder(-102, 69, 1.8, z + 1, 4, P, 16), { tone: "hi" }));
    out.push(D([at([-118, 68, z + 4.2])], { size: 0.55, tone: i === 4 ? "hi" : "lo", pulse: i === 4 }));
  }
  out.push(S(k.slabOf({ x: -123, y: 19, w: 42, d: 46, r: 3 }, 66, 3, P, 5), { tone: "hi" }));
  return group("memory", [-38, 20], out.join(""));
}

function hands() {
  const out = [];
  for (const y of [27, 52]) {
    out.push(S(k.slabOf({ x: 52, y, w: 88, d: 5, r: 1 }, 5, 4, P, 3), { tone: "mid" }));
    out.push(D([at([59, y + 2.5, 9]), at([133, y + 2.5, 9])], { size: 0.5 }));
  }
  for (const x of [47, 140]) out.push(S(k.slabOf({ x, y: 23, w: 5, d: 38, r: 1 }, 5, 9, P, 3), { tone: "mid" }));
  out.push(S(k.slabOf({ x: 76, y: 23, w: 38, d: 40, r: 4 }, 9, 8, P, 5, 0.8), { tone: "hi" }));
  out.push(S(k.cylinder(95, 43, 9, 17, 6, P, 28), { tone: "mid" }));
  out.push(S(k.slabOf({ x: 91, y: 37, w: 47, d: 12, r: 4 }, 23, 9, P, 5, 0.7), { tone: "hi" }));
  out.push(S(k.cylinder(138, 43, 7, 25, 8, P, 28), { tone: "mid" }));
  out.push(S(k.slabOf({ x: 134, y: 39, w: 24, d: 8, r: 3 }, 33, 7, P, 4), { tone: "hi", lit: true }));
  out.push(S(k.cylinder(158, 43, 4.5, 35, 9, P, 24), { tone: "hi", lit: true }));
  return group("hands", [38, 18], out.join(""));
}

function immune() {
  const out = [];
  out.push(S(k.slabOf({ x: 64, y: -76, w: 60, d: 42, r: 7 }, 5, 35, P, 7, 1), { tone: "mid" }));
  out.push(S(k.cylinder(94, -55, 18, 40, 8, P, 48, 0.8), { tone: "hi" }));
  out.push(L(k.knurl(94, -55, 18, 43, 48, 48, P, 0.35), { tone: "lo" }));
  out.push(S(k.cylinder(94, -55, 12, 48, 5, P, 40), { tone: "mid" }));
  out.push(L(k.ring(94, -55, 7, 53, P, 32), { tone: "hi" }));
  out.push(L(k.lineOnTop([94, -61], [94, -52], 53.2, P), { tone: "hi" }));
  for (const [x, y] of [[71,-69],[117,-69],[71,-41],[117,-41]]) out.push(D([at([x, y, 40])], { size: 0.65 }));
  out.push(D([at([119, -37, 40])], { size: 1.1, tone: "hi", pulse: true }));
  return group("immune", [34, -24], out.join(""));
}

function heartbeat() {
  const out = [];
  const x = 55, y = -2, z = 46, r = 15;
  out.push(S(k.slabOf({ x: 42, y: -9, w: 26, d: 18, r: 4 }, 5, 36, P, 5), { tone: "mid" }));
  out.push(S(k.cylinder(x, y, r, z, 8, P, 48), { tone: "hi" }));
  out.push(L(k.ring(x, y, r - 2.2, z + 8, P, 48), { tone: "lo" }));
  const ticks = k.radialTicks(x, y, r - 3, 30, 5, z + 8.2, [1, 2.4], P);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  out.push(`<path data-heart-needle class="iso-line" data-tone="lit" data-free="both" d="${k.lineOnTop([x, y + 2], [x + 9, y - 3], z + 8.4, P)}"/>`);
  out.push(L(k.ring(x, y, 1.6, z + 8.5, P, 18), { tone: "hi" }));
  return group("heart", [20, -10], out.join(""));
}

function harness() {
  const routes = [
    [[-58,-32,23],[-37,-24,16],[-28,-12,14]],
    [[28,-12,14],[48,-30,15],[68,-42,18]],
    [[35,14,15],[58,23,14],[77,32,14]],
    [[-30,20,15],[-55,35,14],[-79,44,16]],
    [[22,29,13],[37,12,15],[43,2,28]],
    [[-78,25,18],[-48,12,14],[-35,7,15]],
  ];
  return routes.map((route, i) => {
    const points = route.map(at);
    const d = points.map((p, index) => `${index ? "L" : "M"}${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(" ");
    const dots = D([points[0], points.at(-1)], { size: 0.65, tone: "mid" });
    return `<g class="harness" data-route="${i}">${L(d, { tone: "lo" })}${dots}</g>`;
  }).join("");
}

const taskRouteWorld = [[-72,-33,48],[-38,-20,30],[0,0,43],[57,-25,54],[92,-54,54],[116,40,42],[-99,67,54]];
const taskRoute = taskRouteWorld.map(at);
const taskPath = taskRoute.map((p, index) => `${index ? "L" : "M"}${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(" ");

function headStand() {
  const out = [`<path class="iso-halo" d="${k.haloOf(BASE, -18, 15, P)}"/>`];
  for (const [x, y] of depth(k.corners(BASE, 20))) {
    out.push(S(k.cylinder(x, y, 7, -18, 3, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5, -15, 5, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(BASE, -10, 10, P, 10, 1.6), { tone: "mid" }));
  out.push(S(k.slabOf(k.insetPlan(BASE, 6), 0, 4, P, 9, 1), { tone: "lo" }));
  out.push(L(k.planOutline(k.insetPlan(BASE, 12), 4, P), { tone: "faint" }));
  const screws = k.corners(BASE, 13);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 4, P, 18)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 4])), { size: 0.55 }));
  const strip = { x: -80, y: 52, w: 160, d: 7, r: 1 };
  out.push(S(k.slabOf(strip, 4, 0.7, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(-76, 76, 4, 5, 53, 4.7, [1.8, 3.5], P);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  return out.join("");
}

function headNeck() {
  const out = [];
  out.push(S(k.cylinder(0, 0, 28, 4, 7, P, 56, 0.8), { tone: "mid" }));
  out.push(L(k.knurl(0, 0, 28, 4, 11, 64, P, 0.35), { tone: "lo" }));
  out.push(S(k.cylinder(0, 0, 19, 11, 25, P, 48, 0.6), { tone: "hi" }));
  out.push(L([18, 28].map((z) => k.sideArc(0, 0, 19, z, P, 28)).join(""), { tone: "faint" }));
  out.push(S(k.cylinder(0, 0, 24, 36, 7, P, 52, 0.7), { tone: "mid" }));
  for (const a of [0, 90, 180, 270]) {
    const rad = a * Math.PI / 180;
    out.push(D([at([Math.cos(rad) * 18, Math.sin(rad) * 18, 43])], { size: 0.55 }));
  }
  return group("heart", [0, 26], out.join(""));
}

function headShell() {
  const out = [];
  out.push(S(k.slabOf({ x: -57, y: -40, w: 114, d: 79, r: 15 }, 43, 67, P, 12, 1.7), { tone: "mid" }));
  out.push(L(k.sideSeam({ x: -57, y: -40, w: 114, d: 79, r: 15 }, 72, P, 12), { tone: "faint" }));
  out.push(S(k.slabOf({ x: -49, y: -34, w: 98, d: 68, r: 18 }, 110, 15, P, 12, 1.4), { tone: "hi" }));
  out.push(S(k.slabOf({ x: -39, y: -26, w: 78, d: 53, r: 16 }, 125, 8, P, 10, 1), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan({ x: -39, y: -26, w: 78, d: 53, r: 16 }, 4), 133, P), { tone: "faint" }));
  const crown = k.radialTicks(0, 0, 26, 32, 4, 133.2, [1.3, 3.4], P);
  out.push(`<g data-rotor>${L(crown.minor, { tone: "lo" })}${L(crown.major, { tone: "hi" })}</g>`);
  out.push(S(k.cylinder(0, 0, 9, 133, 8, P, 36), { tone: "hi", lit: true }));
  for (const [x, y] of [[-44,-27],[44,-27],[-44,26],[44,26]]) {
    out.push(L(k.ring(x, y, 2.2, 110, P, 16), { tone: "lo" }));
    out.push(D([at([x, y, 110])], { size: 0.5 }));
  }
  return group("brain", [0, -34], out.join(""));
}

function headFace() {
  const out = [];
  const mask = { x: -46, y: 34, w: 82, d: 8, r: 10 };
  out.push(S(k.slabOf(mask, 58, 47, P, 9, 1), { tone: "hi" }));
  out.push(L(k.sideSeam(mask, 72, P, 9), { tone: "faint" }));
  out.push(S(k.slabOf({ x: -38, y: 40, w: 66, d: 4, r: 8 }, 65, 31, P, 8, 0.7), { tone: "lo" }));
  for (const x of [-23, 11]) {
    out.push(S(k.slabOf({ x, y: 43, w: 9, d: 4, r: 4 }, 71, 18, P, 6, 0.6), { tone: "hi", lit: true }));
    out.push(D([at([x + 4.5, 47, 80])], { size: 1.15, tone: "hi", pulse: true }));
  }
  out.push(S(k.slabOf({ x: -31, y: 37, w: 52, d: 7, r: 5 }, 51, 8, P, 6, 0.6), { tone: "mid" }));
  out.push(L(k.lineOnTop([-23, 39], [13, 39], 59.2, P), { tone: "faint" }));
  return group("eyes", [-32, 4], out.join(""));
}

function headEar() {
  const out = [];
  out.push(S(k.slabOf({ x: 46, y: -31, w: 24, d: 61, r: 10 }, 55, 58, P, 9, 1.2), { tone: "hi", lit: true }));
  const F = G.frameAlong([62, 0, 84], [1, 0, 0]);
  out.push(S(G.disc(0, 8, 27, F, P, { steps: 64, bevel: 1 }), { tone: "mid" }));
  out.push(S(G.disc(8, 13, 22, F, P, { steps: 56, bevel: 0.8 }), { tone: "hi" }));
  out.push(L(G.circleOf(F, 13, 14, P, 48), { tone: "lo" }));
  out.push(L(G.circleOf(F, 13.2, 5, P, 32), { tone: "hi" }));
  const boltPoints = G.dotsOf(F, 13.2, 18, 8, P, { all: true });
  out.push(D(boltPoints, { size: 0.5, tone: "mid" }));
  return group("immune", [35, -8], out.join(""));
}

function headMemory() {
  const out = [];
  out.push(S(k.slabOf({ x: -68, y: -28, w: 16, d: 51, r: 5 }, 56, 52, P, 7, 0.8), { tone: "mid" }));
  for (let i = 0; i < 6; i++) {
    const z = 61 + i * 7.4;
    out.push(S(k.slabOf({ x: -71, y: 12, w: 19, d: 8, r: 2 }, z, 5.5, P, 4, 0.4), { tone: i === 4 ? "hi" : "mid", lit: i === 4 }));
    out.push(D([at([-61, 21, z + 3])], { size: 0.5, tone: i === 4 ? "hi" : "lo", pulse: i === 4 }));
  }
  out.push(S(k.slabOf({ x: -70, y: -25, w: 18, d: 45, r: 4 }, 108, 5, P, 5), { tone: "hi" }));
  return group("memory", [-38, -6], out.join(""));
}

function headJaw() {
  const out = [];
  out.push(S(k.slabOf({ x: -33, y: 25, w: 61, d: 27, r: 7 }, 40, 15, P, 7, 0.8), { tone: "mid" }));
  out.push(S(k.slabOf({ x: -22, y: 42, w: 40, d: 16, r: 5 }, 35, 10, P, 6, 0.7), { tone: "hi" }));
  out.push(S(k.slabOf({ x: -17, y: 52, w: 30, d: 9, r: 4 }, 37, 7, P, 5, 0.5), { tone: "hi", lit: true }));
  for (const x of [-12,-4,4]) out.push(D([at([x, 61, 40.5])], { size: 0.55, tone: "hi" }));
  out.push(S(k.cylinder(31, 38, 4.5, 44, 8, P, 24), { tone: "mid" }));
  out.push(S(k.cylinder(-36, 38, 4.5, 44, 8, P, 24), { tone: "mid" }));
  return group("hands", [0, 34], out.join(""));
}

function headHarness() {
  const routes = [
    [[-52,-8,92],[-30,-2,105],[-12,0,124]],
    [[48,-8,92],[27,-2,108],[12,0,124]],
    [[-47,20,76],[-25,12,61],[-12,3,45]],
    [[45,18,77],[25,10,62],[12,3,45]],
  ];
  return routes.map((route, i) => {
    const points = route.map(at);
    const d = points.map((p, index) => `${index ? "L" : "M"}${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(" ");
    return `<g class="harness" data-route="${i}">${L(d, { tone: "lo" })}${D([points[0], points.at(-1)], { size: 0.6, tone: "mid" })}</g>`;
  }).join("");
}

const headTaskWorld = [[-18,44,80],[-2,15,111],[0,0,140],[43,-2,93],[61,0,85],[4,49,43],[-60,20,93]];
const headTaskRoute = headTaskWorld.map(at);
const headTaskPath = headTaskRoute.map((p, index) => `${index ? "L" : "M"}${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(" ");

const heroSvg = k.figureSvg({
  width: W,
  height: H,
  label: "An isometric Agent Cognition Engine. Six physical assemblies perceive a mission, plan a route, authorize it, execute a tool call, verify the result and archive the successful route as a reusable reflex.",
  body: [
    base(),
    harness(),
    eyes(),
    memory(),
    brain(),
    immune(),
    hands(),
    heartbeat(),
    `<path class="task-track" d="${taskPath}"/>`,
    `<circle data-task-orb class="task-orb" cx="${taskRoute[0][0]}" cy="${taskRoute[0][1]}" r="4.2"/>`,
  ],
});

function miniFigure(kind) {
  const width = 250, height = 170;
  const plate = { x: -62, y: -38, w: 124, d: 76, r: 7 };
  const proj = k.fitProjection([...k.boxCorners(plate, -8, 65)], width, height, { pad: 20, azimuth: 45 });
  const s = (paths, style) => k.solidSvg(paths, style);
  const l = (paths, style) => k.lineSvg(paths, style);
  const dot = (pts, style) => k.dotsSvg(pts.map((p) => k.iso(p, proj)), style);
  const body = [s(k.slabOf(plate, -6, 8, proj, 7, 1), { tone: "mid" }), l(k.planOutline(k.insetPlan(plate, 5), 2, proj), { tone: "faint" })];
  if (kind === "reflex") {
    body.push(s(k.cylinder(0, 0, 25, 2, 8, proj, 48), { tone: "mid" }));
    body.push(s(k.cylinder(0, 0, 17, 10, 8, proj, 40), { tone: "hi", lit: true }));
    body.push(l(k.radialTicks(0, 0, 21, 18, 3, 18.2, [2, 4], proj).major, { tone: "hi" }));
    body.push(s(k.slabOf({ x: 18, y: -5, w: 37, d: 10, r: 3 }, 6, 9, proj, 4), { tone: "hi" }));
  } else if (kind === "memory") {
    body.push(s(k.slabOf({ x: -30, y: -23, w: 60, d: 46, r: 5 }, 2, 48, proj, 6, 1), { tone: "mid" }));
    for (let i = 0; i < 5; i++) {
      body.push(s(k.slabOf({ x: -27, y: 20, w: 54, d: 3, r: 1 }, 7 + i * 8, 6, proj, 3), { tone: i === 3 ? "hi" : "mid", lit: i === 3 }));
      body.push(dot([[0,24,10 + i * 8]], { size: 0.55 }));
    }
  } else {
    body.push(s(k.slabOf({ x: -30, y: -24, w: 60, d: 48, r: 6 }, 2, 34, proj, 6, 1), { tone: "mid" }));
    body.push(s(k.cylinder(0, 0, 18, 36, 8, proj, 48), { tone: "hi" }));
    body.push(s(k.cylinder(0, 0, 10, 44, 5, proj, 36), { tone: "mid" }));
    body.push(l(k.ring(0, 0, 5, 49, proj, 28), { tone: "hi" }));
    body.push(l(k.lineOnTop([0,-5],[0,2],49.2,proj), { tone: "hi" }));
  }
  return k.figureSvg({ width, height, label: `${kind} instrument`, body });
}

const organs = [
  ["eyes", "Eyes", "Perception", "Reads interfaces, documents and live environment state."],
  ["brain", "Brain", "Planning", "Turns an objective into a constrained route of actions."],
  ["immune", "Immune system", "Authorization", "Checks scopes, signatures and irreversible operations."],
  ["hands", "Hands", "Execution", "Operates tools and records the evidence returned by each call."],
  ["heart", "Heartbeat", "Verification", "Replays known routes and detects degradation before use."],
  ["memory", "Memory", "Reflexes", "Stores successful routes as reusable, versioned capabilities."],
];

const logoHero = `
<div class="logo-head" data-logo-head aria-hidden="true">
  <svg class="logo-core" viewBox="0 0 640 540" focusable="false">
    <g class="core-rings">
      <circle cx="320" cy="265" r="116" />
      <circle cx="320" cy="265" r="88" />
      <circle cx="320" cy="265" r="43" />
      <path d="M204 265H436M320 149V381M238 183L402 347M402 183L238 347" />
      ${Array.from({ length: 24 }, (_, i) => {
        const a = (i / 24) * Math.PI * 2;
        const x1 = 320 + Math.cos(a) * 121, y1 = 265 + Math.sin(a) * 121;
        const x2 = 320 + Math.cos(a) * (i % 3 ? 127 : 134), y2 = 265 + Math.sin(a) * (i % 3 ? 127 : 134);
        return `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}"/>`;
      }).join("")}
    </g>
    <g class="core-gears">
      <circle cx="251" cy="278" r="36"/><circle cx="251" cy="278" r="15"/>
      <circle cx="376" cy="235" r="48"/><circle cx="376" cy="235" r="18"/>
      <circle cx="365" cy="339" r="27"/><circle cx="365" cy="339" r="9"/>
      <path d="M278 265L329 244M350 278L360 313M286 300L341 330"/>
    </g>
    <path class="task-track" d="M244 254C270 240 284 225 309 214C347 198 393 211 411 246C430 284 402 316 366 331C337 344 310 364 291 395" />
    <circle data-task-orb class="task-orb" cx="244" cy="254" r="4.2"/>
  </svg>
  <img class="logo-base" src="./assets/resnomo-logo.png" alt="" />
  ${[
    ["brain", "18,-18", "brain-piece"],
    ["eyes", "-28,2", "eyes-piece"],
    ["immune", "34,-2", "immune-piece"],
    ["hands", "-4,28", "hands-piece"],
    ["heart", "12,36", "heart-piece"],
    ["memory", "-35,-10", "memory-piece"],
  ].map(([organ, move, cls]) => `<div class="logo-piece ${cls}" data-organ="${organ}" data-move="${move}"><img src="./assets/resnomo-logo.png" alt="" /></div>`).join("")}
  <svg class="logo-details" viewBox="0 0 640 540" focusable="false">
    <g class="detail-lines">
      <path d="M254 168H355"/><path d="M268 158V178M286 158V174M304 158V178M322 158V174M340 158V178"/>
      <path d="M428 219a72 72 0 1 1-1 0"/><path d="M428 236a55 55 0 1 1-1 0"/>
      <path d="M220 352H305M230 363H292"/><circle cx="215" cy="352" r="3"/><circle cx="310" cy="352" r="3"/>
    </g>
    <g class="logo-hotspots">
      <circle cx="272" cy="265" r="3"/><circle cx="319" cy="188" r="3"/><circle cx="462" cy="273" r="3"/>
    </g>
  </svg>
</div>`;

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="theme-color" content="#050505" />
  <meta name="description" content="Resnomo makes the anatomy of autonomous agents observable." />
  <title>Resnomo — Agent Anatomy Network</title>
  <link rel="icon" href="./assets/resnomo-logo.png" />
  <link rel="stylesheet" href="./styles.css" />
  <link rel="stylesheet" href="./refinement.css" />
  <style>${k.ISO_CSS}</style>
</head>
<body>
  <header class="mobile-head">
    <a class="brand" href="#top" aria-label="Resnomo home"><img src="./assets/resnomo-logo.png" alt="" /><span>Resnomo</span></a>
    <button class="menu" aria-expanded="false" aria-controls="site-nav">Menu</button>
  </header>
  <div class="layout" id="top">
    <aside class="rail">
      <a class="brand" href="#top"><img src="./assets/resnomo-logo.png" alt="Resnomo logo" /><span>Resnomo</span></a>
      <nav id="site-nav" aria-label="Primary navigation">
        <a class="active" href="#engine">Engine</a>
        <a href="#overview">Dev note</a>
        <a href="#anatomy">Anatomy</a>
        <a href="#reflexes">Reflexes</a>
        <a href="#protocol">Protocol</a>
        <a href="#evidence">Evidence</a>
      </nav>
      <div class="rail-links" aria-label="Project links">
        <a href="https://x.com/resnomonx" target="_blank" rel="noopener noreferrer" aria-label="Resnomo on X" title="X">
          <span class="social-icon" style="--icon:url('./assets/brand/x.svg')" aria-hidden="true"></span><span class="sr-only">X</span>
        </a>
        <a href="https://huggingface.co/spaces/tardumo/Resnomo/tree/main" target="_blank" rel="noopener noreferrer" aria-label="Resnomo source on Hugging Face" title="Hugging Face source">
          <span class="social-icon" style="--icon:url('./assets/brand/huggingface.svg')" aria-hidden="true"></span><span class="sr-only">Hugging Face</span>
        </a>
      </div>
      <div class="ca-box">
        <div><span>Contract address</span><button type="button" data-copy-ca disabled>Copy</button></div>
        <code data-ca>TBA</code>
      </div>
    </aside>

    <main>
      <section class="hero" id="overview">
        <div class="eyebrow"><span>DEV NOTE / 001</span><span>AGENT ANATOMY NETWORK</span></div>
        <h1>See how an agent<br /><em>thinks, acts, remembers.</em></h1>
        <div class="dev-note">
          <p class="note-lead">I have spent a lot of time watching agents become easier to launch.</p>
          <div class="note-columns">
            <div>
              <p>Give a model a prompt, connect a few tools, add a loop, and you can call the result autonomous.</p>
              <p>But I kept coming back to a more basic question.</p>
              <p><strong>When the agent acts, what are we actually able to see?</strong></p>
              <p>We see the final answer. Sometimes we see a chain of text. We rarely see the working body underneath it: which perception changed the plan, which permission opened the route, which tool performed the action, and what evidence proved the result.</p>
            </div>
            <div>
              <p>That is the idea behind Resnomo.</p>
              <p>Resnomo treats an agent less like a chat window and more like a machine with organs. Perception reads the environment. Planning composes a route. Authorization controls the boundary. Execution touches the outside world. Verification checks what really happened. Memory keeps only what can be used again.</p>
              <p>I do not want you to trust an agent because it sounds confident.</p>
              <p><strong>I want you to be able to open the machine and inspect the reason it moved.</strong></p>
            </div>
          </div>
          <div class="note-signoff"><span>— Resnomo developer note</span><span>Built in public · V0.1</span></div>
        </div>
        <div class="hero-actions">
          <a class="button primary" href="#anatomy" data-inspect>Inspect the anatomy</a>
          <button class="button" data-explode>Explode anatomy</button>
        </div>
      </section>

      <section class="section engine-section" id="engine">
        <div class="section-kicker"><span>01</span><span>Verification engine</span></div>
        <div class="engine-intro">
          <div>
            <h2>An agent should work like an engine,<br />not a disappearing thought.</h2>
          </div>
          <div class="engine-copy">
            <p>A useful agent is a staged system. State enters. A route is compressed. Permission meters the flow. Tools turn intent into force. Verification measures the output. Memory keeps the route only when the whole cycle closes.</p>
            <p>The machine below is a mechanical analogy for that process. Take it apart to inspect the dependency between its parts, then ignite it to see the complete system behave as one body.</p>
          </div>
        </div>
        <div class="visual-cue"><span>SCROLL INTO THE MACHINE</span><i></i><span>FIGURE 01 / LIVE ASSEMBLY</span></div>
        <figure class="rocket-shell">
          <div class="rocket-meta"><span>Fig 01</span><span>Staged autonomy / mechanical study</span><span>Interactive</span></div>
          <iframe src="./figures/verification-engine.html" title="Interactive staged verification engine" loading="lazy"></iframe>
          <figcaption>
            <span>Hover to disassemble · select a component · use Ignite to run the system</span>
            <strong>Every stage must remain observable under load.</strong>
          </figcaption>
        </figure>
        <div class="engine-stages">
          <article><span>01 / Intake</span><h3>State enters the body</h3><p>The engine begins with the smallest useful view of the environment, not an unlimited stream of context.</p></article>
          <article><span>02 / Compression</span><h3>Intent becomes a route</h3><p>The planner turns a goal into bounded steps, dependencies and explicit stop conditions.</p></article>
          <article><span>03 / Combustion</span><h3>Tools create real change</h3><p>Execution happens only inside declared permissions. Every external effect leaves a receipt.</p></article>
          <article><span>04 / Thrust</span><h3>Evidence closes the loop</h3><p>A route is complete only when the result can be measured against the original mission.</p></article>
        </div>
      </section>

      <section class="section" id="anatomy">
        <div class="section-kicker"><span>02</span><span>Anatomy of autonomy</span></div>
        <h2>An agent is not one model.<br />It is a coordinated body.</h2>
        <p class="section-intro">Resnomo exposes the six systems required for an agent to move from intent to verified action. Select any organ to inspect its responsibility in the execution chain.</p>
        <figure class="machine-card" data-machine tabindex="0" role="group" aria-label="Interactive Agent Cognition Engine. Use arrow keys to select an organ and Space to separate the machine.">
          <div class="figure-head"><span>Fig 02</span><span>Agent Cognition Engine <em data-assembly-state>Assembled</em></span></div>
          <div class="machine-stage iso">${heroSvg}</div>
          <figcaption><span data-hint>Hover an organ · Space separates the machine</span><strong data-readout>perceive · reading environment</strong></figcaption>
          <div class="sr-only" aria-live="polite" data-live></div>
        </figure>
        <ol class="organ-nav" aria-label="Agent organs">
          ${organs.map(([id, name, role], i) => `<li><button data-select="${id}"><span>${String(i + 1).padStart(2, "0")}</span><strong>${name}</strong><small>${role}</small></button></li>`).join("")}
        </ol>
        <div class="organ-grid">
          ${organs.map(([id, name, role, copy], i) => `<article data-organ-card="${id}"><span>${String(i + 1).padStart(2, "0")}</span><div><h3>${name}</h3><p class="role">${role}</p><p>${copy}</p></div></article>`).join("")}
        </div>
      </section>

      <section class="section" id="reflexes">
        <div class="section-kicker"><span>03</span><span>From mission to reflex</span></div>
        <h2>Successful work becomes instinct.</h2>
        <p class="section-intro">A route is not trusted because an agent generated it. It becomes a Reflex only after execution evidence is checked, replayed and versioned.</p>
        <div class="instrument-grid">
          <article class="instrument"><div class="mini-machine iso">${miniFigure("reflex")}</div><span>Instrument A</span><h3>Reflex ratchet</h3><p>Each verified execution advances the ratchet. Failed validation cannot move the wheel.</p></article>
          <article class="instrument"><div class="mini-machine iso">${miniFigure("memory")}</div><span>Instrument B</span><h3>Memory archive</h3><p>Routes are stored with their inputs, permissions, evidence and environment version.</p></article>
          <article class="instrument"><div class="mini-machine iso">${miniFigure("lock")}</div><span>Instrument C</span><h3>Permission lock</h3><p>Sensitive actions remain physically blocked until the required authorization is present.</p></article>
        </div>
        <div class="long-copy">
          <p class="pull">Most agent systems remember what was said. Resnomo is interested in remembering what was proven to work.</p>
          <div class="copy-columns">
            <p>A Reflex is not a prompt fragment and it is not a claim written by the agent. It is a versioned route attached to the environment in which it succeeded: inputs, scopes, tool versions, returned evidence and the exact condition that closed the task.</p>
            <p>If the environment changes, the Reflex does not quietly pretend to remain valid. It degrades. The route returns to verification, and only a successful replay can restore it. Failure becomes part of the record instead of something the interface hides.</p>
          </div>
        </div>
      </section>

      <section class="section" id="protocol">
        <div class="section-kicker"><span>04</span><span>Execution protocol</span></div>
        <h2>One observable route,<br />six accountable stages.</h2>
        <ol class="protocol-list">
          ${[
            ["Perceive", "Collect the minimum environment state required by the mission."],
            ["Plan", "Compose a route from available tools, limits and known Reflexes."],
            ["Authorize", "Pause at every boundary that requires user or policy approval."],
            ["Execute", "Run the tool call inside its declared scope and capture the result."],
            ["Verify", "Compare the result with the mission’s explicit success condition."],
            ["Remember", "Version the successful route so it can be replayed and monitored."],
          ].map(([name, copy], i) => `<li><span>${String(i + 1).padStart(2, "0")}</span><h3>${name}</h3><p>${copy}</p></li>`).join("")}
        </ol>
      </section>

      <section class="section evidence-section" id="evidence">
        <div class="section-kicker"><span>05</span><span>Evidence before confidence</span></div>
        <h2>The model can propose.<br />The system has to prove.</h2>
        <p class="section-intro">Language models are good at producing plausible next steps. Plausibility is not the same as completion. Resnomo separates a proposed action from an accepted result.</p>
        <div class="principle-grid">
          <article><span>RULE 01</span><h3>No invisible authority</h3><p>A route carries only the permissions required for its current step. Wallet signatures, destructive changes and sensitive account access remain explicit boundaries.</p></article>
          <article><span>RULE 02</span><h3>No result without a receipt</h3><p>Tool output, changed state, timestamps and verification checks travel with the execution. A confident sentence is never accepted as evidence.</p></article>
          <article><span>RULE 03</span><h3>No permanent success</h3><p>Interfaces move. APIs change. Credentials expire. A capability must be rechecked against the environment that makes it useful.</p></article>
          <article><span>RULE 04</span><h3>No fabricated activity</h3><p>Unknown data stays unknown. Disconnected systems are labeled disconnected. A quiet network is more honest than an invented live feed.</p></article>
        </div>
        <div class="failure-band">
          <div><span>FAILURE IS A STATE</span><strong>not a hidden exception</strong></div>
          <ol>
            <li><span>01</span>Detect the mismatch</li>
            <li><span>02</span>Freeze unsafe replay</li>
            <li><span>03</span>Locate the failed organ</li>
            <li><span>04</span>Repair and verify again</li>
          </ol>
        </div>
      </section>

      <section class="section build-note" id="build-notes">
        <div class="section-kicker"><span>06</span><span>System release</span></div>
        <h2>An operating model<br />for observable autonomy.</h2>
        <div class="build-grid">
          <div class="build-prose">
            <p>Resnomo maps autonomous work into a system that can be inspected from intent to evidence.</p>
            <p>Missions move through six accountable organs. Permission boundaries interrupt unsafe routes. Verification separates a proposed result from an accepted one. Successful execution becomes a reusable Reflex with a visible history.</p>
            <p>The interface gives every stage a stable place: perception, planning, authorization, execution, verification and memory. The result is a common language for understanding how an agent moved and why the system accepted the outcome.</p>
            <p>Receipts, route schemas, capability versions, sandbox boundaries and Reflex records form one continuous anatomy rather than separate dashboards.</p>
            <p><strong>Less narration. More working anatomy.</strong></p>
          </div>
          <dl class="build-ledger">
            <div><dt>Agent anatomy</dt><dd class="ready">Published</dd></div>
            <div><dt>Interactive figures</dt><dd class="ready">Active</dd></div>
            <div><dt>Execution protocol</dt><dd class="ready">Defined</dd></div>
            <div><dt>Evidence model</dt><dd class="ready">Defined</dd></div>
            <div><dt>Reflex lifecycle</dt><dd class="ready">Documented</dd></div>
            <div><dt>Permission boundaries</dt><dd class="ready">Documented</dd></div>
          </dl>
        </div>
      </section>

    </main>

    <aside class="facts anatomy-console" aria-label="Interactive system anatomy">
      <div class="facts-head"><span>System anatomy</span><i aria-hidden="true"></i></div>
      <div class="facts-current">
        <span>Active organ <b data-side-index>01 / 06</b></span>
        <strong data-side-organ>Eyes</strong>
        <em data-side-role>Perception</em>
        <p data-side-description>Reads interfaces, documents and live environment state.</p>
      </div>
      <ol class="facts-route" aria-label="Execution route">
        ${organs.map(([id, name, role], index) => `<li><button type="button" data-select="${id}"${index === 0 ? ' class="active"' : ''}><span>${String(index + 1).padStart(2, "0")}</span><i aria-hidden="true"></i><div><strong>${name}</strong><small>${role}</small></div></button></li>`).join("")}
      </ol>
      <div class="facts-foot">
        <span>Current state</span><strong data-side-state>Perceive</strong>
        <p>Evidence must clear every boundary before a route becomes reusable memory.</p>
      </div>
    </aside>
  </div>
  <footer><span>Resnomo</span><span>Make autonomy observable.</span><a href="#top">Back to top ↑</a></footer>
  <script src="./app.js"></script>
</body>
</html>`;

writeFileSync(join(OUT, "index.html"), html);
console.log("wrote", join(OUT, "index.html"));
