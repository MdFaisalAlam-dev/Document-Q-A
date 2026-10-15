"use client";

import { useState } from "react";
import BootIntro from "@/components/intro/BootIntro";
import Workspace from "@/components/workspace/Workspace";

export default function Home() {
  const [showIntro, setShowIntro] = useState(true);

  return (
    <main className="min-h-screen bg-background text-foreground">
      {showIntro ? (
        <BootIntro onComplete={() => setShowIntro(false)} />
      ) : (
        <Workspace />
      )}
    </main>
  );
}