import { NavLink } from "react-router-dom";

const TABS = [
  { to: "/", label: "OVERSIKT", end: true },
  { to: "/strength", label: "STYRKE" },
  { to: "/running", label: "LØPING" },
  { to: "/measure", label: "KROPP" },
  { to: "/settings", label: "INNST." },
];

export function NavBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-panel border-t border-hair flex pb-[env(safe-area-inset-bottom,0px)] z-10">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            `flex-1 text-center py-3 font-mono text-[10.5px] tracking-widest ${
              isActive ? "text-amber border-t-2 border-amber -mt-px" : "text-tertiary"
            }`
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
