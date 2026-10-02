import { MobileBars, Rail } from "@/components/Nav";

/** The product shell: navigation rail on desktop, top and bottom bars on phones. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[232px_minmax(0,1fr)]">
      <Rail />
      <div className="min-w-0 overflow-x-clip">
        <MobileBars />
        <main className="mx-auto w-full max-w-[1500px] px-5 pt-5 pb-24 lg:px-9 lg:pt-8 lg:pb-12">{children}</main>
      </div>
    </div>
  );
}
