// expression-driver.js — emotion → VRM 表情/モーフ適用のグルー例。
// channel 解決 + clamp は Almide(wasm)、setMorphOrExpression は JS。
//
//   const ex = await loadExpression("/expr.wasm");
//   ex.applyEmotion(vrm, "happy", 1.0);
const ALL = new Set();  // 適用済み channel を覚えて切替時にクリア
export async function loadExpression(wasmUrl) {
  const bytes = await (await fetch(wasmUrl)).arrayBuffer();
  const mod = await WebAssembly.compile(bytes);
  const imports = {};
  for (const i of WebAssembly.Module.imports(mod)) (imports[i.module] ??= {})[i.name] = () => 0;
  const { exports: ex } = await WebAssembly.instantiate(mod, imports);
  try { ex._start(); } catch {}
  const enc = new TextEncoder(), dec = new TextDecoder();
  const channels = (emo) => {
    const b = enc.encode(emo); const p = ex.ex_in_alloc(b.length);
    new Uint8Array(ex.memory.buffer, Number(p), b.length).set(b);
    const len = ex.ex_resolve(); const op = ex.ex_out_ptr();
    return JSON.parse(dec.decode(new Uint8Array(ex.memory.buffer, Number(op), Number(len))));
  };
  // VRM expression 優先、無ければ raw morph に fallback。
  const setMorphOrExpression = (vrm, name, value) => {
    const v = ex.ex_clamp(value);
    const em = vrm.expressionManager;
    if (em?.getExpression?.(name)) { em.setValue(name, v); ALL.add(name); return; }
    vrm.scene.traverse((m) => {
      if (!m.isSkinnedMesh || !m.morphTargetDictionary) return;
      const idx = m.morphTargetDictionary[name];
      if (idx !== undefined && m.morphTargetInfluences) { m.morphTargetInfluences[idx] = v; ALL.add(name); }
    });
  };
  return {
    applyEmotion(vrm, emo, weight = 1.0) {
      for (const n of ALL) setMorphOrExpression(vrm, n, 0);  // 前回をクリア
      if (emo === "neutral") return;
      for (const c of channels(emo)) setMorphOrExpression(vrm, c.n, c.w * weight);
    },
  };
}
