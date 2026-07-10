import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const Experience = lazy(() => import("@/components/axon/Experience"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AXON — AI Engineer" },
      {
        name: "description",
        content:
          "Travel through the architecture of an AI engineer's mind. An interactive cinematic neural experience.",
      },
      { property: "og:title", content: "AXON — AI Engineer" },
      {
        property: "og:description",
        content:
          "An interactive cinematic experience. Not a portfolio — a living neuron.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-black" />}>
      <Experience />
    </Suspense>
  );
}
