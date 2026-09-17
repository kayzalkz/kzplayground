export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const damp = (a, b, rate, dt) => a + (b - a) * (1 - Math.exp(-rate * dt));
export const smooth = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
export const SAVE_KEY = 'adventure-park-save-v1';
export const RIDE_IDS = ['playground', 'slide', 'swing', 'seesaw', 'coaster', 'bumper', 'wheel', 'surf', 'speedboat', 'parasail', 'snorkel', 'scuba', 'skydive', 'trail', 'waterboom', 'cable'];
export function readSave(storage) {
  try {
    const s = JSON.parse(storage.getItem(SAVE_KEY));
    if (!s || s.version !== 1 || !Array.isArray(s.position) || s.position.length !== 3 || !s.position.every(Number.isFinite)) return null;
    if (Math.abs(s.position[0]) > 130 || Math.abs(s.position[2]) > 130) return null;
    return { version: 1, position: [s.position[0], s.position[1], s.position[2]], visited: [...new Set((Array.isArray(s.visited) ? s.visited : []).filter(id => RIDE_IDS.includes(id)))] };
  } catch { return null; }
}
export function saveGame(storage, position, visited) {
  try { storage.setItem(SAVE_KEY, JSON.stringify({version:1,position,visited:[...visited]})); return true; } catch { return false; }
}
export function pendulum(state, input, dt, length = 3) {
  const a = -(9.81 / length) * Math.sin(state.angle) - .24 * state.velocity + clamp(input,-1,1) * 1.4;
  state.velocity = clamp(state.velocity + a * dt, -2.2, 2.2);
  state.angle += state.velocity * dt;
  if (Math.abs(state.angle) > 1.1) { state.angle = Math.sign(state.angle)*1.1; state.velocity *= -.3; }
  return state;
}
export function activityEmotion(id, progress) {
  const stages = {coaster:['Excited','Nervous','Scared','Laughing','Happy'],wheel:['Curious','Amazed','Peaceful','Happy'],slide:['Excited','Surprised','Laughing','Happy'],bumper:['Focused','Surprised','Laughing'],swing:['Relaxed','Happy','Excited'],seesaw:['Playful','Laughing','Happy'],playground:['Curious','Excited','Happy'],surf:['Curious','Focused','Laughing','Happy'],speedboat:['Excited','Scared','Laughing','Happy'],parasail:['Nervous','Amazed','Peaceful','Happy'],snorkel:['Curious','Amazed','Peaceful','Happy'],scuba:['Nervous','Focused','Amazed','Peaceful','Happy'],skydive:['Nervous','Scared','Amazed','Laughing','Happy'],trail:['Curious','Tired','Amazed','Proud','Happy'],waterboom:['Excited','Surprised','Laughing','Happy'],cable:['Peaceful','Amazed','Curious','Happy']};
  const list = stages[id] || ['Happy'];
  return list[Math.min(list.length-1, Math.floor(clamp(progress,0,1)*list.length))];
}
export class Input {
  constructor(onAction) {
    this.keys = new Set();
    const actions = new Set(['Enter','Escape','Space']);
    const relevant = new Set([...actions,'KeyV','ArrowUp','ArrowDown','ArrowLeft','ArrowRight']);
    window.addEventListener('keydown', e => {
      if (!relevant.has(e.code)) return;
      if (e.target instanceof Element && e.target.matches('input,select,button') && e.code !== 'Escape') return;
      e.preventDefault(); this.keys.add(e.code);
      if (!e.repeat && actions.has(e.code)) onAction(e.code);
    });
    window.addEventListener('keyup', e => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());
    document.querySelectorAll('[data-key]').forEach(button => {
      const key = button.dataset.key;
      button.addEventListener('pointerdown', e => {e.preventDefault();button.setPointerCapture(e.pointerId);this.keys.add(key);if(actions.has(key))onAction(key);});
      for(const event of ['pointerup','pointercancel','lostpointercapture']) button.addEventListener(event,()=>this.keys.delete(key));
    });
  }
  axis(positive, negative) { return Number(this.keys.has(positive))-Number(this.keys.has(negative)); }
}
