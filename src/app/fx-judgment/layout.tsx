import { Metadata } from "next";

export const metadata: Metadata = {
  title: "FX 投資判断エンジン | 資産運用アシスタント",
  description: "全通貨ペアに対するテクニカル・ファンダメンタル・スワップ統合分析エンジン",
};

export default function FXJudgmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
