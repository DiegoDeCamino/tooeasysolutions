export const metadata = { title: "FAQ — Too Easy Solutions" };

const faqs = [
  {
    q: "What areas do you service?",
    a: "We service from Perth down to Augusta across the South West of Western Australia.",
  },
  {
    q: "How is the price for a delivery calculated?",
    a: "Pricing is based on distance, size/weight, and service urgency. Submit a quick quote for an accurate estimate.",
  },
  {
    q: "What items can't you transport?",
    a: "We can't transport illegal items and some hazardous goods. For Dangerous Goods, please declare them in the form.",
  },
  {
    q: "Are my items insured during a move?",
    a: "Yes, we can provide cover options upon request.",
  },
  {
    q: "What are your operating hours?",
    a: "We're available 7 days with flexible scheduling for special requests.",
  },
];

export default function FAQPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold">Frequently Asked Questions</h1>
      <ul className="space-y-4">
        {faqs.map((f, idx) => (
          <li key={idx} className="card p-4">
            <h3 className="font-bold">{f.q}</h3>
            <p className="text-black/70">{f.a}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

