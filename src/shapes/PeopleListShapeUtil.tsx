"use client";

import {
  Geometry2d,
  HTMLContainer,
  RecordProps,
  Rectangle2d,
  ShapeUtil,
  T,
  TLShape,
  createShapePropsMigrationSequence,
  createShapePropsMigrationIds,
} from "tldraw";
import { AutoSizeWrapper } from "./AutoSizeWrapper";

export const PEOPLELIST_SHAPE_TYPE = "peoplelist" as const;

declare module "tldraw" {
  export interface TLGlobalShapePropsMap {
    [PEOPLELIST_SHAPE_TYPE]: {
      w: number;
      h: number;
      people: unknown;
      colorScheme: string;
    };
  }
}

type IPeopleListShape = TLShape<typeof PEOPLELIST_SHAPE_TYPE>;

// Avatar color palettes per zone
const BLUE_AVATARS = ["#1D4792", "#3570CC", "#4A83E0", "#6DA4F6", "#86B4F9", "#B2D0FE"];
const YELLOW_AVATARS = ["#6B4F0E", "#8E6A12", "#BA8A12", "#D4A80E", "#F0C830", "#FFE86D"];
const DEFAULT_AVATARS = ["#3859FF", "#B8ACFB", "#6AE08D", "#FD9AE7", "#FFD02F", "#9CE6FF"];

function getAvatarColor(name: string, colorScheme: string): string {
  const palette =
    colorScheme === "green" ? BLUE_AVATARS :
    colorScheme === "violet" ? YELLOW_AVATARS :
    DEFAULT_AVATARS;

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
  }
  return palette[Math.abs(hash) % palette.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

// ── Migration: add colorScheme prop to existing people list shapes ──

const peopleVersions = createShapePropsMigrationIds(PEOPLELIST_SHAPE_TYPE, {
  AddColorScheme: 1,
});

const peopleMigrations = createShapePropsMigrationSequence({
  sequence: [
    {
      id: peopleVersions.AddColorScheme,
      up(props: Record<string, unknown>) {
        props.colorScheme = "";
      },
      down(props: Record<string, unknown>) {
        delete props.colorScheme;
      },
    },
  ],
});

export class PeopleListShapeUtil extends ShapeUtil<IPeopleListShape> {
  static override type = PEOPLELIST_SHAPE_TYPE;
  static override migrations = peopleMigrations;
  static override props: RecordProps<IPeopleListShape> = {
    w: T.number,
    h: T.number,
    people: T.jsonValue,
    colorScheme: T.string,
  };

  getDefaultProps(): IPeopleListShape["props"] {
    return {
      w: 320,
      h: 120,
      people: [],
      colorScheme: "",
    };
  }

  override canEdit() {
    return false;
  }

  override canScroll() {
    return false;
  }

  override canResize() {
    return false;
  }

  override isAspectRatioLocked() {
    return false;
  }

  getGeometry(shape: IPeopleListShape): Geometry2d {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    });
  }

  component(shape: IPeopleListShape) {
    const people = (shape.props.people ?? []) as Array<{ name: string; role: string }>;
    const colorScheme = (shape.props as any).colorScheme || "";

    return (
      <HTMLContainer
        style={{
          width: shape.props.w,
          height: shape.props.h,
          overflow: "hidden",
          pointerEvents: "all",
        }}
      >
        <AutoSizeWrapper
          shapeId={shape.id}
          shapeType={PEOPLELIST_SHAPE_TYPE}
          shapeH={shape.props.h}
          editor={this.editor}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 12,
              border: "1px solid var(--color-gray-200)",
              padding: "16px 20px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {people.map((person, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  minHeight: 28,
                }}
              >
                {/* Avatar circle with initials */}
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    backgroundColor: getAvatarColor(person.name, colorScheme),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    fontWeight: 700,
                    color: "white",
                    flexShrink: 0,
                    lineHeight: 1,
                  }}
                >
                  {getInitials(person.name)}
                </div>
                {/* Name + role */}
                <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--color-gray-900)",
                      lineHeight: "16px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {person.name}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 400,
                      color: "var(--color-gray-500)",
                      lineHeight: "16px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {person.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </AutoSizeWrapper>
      </HTMLContainer>
    );
  }

  indicator(shape: IPeopleListShape) {
    return (
      <rect
        width={shape.props.w}
        height={shape.props.h}
        rx={12}
        ry={12}
      />
    );
  }
}
