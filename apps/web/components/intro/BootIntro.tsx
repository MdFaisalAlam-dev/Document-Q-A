"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

type BootIntroProps = {
  onComplete: () => void;
};

const bootStages = [
  "Initializing document engine",
  "Loading retrieval system",
  "Connecting vector layer",
  "Preparing language model",
  "Verifying knowledge pipeline",
  "System ready",
];

export default function BootIntro({ onComplete }: BootIntroProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  const eyebrowRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);

  const progressRef = useRef<HTMLDivElement>(null);
  const progressValueRef = useRef<HTMLSpanElement>(null);
  const statusRef = useRef<HTMLSpanElement>(null);

  const enterRef = useRef<HTMLButtonElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const eyebrow = eyebrowRef.current;
    const title = titleRef.current;
    const description = descriptionRef.current;
    const progress = progressRef.current;
    const progressValue = progressValueRef.current;
    const status = statusRef.current;
    const enter = enterRef.current;
    const footer = footerRef.current;

    if (
      !root ||
      !eyebrow ||
      !title ||
      !description ||
      !progress ||
      !progressValue ||
      !status ||
      !enter ||
      !footer
    ) {
      return;
    }

    const ctx = gsap.context(() => {
      gsap.set(eyebrow, {
        opacity: 0,
        y: 15,
      });

      gsap.set(title, {
        opacity: 0,
        y: 35,
        filter: "blur(12px)",
      });

      gsap.set(description, {
        opacity: 0,
        y: 20,
      });

      gsap.set(enter, {
        opacity: 0,
        y: 20,
        pointerEvents: "none",
      });

      gsap.set(footer, {
        opacity: 0,
      });

      gsap.set(progress, {
        width: "0%",
      });

      const tl = gsap.timeline();

      tl.to(eyebrow, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: "power2.out",
      })
        .to(title, {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.9,
          ease: "power3.out",
        })
        .to(
          description,
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            ease: "power2.out",
          },
          "-=0.5",
        )
        .to(progress, {
          width: "18%",
          duration: 0.5,
          ease: "power2.out",
          onUpdate: () => {
            progressValue.textContent = "18%";
            status.textContent = bootStages[0];
          },
        })
        .to(progress, {
          width: "37%",
          duration: 0.5,
          ease: "power2.out",
          onUpdate: () => {
            progressValue.textContent = "37%";
            status.textContent = bootStages[1];
          },
        })
        .to(progress, {
          width: "55%",
          duration: 0.5,
          ease: "power2.out",
          onUpdate: () => {
            progressValue.textContent = "55%";
            status.textContent = bootStages[2];
          },
        })
        .to(progress, {
          width: "73%",
          duration: 0.5,
          ease: "power2.out",
          onUpdate: () => {
            progressValue.textContent = "73%";
            status.textContent = bootStages[3];
          },
        })
        .to(progress, {
          width: "89%",
          duration: 0.5,
          ease: "power2.out",
          onUpdate: () => {
            progressValue.textContent = "89%";
            status.textContent = bootStages[4];
          },
        })
        .to(progress, {
          width: "100%",
          duration: 0.6,
          ease: "power2.out",
          onUpdate: () => {
            progressValue.textContent = "100%";
            status.textContent = bootStages[5];
          },
        })
        .to(
          enter,
          {
            opacity: 1,
            y: 0,
            pointerEvents: "auto",
            duration: 0.5,
            ease: "power2.out",
          },
          "-=0.2",
        )
        .to(
          footer,
          {
            opacity: 1,
            duration: 0.4,
          },
          "-=0.3",
        );
    }, root);

    return () => ctx.revert();
  }, []);

  const handleEnter = () => {
    const root = rootRef.current;

    if (!root) {
      onComplete();
      return;
    }

    gsap.to(root, {
      opacity: 0,
      scale: 1.015,
      filter: "blur(8px)",
      duration: 0.7,
      ease: "power3.inOut",
      onComplete,
    });
  };

  return (
    <section
      ref={rootRef}
      className="fixed inset-0 z-50 flex min-h-screen items-center justify-center overflow-hidden bg-background px-5 py-8 text-foreground sm:px-8"
    >
      {/* Decorative system rings */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-105 w-105 -translate-x-1/2 -translate-y-1/2 rounded-full border border-foreground/[0.07]" />

      <div className="pointer-events-none absolute left-1/2 top-1/2 h-155 w-155 -translate-x-1/2 -translate-y-1/2 rounded-full border border-foreground/4.5" />

      {/* Main shell */}
      <div className="relative z-10 flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col justify-between">
        {/* Header */}
        <div
          ref={eyebrowRef}
          className="flex items-center justify-between border-b border-foreground/15 pb-4 font-mono text-[10px] uppercase tracking-[0.28em] text-muted sm:text-xs"
        >
          <span>Document QnA</span>

          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
            Boot / 01
          </span>
        </div>

        {/* Hero */}
        <div className="w-full max-w-4xl">
          <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.28em] text-muted sm:text-xs">
            AI Document Intelligence
          </p>

          <h1
            ref={titleRef}
            className="max-w-4xl text-[clamp(3.5rem,9vw,8.5rem)] font-black uppercase leading-[0.82] tracking-[-0.065em]"
          >
            Document
            <br />
            <span className="text-muted">QnA</span>
          </h1>

          <p
            ref={descriptionRef}
            className="mt-7 max-w-xl text-sm leading-7 text-muted sm:text-base"
          >
            Retrieval-augmented intelligence for searching, understanding,
            and querying your documents.
          </p>
        </div>

        {/* Bottom system panel */}
        <div className="w-full">
          <div className="border border-foreground/20 bg-background/70 p-4 backdrop-blur-sm sm:p-5">
            <div className="mb-3 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.25em] sm:text-[10px]">
              <span>System Status</span>

              <span ref={progressValueRef}>0%</span>
            </div>

            <div className="h-2 w-full overflow-hidden bg-foreground/10">
              <div
                ref={progressRef}
                className="h-full bg-foreground"
              />
            </div>

            <div className="mt-3 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-muted sm:text-[10px]">
              <span className="h-1.5 w-1.5 animate-pulse bg-foreground" />

              <span ref={statusRef}>Starting system</span>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <button
              ref={enterRef}
              type="button"
              onClick={handleEnter}
              className="border border-foreground px-6 py-3 font-mono text-[10px] uppercase tracking-[0.25em] transition-all duration-300 hover:bg-foreground hover:text-background sm:px-7 sm:text-xs"
            >
              Enter System
            </button>

            <div
              ref={footerRef}
              className="hidden font-mono text-[9px] uppercase tracking-[0.2em] text-muted sm:block"
            >
              Local Instance // v1.0
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}