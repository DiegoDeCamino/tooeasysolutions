"use client";

import Image from "next/image";
import { useState } from "react";
import { X, ZoomIn } from "lucide-react";

const projects = [
  {
    imageSrc: "/images/projects/deck for resort.jpg",
    title: "Deck for Resort",
    description:
      "Custom deck construction for resort property. Professional carpentry work with quality materials and attention to detail. This project showcases our expertise in outdoor construction, creating durable and beautiful spaces for guests to enjoy.",
  },
  {
    imageSrc: "/images/projects/kitchen renovation.jpg",
    title: "Kitchen Renovation",
    description:
      "Complete kitchen remodeling and upgrade. Modern design with functional improvements for everyday use. We transformed this space with new cabinetry, countertops, and layout optimization to create a kitchen that's both beautiful and practical.",
  },
  {
    imageSrc: "/images/projects/pergola and privacy screen.jpg",
    title: "Pergola and Privacy Screen",
    description:
      "Outdoor living space enhancement. Beautiful pergola with integrated privacy screen for comfort and style. This project combines functionality with aesthetics, providing shade and privacy while adding value to the property.",
  },
  {
    imageSrc: "/images/projects/vanity renovation.jpg",
    title: "Vanity Renovation",
    description:
      "Bathroom vanity installation and renovation. Clean lines and quality finishes for a fresh look. We carefully selected materials and fixtures to create a modern, functional bathroom space that stands the test of time.",
  },
  {
    imageSrc: "/images/projects/removal.jpg",
    title: "Removal Service",
    description:
      "Professional furniture and item removal. Careful handling and efficient transport of your belongings. Our team ensures safe loading, secure transport, and proper unloading of all items, treating your possessions with the utmost care.",
  },
  {
    imageSrc: "/images/projects/removal 2.jpg",
    title: "Removal Service",
    description:
      "Efficient and careful removal services. We treat your items with respect and get the job done right. From single items to full house moves, we have the experience and equipment to handle any removal job across the South West.",
  },
];

export default function ProjectsPage() {
  const [selectedProject, setSelectedProject] = useState<number | null>(null);

  return (
    <div className="space-y-8">
      <section className="text-center space-y-3">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-teal to-brand-orange">
          Our Projects
        </h1>
        <p className="text-lg sm:text-xl text-black/70 max-w-2xl mx-auto">
          Quality work we&apos;re proud to deliver. From carpentry to
          renovations, see what we can do for you.
        </p>
        <p className="text-sm text-brand-teal font-semibold flex items-center justify-center gap-2">
          <ZoomIn size={16} />
          Click any project to view details
        </p>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project, index) => (
          <ProjectCard
            key={index}
            {...project}
            onClick={() => setSelectedProject(index)}
          />
        ))}
      </section>

      <section className="card p-6 sm:p-8 text-center space-y-4">
        <h2 className="text-2xl sm:text-3xl font-bold">
          Ready to Start Your Project?
        </h2>
        <p className="text-black/70 max-w-2xl mx-auto">
          Whether it&apos;s carpentry, maintenance, renovals, or removals —
          we&apos;re here to help. Get in touch for a quick quote today!
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <a href="/" className="btn-primary">
            Get a Quote
          </a>
          <a href="/contact" className="btn-secondary">
            Contact Us
          </a>
        </div>
      </section>

      {selectedProject !== null && (
        <ProjectModal
          project={projects[selectedProject]}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </div>
  );
}

function ProjectCard({
  imageSrc,
  title,
  description,
  onClick,
}: {
  imageSrc: string;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="card overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group text-left w-full cursor-pointer"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={imageSrc}
          alt={title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 flex items-center justify-center">
          <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-75 group-hover:scale-100">
            <ZoomIn className="text-brand-teal" size={24} />
          </div>
        </div>
      </div>
      <div className="p-5 space-y-2">
        <h3 className="font-bold text-xl text-brand-charcoal">{title}</h3>
        <p className="text-sm text-black/70 leading-relaxed line-clamp-2">
          {description}
        </p>
        <p className="text-xs text-brand-teal font-semibold pt-1">
          Click to view more →
        </p>
      </div>
    </button>
  );
}

function ProjectModal({
  project,
  onClose,
}: {
  project: { imageSrc: string; title: string; description: string };
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="card max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-black/10 px-4 sm:px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl sm:text-3xl font-bold text-brand-charcoal">
            {project.title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-brand-cream rounded-lg transition-colors"
            aria-label="Close"
          >
            <X size={24} className="text-brand-charcoal" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl">
            <Image
              src={project.imageSrc}
              alt={project.title}
              fill
              className="object-cover"
              quality={95}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-1 w-12 bg-gradient-to-r from-brand-teal to-brand-orange rounded-full" />
              <h3 className="text-lg font-bold text-brand-charcoal">
                Project Details
              </h3>
            </div>
            <p className="text-base text-black/80 leading-relaxed">
              {project.description}
            </p>
          </div>

          <div className="pt-4 border-t border-black/10 flex flex-col sm:flex-row gap-3">
            <a href="/" className="btn-primary w-full sm:w-auto">
              Get a Similar Quote
            </a>
            <a href="/contact" className="btn-secondary w-full sm:w-auto">
              Contact Us
            </a>
            <button
              onClick={onClose}
              className="px-5 py-2.5 font-semibold text-brand-charcoal hover:bg-brand-cream rounded-lg transition-colors w-full sm:w-auto"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
