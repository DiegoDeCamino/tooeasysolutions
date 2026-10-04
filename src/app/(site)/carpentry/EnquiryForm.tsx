"use client";

import { useState, useTransition } from "react";
import Turnstile from "react-turnstile";
import { motion, useReducedMotion } from "motion/react";
import { Bath, Check, ChefHat, Fence, HelpCircle, LayoutPanelTop, Trees, Wrench } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Chips } from "@/components/ui/Chips";
import { PhotoPicker, type PickedPhoto } from "@/components/ui/Photos";
import { uploadPhotos } from "@/lib/upload";
import { prepareEnquiryUploads, submitEnquiry } from "./actions";

const CATEGORIES = [
  { value: "deck", label: "Deck", icon: <Trees className="size-4" /> },
  { value: "pergola", label: "Pergola or patio", icon: <LayoutPanelTop className="size-4" /> },
  { value: "kitchen", label: "Kitchen", icon: <ChefHat className="size-4" /> },
  { value: "bathroom", label: "Bathroom", icon: <Bath className="size-4" /> },
  { value: "fencing", label: "Fencing or screens", icon: <Fence className="size-4" /> },
  { value: "repairs", label: "Repairs", icon: <Wrench className="size-4" /> },
  { value: "other", label: "Something else", icon: <HelpCircle className="size-4" /> },
];
const TIMEFRAMES = ["As soon as possible", "In 1 to 3 months", "Later this year", "Just planning"];
const BUDGETS = ["Under $5k", "$5k to $15k", "$15k to $40k", "$40k plus", "Not sure yet"];

export function EnquiryForm({ turnstileSiteKey }: { turnstileSiteKey: string | null }) {
  const reduce = useReducedMotion();
  const [category, setCategory] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);
  const [suburb, setSuburb] = useState("");
  const [timeframe, setTimeframe] = useState<string | null>(null);
  const [budget, setBudget] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const errs: Record<string, string> = {};
    if (!category) errs.category = "Pick what you need";
    if (description.trim().length < 15) errs.description = "Tell us a bit more (at least a sentence or two)";
    if (suburb.trim().length < 2) errs.suburb = "Enter the suburb";
    if (name.trim().length < 2) errs.name = "Enter your name";
    if (!/^\S+@\S+\.\S+$/.test(email)) errs.email = "Enter a valid email";
    if (phone.trim().length < 6) errs.phone = "Enter a phone number";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    start(async () => {
      let draftId = crypto.randomUUID();
      let paths: string[] = [];
      if (photos.length) {
        setProgress(`Uploading photos 0 of ${photos.length}`);
        const prep = await prepareEnquiryUploads(photos.length);
        if (prep.ok) {
          draftId = prep.data.draftId;
          paths = await uploadPhotos(prep.data.targets, photos, (d, total) => setProgress(`Uploading photos ${d} of ${total}`));
        }
      }
      setProgress("Sending");
      const res = await submitEnquiry({
        draftId,
        photoPaths: paths,
        category: category!,
        description,
        suburb,
        timeframe,
        budget,
        name,
        email,
        phone,
        token,
      });
      setProgress(null);
      if (res.ok) setDone(res.data.ref);
      else {
        setFormError(res.error);
        if (res.fieldErrors) setErrors(res.fieldErrors);
      }
    });
  };

  if (done) {
    return (
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid content-start justify-items-start gap-4 rounded-2xl border border-line bg-surface p-8 shadow-soft"
      >
        <span className="flex size-14 items-center justify-center rounded-full bg-accent-strong text-accent-ink">
          <Check className="size-7" strokeWidth={3} />
        </span>
        <h3 className="text-2xl font-extrabold">Thanks {name.split(" ")[0]}, we&apos;ve got it</h3>
        <p className="text-ink-2">
          We&apos;ll look over your details and call you, usually within one business day. Your reference is{" "}
          <strong className="tabular text-ink">{done}</strong>.
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-6 rounded-2xl border border-line bg-surface p-5 shadow-soft md:p-7">
      <div className="grid gap-3">
        <span className="font-extrabold">What kind of job?</span>
        <Chips label="Job type" value={category} onChange={setCategory} options={CATEGORIES} />
        {errors.category && <p className="text-[13px] font-semibold text-danger">{errors.category}</p>}
      </div>

      <Field label="Tell us about it" hint="Size, materials you like, what's there now, anything that matters to you." error={errors.description}>
        {(p) => (
          <Textarea
            {...p}
            rows={5}
            placeholder="e.g. We'd like a 6 by 4 metre merbau deck off the back sliding door, about 60cm off the ground."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        )}
      </Field>

      <div className="grid gap-2">
        <span className="text-sm font-bold">
          Photos <span className="font-semibold text-ink-2">(optional, but they help a lot)</span>
        </span>
        <PhotoPicker value={photos} onChange={setPhotos} max={10} label="Add photos of the space" />
      </div>

      <Field label="Suburb" error={errors.suburb}>
        {(p) => <Input {...p} autoComplete="address-level2" value={suburb} onChange={(e) => setSuburb(e.target.value)} />}
      </Field>

      <div className="grid gap-3">
        <span className="text-sm font-bold">When are you hoping to start?</span>
        <Chips label="Timeframe" value={timeframe} onChange={setTimeframe} options={TIMEFRAMES.map((v) => ({ value: v, label: v }))} />
      </div>

      <div className="grid gap-3">
        <span className="text-sm font-bold">
          Rough budget <span className="font-semibold text-ink-2">(optional)</span>
        </span>
        <Chips label="Budget" value={budget} onChange={setBudget} options={BUDGETS.map((v) => ({ value: v, label: v }))} />
      </div>

      <div className="grid gap-4 border-t border-line pt-6 sm:grid-cols-2">
        <Field label="Your name" error={errors.name} className="sm:col-span-2">
          {(p) => <Input {...p} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />}
        </Field>
        <Field label="Email" error={errors.email}>
          {(p) => <Input {...p} type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />}
        </Field>
        <Field label="Mobile" error={errors.phone}>
          {(p) => <Input {...p} type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />}
        </Field>
      </div>

      {turnstileSiteKey && <Turnstile sitekey={turnstileSiteKey} theme="light" onVerify={setToken} />}
      {formError && (
        <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 font-bold text-danger">
          {formError}
        </p>
      )}
      <Button type="submit" size="lg" loading={pending} className="sm:justify-self-start">
        {progress ?? "Send enquiry"}
      </Button>
    </form>
  );
}
