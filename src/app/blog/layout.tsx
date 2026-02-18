import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <div className="pt-16 md:pt-20">
        {children}
      </div>
      <Footer />
    </>
  );
}
