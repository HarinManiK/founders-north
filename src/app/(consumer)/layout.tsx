import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function ConsumerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main style={{ minHeight: "calc(100vh - 64px - 200px)" }}>
        {children}
      </main>
      <Footer />
    </>
  );
}
