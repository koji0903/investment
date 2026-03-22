import { Metadata } from "next";

export const metadata: Metadata = {
  title: "日本株投資判断エンジン | 資産運用AIアドバイザー",
  description: "国内上場銘柄のテクニカル・ファンダメンタル・バリュエーションを統合分析し、最適な投資判断をサポートします。",
};

export default function StockJudgmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
