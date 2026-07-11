import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { type ReactNode } from "react";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },

      // ── Primary SEO ──────────────────────────────────────────────────
      { title: "Akash Yaduwanshi | AI Engineer Portfolio | Machine Learning in Indore" },
      { name: "description", content: "Explore the portfolio of Akash Yaduwanshi, an AI Engineer and ML Researcher based in Indore. Specializing in LLMs, machine learning, multi-agent systems, and autonomous AI pipelines." },
      { name: "keywords", content: "Akash Yaduwanshi, AI Engineer Portfolio, Akash Yaduwanshi Portfolio, Portfolio in Indore, AI Engineer in Indore, ML Engineer in Indore, Machine Learning in Indore, LLM Engineer, Multi-Agent Systems, AI Researcher, Tech Portfolio, Software Developer in Indore, Web Developer, Programmer, Coder, React Developer, Python Developer, Freelance Developer Indore, IT Student Indore, Software Engineer Portfolio" },
      { name: "author", content: "Akash Yaduwanshi" },
      { name: "robots", content: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" },
      { name: "language", content: "English" },
      { name: "revisit-after", content: "30 days" },
      { name: "theme-color", content: "#B026FF" },

      // ── Canonical ────────────────────────────────────────────────────
      { property: "canonical", content: "https://akashyaduwanshiportfolio.vercel.app/" },

      // ── Open Graph (LinkedIn, Facebook, WhatsApp previews) ───────────
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://akashyaduwanshiportfolio.vercel.app/" },
      { property: "og:title", content: "Akash Yaduwanshi | AI Engineer Portfolio | Machine Learning in Indore" },
      { property: "og:description", content: "Explore the portfolio of Akash Yaduwanshi, an AI Engineer and ML Researcher based in Indore. Specializing in LLMs, machine learning, multi-agent systems, and autonomous AI pipelines." },
      { property: "og:image", content: "https://akashyaduwanshiportfolio.vercel.app/assets/phantmos_ui.png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "Akash Yaduwanshi Portfolio — AI Engineer" },
      { property: "og:site_name", content: "Akash Yaduwanshi" },
      { property: "og:locale", content: "en_US" },

      // ── Twitter / X Card ─────────────────────────────────────────────
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@unshakensoul17" },
      { name: "twitter:creator", content: "@unshakensoul17" },
      { name: "twitter:title", content: "Akash Yaduwanshi | AI Engineer Portfolio | Machine Learning in Indore" },
      { name: "twitter:description", content: "Explore the portfolio of Akash Yaduwanshi, an AI Engineer and ML Researcher based in Indore. Specializing in LLMs, machine learning, multi-agent systems, and autonomous AI pipelines." },
      { name: "twitter:image", content: "https://akashyaduwanshiportfolio.vercel.app/assets/phantmos_ui.png" },
      { name: "twitter:image:alt", content: "Akash Yaduwanshi Portfolio" },

      // ── JSON-LD Structured Data (Person schema) ──────────────────────
      {
        "script:ld+json": JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Person",
          "name": "Akash Yaduwanshi",
          "url": "https://akashyaduwanshiportfolio.vercel.app/",
          "image": "https://akashyaduwanshiportfolio.vercel.app/assets/phantmos_ui.png",
          "jobTitle": "AI Engineer",
          "description": "AI Engineer and ML Researcher specializing in LLMs, multi-agent systems, and autonomous AI pipelines.",
          "email": "aakashyaduwanshi0470@gmail.com",
          "sameAs": [
            "https://github.com/unshakensoul17",
            "https://linkedin.com/in/akash-yaduwanshi-902a3b352"
          ],
          "knowsAbout": [
            "Artificial Intelligence",
            "Machine Learning",
            "Large Language Models",
            "Multi-Agent Systems",
            "Python",
            "React",
            "TypeScript",
            "Three.js"
          ],
          "address": {
            "@type": "PostalAddress",
            "addressLocality": "Indore",
            "addressRegion": "Madhya Pradesh",
            "addressCountry": "IN"
          }
        })
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "canonical", href: "https://akashyaduwanshiportfolio.vercel.app/" },
      { rel: "manifest", href: "/site.webmanifest" },
      { rel: "icon", href: "/assets/phantmos_ui.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/assets/phantmos_ui.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
