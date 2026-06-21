import Link from "next/link";

const navigationItems = [
  { href: "/tables", label: "Tables" },
  { href: "/triggers", label: "Triggers" },
  { href: "/analytics", label: "Analytics" },
  { href: "/settings", label: "Settings" },
  { href: "/profile", label: "Profile" },
];

export function AppSidebar() {
  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-gray-200 bg-white p-4 md:min-h-screen md:w-56 md:border-b-0 md:border-r">
      <Link href="/" className="mb-4 text-lg font-bold text-gray-950">
        Lambda
      </Link>
      <nav className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">
        {navigationItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-950"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
