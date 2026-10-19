// メニュー・おすすめのデータ。内容を変えるときはここを編集する。
// 名前などは日本語で書く（注文記録は日本語で残る）。他言語の表示は i18n.js で翻訳する。
const STORE_NAME = "むった食堂";
const TABLE_NUMBER = 5;

const CATEGORIES = [
  { id: "recommend", name: "おすすめ" },
  { id: "teishoku", name: "定食" },
  { id: "noodle", name: "麺類" },
  { id: "don", name: "丼もの" },
  { id: "side", name: "一品料理" },
  { id: "drink", name: "お飲み物" },
  { id: "dessert", name: "甘味" },
];

// options: 選択肢グループ。choices の price は追加料金（円）。
const RICE_OPTION = {
  name: "ごはんの量",
  choices: [
    { label: "普通", price: 0 },
    { label: "大盛り", price: 100 },
    { label: "少なめ", price: 0 },
  ],
};
const NOODLE_OPTION = {
  name: "麺の量",
  choices: [
    { label: "普通", price: 0 },
    { label: "大盛り", price: 150 },
  ],
};
const DRINK_SIZE = {
  name: "サイズ",
  choices: [
    { label: "並", price: 0 },
    { label: "大", price: 80 },
  ],
};

// アレルギーの対象（特定原材料8品目 ＋ 大豆・ごま）
const ALLERGENS = ["えび", "かに", "くるみ", "小麦", "そば", "卵", "乳", "落花生", "大豆", "ごま"];

// 料理ごとのアレルギー情報。一般的な作り方をもとにした仮の設定なので、実際の材料に合わせて確認すること。
const ITEM_ALLERGENS = {
  1: ["小麦", "卵", "大豆"],
  2: ["小麦", "大豆"],
  3: ["大豆"],
  4: ["小麦", "卵", "乳", "大豆"],
  5: ["小麦", "卵", "乳", "大豆"],
  6: ["小麦", "大豆"],
  7: ["小麦", "卵", "乳", "大豆"],
  8: ["小麦", "卵", "大豆", "ごま"],
  9: ["小麦", "卵", "大豆", "ごま"],
  10: ["そば", "小麦", "大豆"],
  11: ["小麦", "大豆"],
  12: ["えび", "そば", "小麦", "卵", "大豆"],
  13: ["小麦", "卵", "大豆"],
  14: ["小麦", "卵", "乳", "大豆"],
  15: ["えび", "小麦", "卵", "大豆"],
  16: ["えび", "小麦", "大豆"],
  17: ["小麦", "大豆", "ごま"],
  18: ["小麦", "大豆"],
  19: ["大豆"],
  20: ["卵"],
  21: [],
  22: [],
  23: [],
  24: [],
  25: [],
  26: [],
  27: ["卵", "乳"],
  28: ["大豆"],
  29: ["卵", "乳"],
  30: [],
};

// time: 提供時間の目安（分）
// alcohol: true の商品は 20 歳未満と入力したお客様には注文できない。
const MENU_ITEMS = [
  { id: 1, category: "teishoku", name: "唐揚げ定食", price: 880, time: 12, emoji: "🍗", desc: "自家製だれに漬け込んだ唐揚げ五個。ごはん・味噌汁・香の物付き。", tags: ["人気"], options: [RICE_OPTION] },
  { id: 2, category: "teishoku", name: "生姜焼き定食", price: 850, time: 10, emoji: "🥩", desc: "国産豚ロースを特製生姜だれで香ばしく。ごはん・味噌汁・香の物付き。", tags: [], options: [RICE_OPTION] },
  { id: 3, category: "teishoku", name: "焼き鯖定食", price: 900, time: 15, emoji: "🐟", desc: "脂ののった塩鯖を炭火で。大根おろし添え。ごはん・味噌汁・小鉢付き。", tags: [], options: [RICE_OPTION] },
  { id: 4, category: "teishoku", name: "和風ハンバーグ定食", price: 980, time: 15, emoji: "🍖", desc: "手ごねハンバーグに大根おろしと特製ぽん酢。ごはん・味噌汁付き。", tags: ["新作"], options: [RICE_OPTION] },
  { id: 5, category: "teishoku", name: "とんかつ定食", price: 1050, time: 15, emoji: "🍱", desc: "厚切りロースをさっくり揚げて。キャベツ山盛り。ごはん・味噌汁付き。", tags: [], options: [RICE_OPTION] },
  { id: 6, category: "teishoku", name: "刺身定食", price: 1280, time: 10, emoji: "🍣", desc: "その日仕入れた鮮魚の三種盛り。ごはん・味噌汁・小鉢付き。", tags: ["数量限定"], options: [RICE_OPTION] },
  { id: 7, category: "teishoku", name: "お子さま御膳", price: 650, time: 10, emoji: "🍙", desc: "小さな唐揚げ・玉子焼き・おにぎり・ポテト。ジュース付き。", tags: [] },
  { id: 8, category: "noodle", name: "醤油らーめん", price: 750, time: 8, emoji: "🍜", desc: "鶏がらと煮干しのあっさり醤油。チャーシュー・メンマ・葱。", tags: ["人気"], options: [NOODLE_OPTION] },
  { id: 9, category: "noodle", name: "味噌らーめん", price: 800, time: 10, emoji: "🍜", desc: "三種の味噌を合わせたコク深いスープ。炒め野菜たっぷり。", tags: [], options: [NOODLE_OPTION] },
  { id: 10, category: "noodle", name: "ざるそば", price: 650, time: 7, emoji: "🥢", desc: "香り高い二八そば。わさび・葱・海苔添え。", tags: [], options: [NOODLE_OPTION] },
  { id: 11, category: "noodle", name: "きつねうどん", price: 600, time: 7, emoji: "🍲", desc: "甘く煮含めたお揚げと、昆布とかつおのだし。", tags: [], soldOut: true, options: [NOODLE_OPTION] },
  { id: 12, category: "noodle", name: "天ぷらそば", price: 950, time: 12, emoji: "🍤", desc: "海老天二尾と野菜天をのせた温かいおそば。", tags: [], options: [NOODLE_OPTION] },
  { id: 13, category: "don", name: "親子丼", price: 780, time: 10, emoji: "🍳", desc: "ふんわり半熟卵と鶏もも肉。味噌汁付き。", tags: [], options: [RICE_OPTION] },
  { id: 14, category: "don", name: "カツ丼", price: 880, time: 12, emoji: "🍛", desc: "さっくり揚げたロースカツを卵でとじて。味噌汁付き。", tags: ["人気"], options: [RICE_OPTION] },
  { id: 15, category: "don", name: "天丼", price: 920, time: 12, emoji: "🍤", desc: "海老・きす・野菜の天ぷらに甘辛いたれ。味噌汁付き。", tags: [], options: [RICE_OPTION] },
  { id: 16, category: "don", name: "海鮮丼", price: 1380, time: 8, emoji: "🐠", desc: "鮪・サーモン・いくら・海老をたっぷりと。味噌汁付き。", tags: ["数量限定"], options: [RICE_OPTION] },
  { id: 17, category: "side", name: "焼き餃子（六個）", price: 350, time: 8, emoji: "🥟", desc: "羽根付きでぱりっと焼き上げた自家製餃子。", tags: [] },
  { id: 18, category: "side", name: "冷奴", price: 250, time: 3, emoji: "🧊", desc: "なめらかな絹ごし豆腐に葱と生姜。", tags: [] },
  { id: 19, category: "side", name: "枝豆", price: 280, time: 3, emoji: "🫛", desc: "茹でたての枝豆を塩で。", tags: [] },
  { id: 20, category: "side", name: "ポテトサラダ", price: 300, time: 3, emoji: "🥗", desc: "燻製たまご入りの大人のポテトサラダ。", tags: [] },
  { id: 21, category: "side", name: "フライドポテト", price: 320, time: 6, emoji: "🍟", desc: "外はかりっと、中はほくほく。", tags: [] },
  { id: 22, category: "drink", name: "生ビール", price: 520, time: 2, emoji: "🍺", desc: "きりっと冷えた生ビール。", tags: [], alcohol: true, options: [{ name: "サイズ", choices: [{ label: "中ジョッキ", price: 0 }, { label: "大ジョッキ", price: 200 }] }] },
  { id: 23, category: "drink", name: "日本酒（一合）", price: 580, time: 3, emoji: "🍶", desc: "季節の地酒。冷・燗お選びいただけます。", tags: [], alcohol: true, options: [{ name: "温度", choices: [{ label: "冷や", price: 0 }, { label: "熱燗", price: 0 }] }] },
  { id: 24, category: "drink", name: "烏龍茶", price: 220, time: 2, emoji: "🍵", desc: "", tags: [], options: [DRINK_SIZE] },
  { id: 25, category: "drink", name: "オレンジジュース", price: 250, time: 2, emoji: "🧃", desc: "果汁百パーセント。", tags: [], options: [DRINK_SIZE] },
  { id: 26, category: "drink", name: "ラムネ", price: 250, time: 2, emoji: "🫧", desc: "昔ながらの瓶ラムネ。", tags: [] },
  { id: 27, category: "dessert", name: "抹茶アイス", price: 300, time: 3, emoji: "🍨", desc: "宇治抹茶を使った濃厚なアイス。", tags: [] },
  { id: 28, category: "dessert", name: "わらび餅", price: 350, time: 3, emoji: "🍡", desc: "本わらび粉使用。きな粉と黒蜜で。", tags: ["新作"] },
  { id: 29, category: "dessert", name: "昔ながらのプリン", price: 280, time: 3, emoji: "🍮", desc: "固めに焼き上げたほろ苦カラメル。", tags: [] },
  { id: 30, category: "dessert", name: "あんみつ", price: 420, time: 5, emoji: "🍧", desc: "寒天・粒あん・白玉・季節の果物に黒蜜。", tags: [] },
];

// 年代の区分（age 以下ならその年代）
const AGE_GROUPS = [
  { id: "child", label: "お子さま", max: 12 },
  { id: "teen", label: "10代", max: 19 },
  { id: "young", label: "20〜30代", max: 39 },
  { id: "middle", label: "40〜50代", max: 59 },
  { id: "senior", label: "60代以上", max: Infinity },
];

const GENDERS = { male: "男性", female: "女性", none: "回答しない" };

// 年代 × 性別 ごとのおすすめ商品 ID（表示順）
const RECOMMENDATIONS = {
  child:  { male: [7, 21, 25, 29], female: [7, 25, 29, 27], none: [7, 21, 25, 29] },
  teen:   { male: [14, 9, 17, 26], female: [13, 20, 28, 26], none: [14, 13, 17, 26] },
  young:  { male: [1, 14, 22, 17], female: [16, 4, 28, 24], none: [1, 16, 22, 28] },
  middle: { male: [5, 12, 22, 19], female: [3, 15, 23, 30], none: [5, 3, 22, 30] },
  senior: { male: [3, 10, 23, 18], female: [6, 10, 30, 24], none: [3, 10, 23, 30] },
};

// 年齢を入力しなかった（スキップした）ときのおすすめ
const DEFAULT_RECOMMENDATIONS = [1, 8, 14, 16, 28];
