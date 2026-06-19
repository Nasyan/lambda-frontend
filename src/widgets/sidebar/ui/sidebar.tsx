type SidebarProps = {
  instanceUuid: string;
};

export function Sidebar({ instanceUuid }: SidebarProps) {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-zinc-200 bg-white p-4 md:block">
      <div className="text-sm font-semibold text-zinc-950">Lambda CRM</div>
      <div className="mt-1 break-all text-xs text-zinc-500">{instanceUuid}</div>
      <nav className="mt-6 space-y-1 text-sm text-zinc-700">
        <a className="block rounded-md bg-zinc-100 px-3 py-2 text-zinc-950" href="#">
          Главная
        </a>
        <a className="block rounded-md px-3 py-2 hover:bg-zinc-100" href="#">
          Клиенты
        </a>
        <a className="block rounded-md px-3 py-2 hover:bg-zinc-100" href="#">
          Сделки
        </a>
      </nav>
    </aside>
  );
}
