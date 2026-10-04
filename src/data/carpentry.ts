export type ProjectPhoto = {
  src: string;
  alt: string;
  /** Intrinsic width / height, used to pick a sensible frame. */
  ratio: "landscape" | "portrait";
};

export type CarpentryProject = {
  slug: string;
  title: string;
  kind: string;
  summary: string;
  cover: ProjectPhoto;
  photos: ProjectPhoto[];
  /** Set when we have a photo of the space before we started. */
  before?: ProjectPhoto;
};

const p = (src: string, alt: string, ratio: ProjectPhoto["ratio"]): ProjectPhoto => ({ src, alt, ratio });

export const CARPENTRY_PROJECTS: CarpentryProject[] = [
  {
    slug: "spa-pergola",
    title: "Spa pergola",
    kind: "Pergola",
    summary:
      "A timber-framed pergola with a clear roof over a swim spa, set into a bush block. Built to let the light through and keep the leaves out.",
    cover: p("/images/carpentry/spa-pergola.jpg", "Timber pergola with a clear roof sheltering a swim spa in a bush garden", "landscape"),
    photos: [p("/images/carpentry/spa-pergola.jpg", "Timber pergola with a clear roof sheltering a swim spa in a bush garden", "landscape")],
  },
  {
    slug: "deck-and-patio-roof",
    title: "Hardwood deck and patio roof",
    kind: "Deck",
    summary:
      "We replaced a tired old deck and screen with a new hardwood deck and a clear patio roof on steel posts, so the back of the house gets used all year.",
    cover: p("/images/carpentry/deck-patio-roof-after.jpg", "New hardwood deck with a clear patio roof on a green weatherboard house", "portrait"),
    before: p("/images/carpentry/deck-patio-roof-before.jpg", "The same house before, with a weathered deck and a slatted screen", "portrait"),
    photos: [p("/images/carpentry/deck-patio-roof-after.jpg", "New hardwood deck with a clear patio roof on a green weatherboard house", "portrait")],
  },
  {
    slug: "peppers-veranda",
    title: "Pepper's veranda",
    kind: "Veranda",
    summary:
      "Rough-sawn timber posts and hardwood rafters under a light roof. A shady place for the pot plants and the morning coffee.",
    cover: p("/images/carpentry/veranda-after.jpg", "Timber veranda with rough-sawn posts across the front of a house with solar panels", "landscape"),
    before: p("/images/carpentry/veranda-before.jpg", "The same house before, with a small white-post shelter and a reed screen", "portrait"),
    photos: [
      p("/images/carpentry/veranda-after.jpg", "Timber veranda with rough-sawn posts across the front of a house with solar panels", "landscape"),
      p("/images/carpentry/veranda-rafters.jpg", "Looking along the veranda's hardwood rafters", "portrait"),
    ],
  },
  {
    slug: "shed-and-alfresco",
    title: "Shed with covered alfresco",
    kind: "Shed",
    summary:
      "A steel-clad shed with a roller door, glass sliders and a covered slab along the side. Workshop at one end, outdoor room at the other.",
    cover: p("/images/carpentry/shed-alfresco.jpg", "A finished dark steel shed with a covered alfresco and glass sliders", "portrait"),
    photos: [
      p("/images/carpentry/shed-alfresco.jpg", "A finished dark steel shed with a covered alfresco and glass sliders", "portrait"),
      p("/images/carpentry/shed-front.jpg", "The finished shed among the trees", "portrait"),
    ],
  },
  {
    slug: "live-edge-benchtop",
    title: "Live-edge kitchen island",
    kind: "Custom timber",
    summary:
      "A kitchen island finished with a single live-edge slab, oiled to bring out the grain. Made to be leaned on, cooked on and lived with.",
    cover: p("/images/carpentry/live-edge-benchtop.jpg", "Close-up of a live-edge timber benchtop on a kitchen island", "portrait"),
    photos: [
      p("/images/carpentry/live-edge-benchtop.jpg", "Close-up of a live-edge timber benchtop on a kitchen island", "portrait"),
      p("/images/carpentry/live-edge-island.jpg", "The live-edge island in the kitchen", "portrait"),
    ],
  },
  {
    slug: "covered-outdoor-area",
    title: "Covered outdoor area",
    kind: "Patio roof",
    summary:
      "A steel-framed patio cover with clear sheeting that turned a bare slab into an all-weather spot to eat outside.",
    cover: p("/images/carpentry/covered-outdoor-area.jpg", "Long covered patio with a clear roof beside a house", "landscape"),
    photos: [p("/images/carpentry/covered-outdoor-area.jpg", "Long covered patio with a clear roof beside a house", "landscape")],
  },
  {
    slug: "resort-deck",
    title: "Resort boardwalk",
    kind: "Deck",
    summary: "A long hardwood boardwalk winding through the garden of a local resort.",
    cover: p("/images/projects/deck for resort.jpg", "Hardwood boardwalk through a lush resort garden", "landscape"),
    photos: [p("/images/projects/deck for resort.jpg", "Hardwood boardwalk through a lush resort garden", "landscape")],
  },
  {
    slug: "pergola-privacy-screen",
    title: "Pergola and privacy screen",
    kind: "Pergola",
    summary: "A white pergola paired with a timber batten screen for shade and privacy.",
    cover: p("/images/projects/pergola and privacy screen.jpg", "White pergola above a timber batten privacy screen", "landscape"),
    photos: [p("/images/projects/pergola and privacy screen.jpg", "White pergola above a timber batten privacy screen", "landscape")],
  },
  {
    slug: "kitchen-renovation",
    title: "Kitchen renovation",
    kind: "Renovation",
    summary: "New cabinetry, benchtops and an island for a brighter, easier kitchen.",
    cover: p("/images/projects/kitchen renovation.jpg", "Renovated kitchen with white cabinets and a dark timber benchtop", "landscape"),
    photos: [p("/images/projects/kitchen renovation.jpg", "Renovated kitchen with white cabinets and a dark timber benchtop", "landscape")],
  },
  {
    slug: "laundry-benchtop",
    title: "Laundry benchtop",
    kind: "Renovation",
    summary: "A solid timber benchtop over the washer and dishwasher, with a tidy cabinet end.",
    cover: p("/images/projects/vanity renovation.jpg", "Timber benchtop installed over a laundry washer", "landscape"),
    photos: [p("/images/projects/vanity renovation.jpg", "Timber benchtop installed over a laundry washer", "landscape")],
  },
];

export const BEFORE_AFTER = CARPENTRY_PROJECTS.filter((x) => x.before);

/** What we build, grouped for the capabilities list. */
export const CARPENTRY_SERVICES = [
  { title: "Decks and boardwalks", body: "Hardwood and treated pine, new builds and re-decks." },
  { title: "Pergolas and verandas", body: "Timber or steel, open rafters or a clear roof." },
  { title: "Sheds and patio roofs", body: "Workshops, carports and covered outdoor areas." },
  { title: "Screens and fencing", body: "Batten screens, gates and garden fencing." },
  { title: "Custom timber", body: "Live-edge benchtops, shelving and one-off pieces." },
  { title: "Kitchens and laundries", body: "Cabinetry, benchtops and small renovations." },
];
