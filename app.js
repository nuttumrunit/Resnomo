const organs = ["eyes", "brain", "immune", "hands", "heart", "memory"];
const phases = {
  eyes: ["perceive", "reading environment"],
  brain: ["plan", "composing action route"],
  immune: ["authorize", "checking permission boundary"],
  hands: ["execute", "operating selected tool"],
  heart: ["verify", "testing returned evidence"],
  memory: ["remember", "versioning reusable reflex"],
};
const organDetails = {
  eyes: ["Eyes", "Perception", "Reads interfaces, documents and live environment state."],
  brain: ["Brain", "Planning", "Turns an objective into a constrained route of actions."],
  immune: ["Immune system", "Authorization", "Checks scopes, signatures and irreversible operations."],
  hands: ["Hands", "Execution", "Operates tools and records the evidence returned by each call."],
  heart: ["Heartbeat", "Verification", "Replays known routes and detects degradation before use."],
  memory: ["Memory", "Reflexes", "Stores successful routes as reusable, versioned capabilities."],
};
const stage = document.querySelector(".machine-stage");
const machine = document.querySelector("[data-machine]");
const readout = document.querySelector("[data-readout]");
const hint = document.querySelector("[data-hint]");
const assemblyState = document.querySelector("[data-assembly-state]");
const sideState = document.querySelector("[data-side-state]");
const sideIndex = document.querySelector("[data-side-index]");
const sideOrgan = document.querySelector("[data-side-organ]");
const sideRole = document.querySelector("[data-side-role]");
const sideDescription = document.querySelector("[data-side-description]");
const live = document.querySelector("[data-live]");
const orb = document.querySelector("[data-task-orb]");
const reduce = matchMedia("(prefers-reduced-motion: reduce)");
const pathPoints = [...document.querySelectorAll("[data-organ]")].length;
let selected = 0;
let manual = false;
let exploded = false;
let frame = 0;
let last = 0;
let clock = 0;
const springs = new Map([...document.querySelectorAll("[data-organ]")].map((node) => [node, { x: 0, y: 0, vx: 0, vy: 0 }]));

function activate(index, announce = false) {
  selected = (index + organs.length) % organs.length;
  const id = organs[selected];
  stage.dataset.focus = id;
  document.querySelectorAll("[data-organ]").forEach((node) => node.classList.toggle("is-active", node.dataset.organ === id));
  document.querySelectorAll("[data-select]").forEach((button) => button.classList.toggle("active", button.dataset.select === id));
  document.querySelectorAll("[data-organ-card]").forEach((card) => card.classList.toggle("active", card.dataset.organCard === id));
  readout.textContent = `${phases[id][0]} · ${phases[id][1]}`;
  sideState.textContent = phases[id][0][0].toUpperCase() + phases[id][0].slice(1);
  sideIndex.textContent = `${String(selected + 1).padStart(2, "0")} / ${String(organs.length).padStart(2, "0")}`;
  [sideOrgan.textContent, sideRole.textContent, sideDescription.textContent] = organDetails[id];
  if (announce) live.textContent = `${phases[id][0]}. ${phases[id][1]}.`;
}

function select(id, announce = true) {
  manual = true;
  activate(organs.indexOf(id), announce);
}

document.querySelectorAll("[data-organ]").forEach((node) => {
  node.addEventListener("pointerenter", () => select(node.dataset.organ, false));
  node.addEventListener("click", () => select(node.dataset.organ));
});
document.querySelectorAll("[data-select]").forEach((button) => button.addEventListener("click", () => select(button.dataset.select)));
document.querySelectorAll("[data-organ-card]").forEach((card) => card.addEventListener("click", () => {
  select(card.dataset.organCard);
  document.querySelector("[data-machine]").scrollIntoView({ behavior: reduce.matches ? "auto" : "smooth", block: "center" });
}));

function toggleExplode(force) {
  exploded = typeof force === "boolean" ? force : !exploded;
  stage.classList.toggle("is-exploded", exploded);
  machine.classList.toggle("is-separated", exploded);
  document.querySelectorAll("[data-explode]").forEach((button) => button.textContent = exploded ? "Assemble anatomy" : "Explode anatomy");
  if (assemblyState) assemblyState.textContent = exploded ? "Separated" : "Assembled";
  if (hint) hint.textContent = exploded ? "Six systems separated · Select an organ to inspect it" : "Hover an organ · Space separates the machine";
  live.textContent = exploded ? "Agent anatomy separated into six assemblies." : "Agent anatomy assembled.";
  run();
}
document.querySelectorAll("[data-explode]").forEach((button) => button.addEventListener("click", () => {
  toggleExplode();
  if (!button.closest(".machine-card")) {
    machine?.scrollIntoView({ behavior: reduce.matches ? "auto" : "smooth", block: "center" });
  }
}));

document.querySelectorAll("[data-inspect]").forEach((button) => button.addEventListener("click", (event) => {
  event.preventDefault();
  toggleExplode(false);
  machine?.scrollIntoView({ behavior: reduce.matches ? "auto" : "smooth", block: "center" });
  machine?.classList.remove("is-inspecting");
  requestAnimationFrame(() => machine?.classList.add("is-inspecting"));
  setTimeout(() => machine?.classList.remove("is-inspecting"), 1400);
  live.textContent = "Agent anatomy in inspection view. Select one of the six systems.";
}));

machine.addEventListener("keydown", (event) => {
  if (["ArrowRight", "ArrowDown"].includes(event.key)) { event.preventDefault(); manual = true; activate(selected + 1, true); }
  if (["ArrowLeft", "ArrowUp"].includes(event.key)) { event.preventDefault(); manual = true; activate(selected - 1, true); }
  if (event.key === " ") { event.preventDefault(); toggleExplode(); }
});

function moveOrb(t) {
  if (!orb || reduce.matches) return;
  const svg = orb.ownerSVGElement;
  const box = svg.viewBox.baseVal;
  const route = svg.querySelector(".task-track");
  const length = route.getTotalLength();
  const p = route.getPointAtLength((t % 1) * length);
  orb.setAttribute("cx", p.x);
  orb.setAttribute("cy", p.y);
}

function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  clock += dt;
  if (!manual) activate(Math.floor(clock / 2.8) % organs.length);
  moveOrb(clock / 16.8);
  let moving = false;
  springs.forEach((state, node) => {
    const [mx, my] = node.dataset.move.split(",").map(Number);
    const spread = matchMedia("(max-width: 820px)").matches ? 1.55 : 2.25;
    const tx = exploded ? mx * spread : 0;
    const ty = exploded ? my * spread : 0;
    for (let i = 0; i < 3; i++) {
      const step = dt / 3;
      state.vx += ((tx - state.x) * 68 - state.vx * 15.5) * step;
      state.vy += ((ty - state.y) * 68 - state.vy * 15.5) * step;
      state.x += state.vx * step;
      state.y += state.vy * step;
    }
    if (Math.abs(tx - state.x) > .01 || Math.abs(ty - state.y) > .01 || Math.abs(state.vx) > .01 || Math.abs(state.vy) > .01) moving = true;
    if (node instanceof SVGElement) node.setAttribute("transform", `translate(${state.x.toFixed(2)} ${state.y.toFixed(2)})`);
    else node.style.setProperty("--piece-x", `${state.x.toFixed(2)}px`), node.style.setProperty("--piece-y", `${state.y.toFixed(2)}px`);
  });
  const needle = document.querySelector("[data-heart-needle]");
  if (needle && !reduce.matches) needle.style.transform = `rotate(${Math.sin(clock * 2.1) * 17}deg)`;
  frame = (!manual || moving || !reduce.matches) ? requestAnimationFrame(tick) : 0;
}
function run(){ if (!frame) { last = 0; frame = requestAnimationFrame(tick); } }
new IntersectionObserver((entries) => {
  const visible = entries[entries.length - 1].isIntersecting;
  if (visible) run(); else if (frame) { cancelAnimationFrame(frame); frame = 0; }
}, { rootMargin: "100px" }).observe(machine);

const menu = document.querySelector(".menu");
const rail = document.querySelector(".rail");
menu?.addEventListener("click", () => { const open = !rail.classList.contains("open"); rail.classList.toggle("open", open); menu.setAttribute("aria-expanded", String(open)); });
document.querySelectorAll(".rail nav a").forEach((link) => link.addEventListener("click", () => rail.classList.remove("open")));
const sectionObserver = new IntersectionObserver((entries) => {
  entries.filter((entry) => entry.isIntersecting).forEach((entry) => document.querySelectorAll(".rail nav a").forEach((link) => link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`)));
}, { rootMargin: "-20% 0px -70%" });
document.querySelectorAll("main section[id]").forEach((section) => sectionObserver.observe(section));

document.querySelector("[data-copy-ca]")?.addEventListener("click", async (event) => {
  const value = document.querySelector("[data-ca]")?.textContent.trim();
  if (!value || value.toUpperCase() === "TBA") return;
  await navigator.clipboard.writeText(value);
  const button = event.currentTarget;
  const previous = button.textContent;
  button.textContent = "Copied";
  setTimeout(() => { button.textContent = previous; }, 1400);
});

activate(0);
run();
