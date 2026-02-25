"use client";

import Image from "next/image";

type RoleColor = "coral" | "lavender";

export interface RACIMember {
  name: string;
  avatar: string;
  role: string;
  roleColor: RoleColor;
}

interface RACIWidgetProps {
  title: string;
  members: RACIMember[];
}

const roleColorMap: Record<RoleColor, { bg: string; border: string; text: string }> = {
  coral: { bg: "var(--space-accent)", border: "transparent", text: "#fff" },
  lavender: { bg: "var(--space-secondary)", border: "transparent", text: "#fff" },
};

export function RACIWidget({ title, members }: RACIWidgetProps) {
  return (
    <div className="rounded-[24px] p-[24px] overflow-hidden">
      <h3 className="text-[20px] font-semibold text-[#222428] mb-4">{title}</h3>
      <div className="flex flex-col gap-2">
        {members.map((member, i) => {
          const colors = roleColorMap[member.roleColor];
          return (
            <div
              key={i}
              className="flex items-center gap-3"
              style={{ height: 44 }}
            >
              <Image
                src={member.avatar}
                alt={member.name}
                width={36}
                height={36}
                className="rounded-full object-cover shrink-0"
                style={{ width: 36, height: 36 }}
              />
              <span className="text-[14px] text-[#222428] truncate flex-1">
                {member.name}
              </span>
              <span
                className="shrink-0 flex items-center justify-center rounded-[8px] text-[12px] font-medium"
                style={{
                  height: 28,
                  paddingLeft: 8,
                  paddingRight: 8,
                  backgroundColor: colors.bg,
                  border: `1px solid ${colors.border}`,
                  color: colors.text,
                }}
              >
                {member.role}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
