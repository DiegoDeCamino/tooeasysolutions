// Create (or update) a staff account without email confirmation.
// Usage:
//   pnpm user:create --email diego@example.com --password 'secret123' --name "Diego" --role admin --skills cleaning,carpentry
import { createClient } from "@supabase/supabase-js";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    email: { type: "string" },
    password: { type: "string" },
    name: { type: "string", default: "" },
    role: { type: "string", default: "worker" },
    skills: { type: "string", default: "cleaning,carpentry" },
    phone: { type: "string", default: "" },
    locale: { type: "string", default: "en" },
  },
});

if (!values.email || !values.password) {
  console.error("--email and --password are required");
  process.exit(1);
}
if (!["admin", "supervisor", "worker"].includes(values.role)) {
  console.error("--role must be admin, supervisor or worker");
  process.exit(1);
}

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const email = values.email.toLowerCase();
let userId;
const { data: created, error } = await admin.auth.admin.createUser({
  email,
  password: values.password,
  email_confirm: true,
  user_metadata: { full_name: values.name },
});
if (error) {
  if (!/already|registered|exists/i.test(error.message)) throw error;
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const existing = list.users.find((u) => u.email === email);
  if (!existing) throw error;
  userId = existing.id;
  await admin.auth.admin.updateUserById(userId, { password: values.password });
  console.log("User existed, password updated");
} else {
  userId = created.user.id;
}

const skills = values.skills.split(",").map((s) => s.trim()).filter(Boolean);
const { error: profileError } = await admin
  .from("profiles")
  .update({ full_name: values.name, role: values.role, skills, phone: values.phone || null, locale: values.locale, active: true })
  .eq("id", userId);
if (profileError) throw profileError;

console.log(`OK ${email} is ${values.role} (${skills.join(", ") || "no skills"})`);
