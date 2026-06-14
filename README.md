# fizz-expression-applier

Fizz の **表情適用コア**。emotion 名から、適用すべき channel(VRM プリセット名 or
Lime/VRoid 系の生モーフ key)と重み比を返し、値を [0,1] にクランプする。

ブラウザは各 channel を `setMorphOrExpression`(expressionManager 優先、無ければ
SkinnedMesh の morph target に fallback)で `clamp01(w × weight)` で適用する。
**どの emotion がどの channel をどの比率で点けるか**の表 + クランプは純粋なので Almide
に集約=単一の正本。プリセットと granular shape key を両方重ねがけするので、どちらの
形式のモデルもカバーされる。移植元: openaituber `src/vrm/control.ts`。

対応 emotion(21): neutral / happy / angry / sad / surprised / relaxed / joy / fun /
sorrow / wink / blink / smile / shy / excited / laughing / crying / smug / thinking /
confused / pout / jitome。

## native

```sh
almide build src/main.almd -o build/fizz-expression-applier
printf 'happy\njitome\n' | ./build/fizz-expression-applier
# happy	[{"n":"happy","w":1.0},{"n":"Joy","w":1.0},...]
```

## wasm

```sh
almide build src/bridge.almd --target wasm -o build/expr.wasm
```

`ex_clamp(v) -> Float`。emotion 名を `ex_in_alloc(len)` で書き、`ex_resolve()`(channel
JSON を出力バッファに書き長さを返す)→ `ex_out_ptr()` で読み取り `JSON.parse`。
グルー例 [`browser/expression-driver.js`](./browser/expression-driver.js)。
CI で wasm↔native 一致を検証。

ツールチェーン: [almide](https://github.com/almide/almide) v0.27.6+。依存なし。
