import WidgetPageClient from "@/components/WidgetPageClient";

export default async function WidgetPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const title = typeof params.title === "string" ? params.title : "AIチャット";
  const color = typeof params.color === "string" ? params.color : "#2563eb";

  return <WidgetPageClient title={title} color={color} />;
}
