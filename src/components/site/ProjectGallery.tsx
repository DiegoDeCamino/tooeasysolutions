"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import type { CarpentryProject } from "@/data/carpentry";
import { cn } from "@/lib/cn";
import { ProjectLightbox } from "./ProjectLightbox";

/** Bento cell placement for the homepage selection, in order. */
const BENTO_CELLS = [
  "lg:col-span-4 lg:row-span-2",
  "lg:col-span-2 lg:row-span-2",
  "lg:col-span-2 lg:row-span-2",
  "lg:col-span-2 lg:row-span-2",
  "lg:col-span-2 lg:row-span-2",
];

export function ProjectGallery({
  projects,
  layout,
}: {
  projects: CarpentryProject[];
  layout: "bento" | "masonry";
}) {
  const [open, setOpen] = useState<CarpentryProject | null>(null);
  const close = useCallback(() => setOpen(null), []);

  return (
    <>
      {layout === "bento" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:auto-rows-[200px] lg:grid-cols-6 lg:gap-5">
          {projects.slice(0, BENTO_CELLS.length).map((project, i) => (
            <ProjectTile
              key={project.slug}
              project={project}
              onOpen={() => setOpen(project)}
              className={cn(BENTO_CELLS[i], i === 0 && "sm:col-span-2")}
              imageClassName={cn("aspect-[4/3] lg:aspect-auto lg:flex-1", i === 0 && "sm:aspect-[16/9]")}
              priority={i === 0}
              sizes={i === 0 ? "(min-width: 1024px) 66vw, 100vw" : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"}
            />
          ))}
        </div>
      ) : (
        <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
          {projects.map((project, i) => (
            <ProjectTile
              key={project.slug}
              project={project}
              onOpen={() => setOpen(project)}
              className="mb-5 break-inside-avoid"
              imageClassName={project.cover.ratio === "portrait" ? "aspect-[4/5]" : "aspect-[4/3]"}
              priority={i < 3}
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              showSummary
            />
          ))}
        </div>
      )}
      <ProjectLightbox project={open} onClose={close} />
    </>
  );
}

function ProjectTile({
  project,
  onOpen,
  className,
  imageClassName,
  priority,
  sizes,
  showSummary,
}: {
  project: CarpentryProject;
  onOpen: () => void;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  sizes: string;
  showSummary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "group flex w-full flex-col gap-3 text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-strong",
        className,
      )}
      aria-label={`View ${project.title}`}
    >
      <div className={cn("relative w-full overflow-hidden rounded-2xl bg-surface-2", imageClassName)}>
        <Image
          src={project.cover.src}
          alt={project.cover.alt}
          fill
          priority={priority}
          sizes={sizes}
          className="object-cover transition duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
        />
      </div>
      <div className="flex items-start justify-between gap-3 px-0.5">
        <div className="grid gap-0.5">
          <span className="font-display text-lg font-bold leading-snug text-ink">{project.title}</span>
          <span className="text-sm text-ink-2">
            {project.kind}
            {project.before ? ", with before photo" : null}
          </span>
          {showSummary && <span className="mt-1 text-[15px] leading-relaxed text-ink-2">{project.summary}</span>}
        </div>
        <ArrowUpRight
          size={20}
          className="mt-1 shrink-0 text-ink-2 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent-strong"
        />
      </div>
    </button>
  );
}
