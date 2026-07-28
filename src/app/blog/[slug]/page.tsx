import BlogPost from "./client-page";

export function generateStaticParams() {
  return [{ slug: "zero-knowledge-print" }];
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  return <BlogPost params={resolvedParams} />;
}
