import { readFileSync } from "node:fs";
const mod = await WebAssembly.compile(readFileSync(new URL("../build/expr.wasm", import.meta.url)));
const imports = {};
for (const i of WebAssembly.Module.imports(mod)) (imports[i.module] ??= {})[i.name] = () => 0;
const { exports: ex } = await WebAssembly.instantiate(mod, imports);
try { ex._start(); } catch {}
const enc = new TextEncoder(), dec = new TextDecoder();
function resolve(emo) {
  const b = enc.encode(emo); const p = ex.ex_in_alloc(b.length);
  new Uint8Array(ex.memory.buffer, Number(p), b.length).set(b);
  const len = ex.ex_resolve(); const op = ex.ex_out_ptr();
  return JSON.parse(dec.decode(new Uint8Array(ex.memory.buffer, Number(op), Number(len))));
}
let ok = true; const ck = (c, m) => { if (!c) { console.error("FAIL " + m); ok = false; } };
ck(Math.abs(ex.ex_clamp(1.5) - 1) < 1e-6, "clamp 1.5→1");
ck(Math.abs(ex.ex_clamp(-0.5)) < 1e-6, "clamp -0.5→0");
const h = resolve("happy"); ck(h.length === 7 && h[0].n === "happy", "happy 7ch");
const j = resolve("jitome"); ck(j.length === 4 && Math.abs(j[1].w - 0.15) < 1e-6, "jitome Angry 0.15");
ck(resolve("bogus").length === 0, "unknown empty");
console.log(ok ? "wasm OK — clamp + emotion channels match native" : "FAIL"); if (!ok) process.exit(1);
