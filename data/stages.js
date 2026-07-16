// stages.js — ステージ定義（データ駆動）。
// 新しいステージはこの配列に追加するだけで増やせる。
// dir: 0=上,1=右,2=下,3=左。座標 x=列, y=行(下方向+)。
// allowed: ブロックパレットに出すブロック種別。
// stars: { three, two } … クリア時のブロック数がこの値以内なら★3 / ★2。
// solution: 模範解答（ヒント最終段階とテストに使用）。

export const STAGES = [
  {
    id: 'p1',
    title: 'ゴールまで まっすぐ',
    concept: 'じゅんじつ実行（上から順に命令が動く）',
    grid: { cols: 5, rows: 3 },
    robot: { x: 0, y: 1, dir: 1 },
    goal: { x: 4, y: 1 },
    goalType: 'reach',
    allowed: ['forward'],
    stars: { three: 4, two: 6 },
    tutorial: '「まえにすすむ」ブロックをならべて、ロボットをゴール（旗）まで動かそう！',
    hints: [
      'ロボットはいま右をむいているよ。「まえにすすむ」で右にすすむんだ。',
      'ゴールまでのマスの数だけ「まえにすすむ」をならべよう。',
      '「まえにすすむ」を4こならべればゴールだよ。',
    ],
    solution: [
      { type: 'forward' }, { type: 'forward' }, { type: 'forward' }, { type: 'forward' },
    ],
  },
  {
    id: 'p2',
    title: 'まがりみちを すすもう',
    concept: '回転ブロックで向きを変える',
    grid: { cols: 5, rows: 5 },
    robot: { x: 0, y: 4, dir: 1 },
    goal: { x: 2, y: 0 },
    goalType: 'reach',
    allowed: ['forward', 'left', 'right'],
    stars: { three: 7, two: 10 },
    tutorial: '「みぎにまわる」「ひだりにまわる」でロボットの向きを変えられるよ。まがってゴールをめざそう！',
    hints: [
      'まず右に2マスすすんでみよう。',
      '(2,4)まで来たら「ひだりにまわる」で上をむこう。',
      'まえに2すすむ→ひだりにまわる→まえに4すすむ、でゴールだよ。',
    ],
    solution: [
      { type: 'forward' }, { type: 'forward' },
      { type: 'left' },
      { type: 'forward' }, { type: 'forward' }, { type: 'forward' }, { type: 'forward' },
    ],
  },
  {
    id: 'p3',
    title: 'ジェムを あつめよう',
    concept: 'アイテム回収（collect）と条件つきクリア',
    grid: { cols: 5, rows: 3 },
    robot: { x: 0, y: 1, dir: 1 },
    goal: { x: 4, y: 1 },
    gems: [{ x: 2, y: 1 }],
    goalType: 'collect_and_reach',
    allowed: ['forward', 'left', 'right', 'collect'],
    stars: { three: 5, two: 7 },
    tutorial: 'とちゅうにある💎（ジェム）を「ひろう」でゲットしてから、ゴールへ行こう！',
    hints: [
      'ジェムのマスの上にのってから「ひろう」を使うよ。',
      'まえに2すすむとジェムの上にのれるよ。',
      'まえ2→ひろう→まえ2、でクリアだよ。',
    ],
    solution: [
      { type: 'forward' }, { type: 'forward' }, { type: 'collect' },
      { type: 'forward' }, { type: 'forward' },
    ],
  },
  {
    id: 'p4',
    title: 'くりかえしの まほう',
    concept: 'ループ（repeat）の導入 — 同じ命令をまとめる',
    grid: { cols: 7, rows: 3 },
    robot: { x: 0, y: 1, dir: 1 },
    goal: { x: 6, y: 1 },
    goalType: 'reach',
    allowed: ['forward', 'repeat'],
    stars: { three: 2, two: 6 },
    tutorial: '「まえにすすむ」を6こならべてもいいけど…「くりかえし」を使うと短く書けるよ！★3は2ブロックで。',
    hints: [
      'ゴールまで6マスあるね。',
      '「6かい くりかえし」の中に「まえにすすむ」を1こ入れてみよう。',
      'くりかえし6かい { まえにすすむ } の2ブロックで★3だよ。',
    ],
    solution: [
      { type: 'repeat', times: 6, body: [{ type: 'forward' }] },
    ],
  },
  {
    id: 'p5',
    title: 'ジグザグ かいだん',
    concept: 'ループ + 回転の組み合わせ（パターンをまとめる）',
    grid: { cols: 5, rows: 5 },
    robot: { x: 0, y: 4, dir: 0 },
    goal: { x: 4, y: 0 },
    goalType: 'reach',
    allowed: ['forward', 'left', 'right', 'repeat'],
    stars: { three: 6, two: 12 },
    tutorial: 'かいだんを上っていこう。「まえ→みぎ→まえ→ひだり」がくりかえしのパターンだよ！',
    hints: [
      'まえにすすむ→みぎにまわる→まえにすすむ→ひだりにまわる、で1だんのぼれるよ。',
      'そのパターンを4回くりかえすとゴールにつくよ。',
      'くりかえし4かい { まえ・みぎ・まえ・ひだり } で★3だよ。',
    ],
    solution: [
      {
        type: 'repeat', times: 4,
        body: [
          { type: 'forward' }, { type: 'right' },
          { type: 'forward' }, { type: 'left' },
        ],
      },
    ],
  },
];

export default STAGES;
