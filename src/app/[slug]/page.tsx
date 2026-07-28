import ShopCustomerPortal from "./client-page";

export function generateStaticParams() {
  return [{ slug: "demo" }];
}

export default function Page({ params }: { params: Promise<{ slug: string }> }) {
  return <ShopCustomerPortal params={params} />;
}
