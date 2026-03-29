"use client";

const INTEGRATIONS = [
  { name: "Moodle",           domain: "moodle.org" },
  { name: "Blackboard",       domain: "blackboard.com" },
  { name: "Canvas",           domain: "instructure.com" },
  { name: "TopHat",           domain: "tophat.com" },
  { name: "D2L Brightspace",  domain: "d2l.com" },
  { name: "Google Classroom", domain: "classroom.google.com" },
  { name: "Schoology",        domain: "schoology.com" },
  { name: "Gradescope",       domain: "gradescope.com" },
  { name: "Sakai",            domain: "sakailms.org" },
  { name: "PowerSchool",      domain: "powerschool.com" },
  { name: "Turnitin",         domain: "turnitin.com" },
  { name: "Ellucian Banner",  domain: "ellucian.com" },
];

const TRACK = [...INTEGRATIONS, ...INTEGRATIONS];

export function LandingIntegrations() {
  return (
    <section className="relative overflow-hidden border-y border-espresso-900/40 bg-espresso-950/30 py-5">
      {/* Fade edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-28 bg-gradient-to-r from-shadow-grey-950 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-28 bg-gradient-to-l from-shadow-grey-950 to-transparent" />

      <p className="mb-4 text-center font-mono text-[10px] font-semibold uppercase tracking-widest text-espresso-700">
        Integrates with your campus platforms
      </p>

      <div className="flex overflow-hidden">
        <div className="flex animate-integrations-marquee gap-8 pr-8 will-change-transform hover:[animation-play-state:paused]">
          {TRACK.map(({ name, domain }, i) => (
            <div
              key={`${name}-${i}`}
              className="flex shrink-0 items-center gap-3 rounded-xl border border-espresso-800/30 bg-espresso-950/50 px-5 py-3"
            >
              <img
                src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
                alt={name}
                width={22}
                height={22}
                className="h-[22px] w-[22px] rounded-sm object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
              <span className="whitespace-nowrap font-sans text-sm font-medium text-almond-cream-600">
                {name}
              </span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes integrations-marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-integrations-marquee {
          animation: integrations-marquee 36s linear infinite;
        }
      `}</style>
    </section>
  );
}
