"use client";

import { IconUser } from "@mirohq/design-system-icons";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  "Confirmed":    { bg: "#dcfce7", text: "#166534" },
  "Maybe":        { bg: "#fef9c3", text: "#854d0e" },
  "Can't attend": { bg: "#f3f4f6", text: "#4b5563" },
};

const TICKET_COLORS: Record<string, { bg: string; text: string }> = {
  "Speaker":  { bg: "#f3e8ff", text: "#6b21a8" },
  "VIP":      { bg: "#fef3c7", text: "#92400e" },
  "General":  { bg: "#dbeafe", text: "#1e40af" },
  "Press":    { bg: "#ccfbf1", text: "#115e59" },
  "Staff":    { bg: "#f3f4f6", text: "#374151" },
};

const ATTENDEES: {
  name: string;
  avatar?: string;
  initials: string;
  title: string;
  company: string;
  status: string;
  ticket: string;
}[] = [
  { name: "Carla Mendes",     avatar: "/avatars/keynote-Carla.png", initials: "CM", title: "Chief People Officer",       company: "Lattice",            status: "Confirmed",    ticket: "Speaker"  },
  { name: "Lisa Park",        avatar: "/avatars/keynote-Lisa.png",  initials: "LP", title: "VP Engineering",              company: "Figma",              status: "Confirmed",    ticket: "Speaker"  },
  { name: "Nina Strauss",     avatar: "/avatars/keynote-Nina.png",  initials: "NS", title: "Head of Remote Work",         company: "Dropbox",            status: "Confirmed",    ticket: "Speaker"  },
  { name: "Tom Reyes",        avatar: "/avatars/keynote-Tom.png",   initials: "TR", title: "Future of Work Lead",         company: "Microsoft",          status: "Confirmed",    ticket: "Speaker"  },
  { name: "Marcus Webb",      avatar: "/avatars/marcus-webb.png",   initials: "MW", title: "Head of Partnerships",        company: "Notion",             status: "Confirmed",    ticket: "VIP"      },
  { name: "Sofia Andersson",  avatar: "/avatars/Sofia.png",         initials: "SA", title: "CEO",                         company: "Async Labs",          status: "Confirmed",    ticket: "VIP"      },
  { name: "David Osei",       initials: "DO", title: "Director of Talent",          company: "Shopify",            status: "Confirmed",    ticket: "General"  },
  { name: "Elena Kovač",      initials: "EK", title: "Org Design Consultant",       company: "Korn Ferry",         status: "Confirmed",    ticket: "General"  },
  { name: "Ravi Nair",        initials: "RN", title: "Engineering Manager",         company: "Atlassian",          status: "Confirmed",    ticket: "General"  },
  { name: "Isabelle Fontaine",initials: "IF", title: "People Experience Lead",      company: "Spendesk",           status: "Confirmed",    ticket: "General"  },
  { name: "Jake Thornton",    initials: "JT", title: "Founder",                     company: "Nomad Stack",        status: "Confirmed",    ticket: "General"  },
  { name: "Ama Boateng",      initials: "AB", title: "HR Tech Analyst",             company: "Gartner",            status: "Confirmed",    ticket: "Press"    },
  { name: "Pieter van Dijk",  initials: "PV", title: "Journalist",                  company: "Work Future",        status: "Confirmed",    ticket: "Press"    },
  { name: "Chloe Dubois",       initials: "CD", title: "Culture Strategist",          company: "Deloitte",           status: "Maybe",        ticket: "General"  },
  { name: "Omar Khalil",        initials: "OK", title: "VP People",                   company: "Deliveroo",          status: "Maybe",        ticket: "VIP"      },
  { name: "Yuki Tanaka",        initials: "YT", title: "Remote Culture Lead",         company: "Mercari",            status: "Maybe",        ticket: "General"  },
  { name: "Fatima Al-Rashid",   initials: "FA", title: "L&D Manager",                 company: "IKEA",               status: "Maybe",        ticket: "General"  },
  { name: "Ben Schultz",        initials: "BS", title: "CTO",                         company: "TeamFlow",           status: "Can't attend", ticket: "VIP"      },
  { name: "Grace Okonkwo",      initials: "GO", title: "Head of Culture",             company: "Intercom",           status: "Can't attend", ticket: "General"  },
  { name: "Lucas Ferrari",      initials: "LF", title: "People Ops Lead",             company: "Bending Spoons",     status: "Can't attend", ticket: "General"  },
  { name: "Aiko Watanabe",      initials: "AW", title: "Head of People",              company: "Monzo",              status: "Confirmed",    ticket: "General"  },
  { name: "Stefan Müller",      initials: "SM", title: "Workplace Experience Lead",   company: "SAP",                status: "Confirmed",    ticket: "General"  },
  { name: "Priya Menon",        initials: "PM", title: "Talent Acquisition Director", company: "Wise",               status: "Confirmed",    ticket: "General"  },
  { name: "James Obi",          initials: "JO", title: "HR Business Partner",         company: "Revolut",            status: "Confirmed",    ticket: "General"  },
  { name: "Léa Rousseau",       initials: "LR", title: "Chief of Staff",              company: "Doctolib",           status: "Confirmed",    ticket: "General"  },
  { name: "Kwame Asante",       initials: "KA", title: "Diversity & Inclusion Lead",  company: "Booking.com",        status: "Confirmed",    ticket: "General"  },
  { name: "Ingrid Solberg",     initials: "IS", title: "Future of Work Researcher",   company: "Spotify",            status: "Confirmed",    ticket: "General"  },
  { name: "Diego Vargas",       initials: "DV", title: "People Analytics Lead",       company: "Glovo",              status: "Confirmed",    ticket: "General"  },
  { name: "Mei Lin",            initials: "ML", title: "Engineering Director",        company: "Adyen",              status: "Confirmed",    ticket: "VIP"      },
  { name: "Tobias Brandt",      initials: "TB", title: "HR Innovation Manager",       company: "Siemens",            status: "Confirmed",    ticket: "General"  },
  { name: "Amara Diallo",       initials: "AD", title: "Talent Strategy Lead",        company: "BlaBlaCar",          status: "Confirmed",    ticket: "General"  },
  { name: "Henrik Larsson",     initials: "HL", title: "Head of Employer Brand",      company: "King",               status: "Confirmed",    ticket: "General"  },
  { name: "Nadia Petrov",       initials: "NP", title: "Chief HR Officer",            company: "Vinted",             status: "Maybe",        ticket: "VIP"      },
  { name: "Carlos Romero",      initials: "CR", title: "People Operations Manager",   company: "Typeform",           status: "Maybe",        ticket: "General"  },
  { name: "Zoe Fischer",        initials: "ZF", title: "Journalist",                  company: "HR Magazine",        status: "Confirmed",    ticket: "Press"    },
  { name: "Raj Pillai",         initials: "RP", title: "Head of Talent",              company: "Personio",           status: "Confirmed",    ticket: "General"  },
  { name: "Simone Bauer",       initials: "SB", title: "People & Culture Partner",    company: "Zalando",            status: "Confirmed",    ticket: "General"  },
  { name: "Kofi Mensah",        initials: "KM", title: "L&D Director",                company: "Philips",            status: "Maybe",        ticket: "General"  },
  { name: "Valentina Cruz",     initials: "VC", title: "Workforce Planning Lead",     company: "Cabify",             status: "Confirmed",    ticket: "General"  },
  { name: "Markus Klein",       initials: "MK", title: "VP HR Technology",            company: "HelloFresh",         status: "Can't attend", ticket: "General"  },
  { name: "Saoirse Murphy",     initials: "SR", title: "People Director",             company: "Stripe",             status: "Confirmed",    ticket: "VIP"      },
  { name: "Tomás Novák",        initials: "TN", title: "Remote Work Consultant",      company: "Keboola",            status: "Maybe",        ticket: "General"  },
  { name: "Layla Hassan",       initials: "LH", title: "Chief People Officer",        company: "Talabat",            status: "Confirmed",    ticket: "Speaker"  },
];

const BORDER_ROW  = "1px solid #f3f4f6";
const BORDER_HEAD = "1px solid #e5e7eb";
const BG_HEAD     = "#f9fafb";

function Badge({ label, colors }: { label: string; colors: { bg: string; text: string } }) {
  return (
    <span style={{
      display: "inline-block",
      padding: "1px 8px",
      borderRadius: 3,
      fontSize: 11,
      fontWeight: 500,
      lineHeight: "18px",
      background: colors.bg,
      color: colors.text,
      whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}

function Avatar({ name, avatar, initials }: { name: string; avatar?: string; initials: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {avatar ? (
        <img
          src={avatar}
          alt={name}
          style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
        />
      ) : (
        <div style={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: "#e5e7eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          fontSize: 9,
          fontWeight: 600,
          color: "#6b7280",
          letterSpacing: "0.02em",
        }}>
          {initials}
        </div>
      )}
      <span style={{ color: "#1f2937", fontWeight: 500 }}>{name}</span>
    </div>
  );
}

function thStyle(opts: { center?: boolean; rowNum?: boolean } = {}) {
  return {
    padding: "6px 8px",
    borderBottom: BORDER_HEAD,
    borderRight: BORDER_ROW,
    background: BG_HEAD,
    color: opts.rowNum ? "#9ca3af" : "#374151",
    fontSize: opts.rowNum ? 11 : 12,
    fontWeight: opts.rowNum ? 500 : 600,
    textAlign: (opts.center ? "center" : "left") as "center" | "left",
    position: "sticky" as const,
    top: 0,
    zIndex: 2,
    overflow: "hidden",
  };
}

function tdStyle(opts: { rowNum?: boolean; muted?: boolean } = {}) {
  return {
    padding: "5px 8px",
    borderBottom: BORDER_ROW,
    borderRight: BORDER_ROW,
    background: opts.rowNum ? BG_HEAD : "transparent",
    color: opts.rowNum ? "#9ca3af" : opts.muted ? "#6b7280" : "#1f2937",
    fontSize: opts.rowNum ? 11 : 12,
    fontWeight: opts.rowNum ? 500 : 400,
    textAlign: (opts.rowNum ? "center" : "left") as "center" | "left",
    overflow: "hidden",
    whiteSpace: "nowrap" as const,
    textOverflow: "ellipsis",
  };
}

export function AttendeesTable() {
  return (
    <div style={{
      border: "0.5px solid var(--color-gray-300)",
      borderRadius: 24,
      background: "#ffffff",
      overflow: "hidden",
      width: "100%",
    }}>
      {/* Title bar */}
      <div style={{
        padding: "12px 14px",
        borderBottom: BORDER_ROW,
        display: "flex",
        alignItems: "center",
        gap: 6,
        flexShrink: 0,
      }}>
        <IconUser css={{ width: 16, height: 16, flexShrink: 0, color: "#9ca3af" }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: "#374151", lineHeight: "18px" }}>
          Attendees · FlexForward 26
        </span>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto", fontSize: 12 }}>
        <table style={{ borderCollapse: "collapse", width: "100%", tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: 36 }} />
            <col style={{ width: 220 }} />
            <col />                        {/* title — flexible */}
            <col style={{ width: 160 }} />
            <col style={{ width: 120 }} />
            <col style={{ width: 110 }} />
          </colgroup>

          <thead>
            <tr>
              <th style={thStyle({ center: true, rowNum: true })}>#</th>
              <th style={thStyle()}>Name</th>
              <th style={thStyle()}>Title</th>
              <th style={thStyle()}>Company</th>
              <th style={thStyle()}>Status</th>
              <th style={{ ...thStyle(), borderRight: "none" }}>Ticket</th>
            </tr>
          </thead>

          <tbody>
            {ATTENDEES.map((row, i) => (
              <tr key={i}>
                <td style={tdStyle({ rowNum: true })}>{i + 1}</td>
                <td style={{ ...tdStyle(), paddingTop: 4, paddingBottom: 4 }}>
                  <Avatar name={row.name} avatar={row.avatar} initials={row.initials} />
                </td>
                <td style={tdStyle({ muted: true })}>{row.title}</td>
                <td style={tdStyle()}>{row.company}</td>
                <td style={{ ...tdStyle(), paddingTop: 4, paddingBottom: 4 }}>
                  <Badge label={row.status} colors={STATUS_COLORS[row.status] ?? STATUS_COLORS["Confirmed"]} />
                </td>
                <td style={{ ...tdStyle(), paddingTop: 4, paddingBottom: 4, borderRight: "none" }}>
                  <Badge label={row.ticket} colors={TICKET_COLORS[row.ticket] ?? TICKET_COLORS["General"]} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
