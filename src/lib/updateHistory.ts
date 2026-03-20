export interface UpdateLog {
  version: string;
  date: string;
  title: string;
  description: string;
  tag: "New" | "Fix" | "Improvement";
}

export const APP_VERSION = "2.5.0";

export const UPDATE_HISTORY: UpdateLog[] = [
  {
    version: "2.5.0",
    date: "2026-03-20",
    title: "投資AI機能の強化",
    description: "売買ルールの自動化、ポジションサイズ管理、勝ちパターン分析を実装。感情を排除した論理的な投資をサポートします。",
    tag: "New"
  },
  {
    version: "2.4.0",
    date: "2026-03-19",
    title: "リスク管理パッケージ",
    description: "最大損失制限、損切りライン、ドローダウン監視機能を追加。資産保全を自動化しました。",
    tag: "New"
  },
  {
    version: "2.3.0",
    date: "2026-03-18",
    title: "PWA対応 & モバイル最適化",
    description: "ホーム画面追加、オフライン対応、タッチ操作の改善を行い、モバイルでの快適性を向上させました。",
    tag: "Improvement"
  },
  {
    version: "2.2.0",
    date: "2026-03-17",
    title: "戦略テンプレート機能",
    description: "コア・サテライト戦略など、プロの資産配分をワンクリックで適用可能に。レポート生成も強化しました。",
    tag: "New"
  },
  {
    version: "2.1.0",
    date: "2026-03-16",
    title: "証券口座連携（デモ）",
    description: "SBI証券、楽天証券などの口座情報をシミュレートして管理できるようになりました。",
    tag: "New"
  }
];
