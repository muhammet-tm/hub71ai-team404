"use client";

import { Printer } from "@phosphor-icons/react";

/** Opens the browser's print dialog, where "Save as PDF" is a destination. */
export default function PrintButton() {
  return (
    <button onClick={() => window.print()} className="btn btn-stamp px-5 py-3 text-[14px] print:hidden">
      <Printer size={17} weight="bold" />
      Print or save as PDF
    </button>
  );
}
