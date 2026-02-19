"use client";

import {
  Geometry2d,
  HTMLContainer,
  RecordProps,
  Rectangle2d,
  ShapeUtil,
  T,
  TLShape,
} from "tldraw";
import { AutoSizeWrapper } from "./AutoSizeWrapper";

export const PEOPLELIST_SHAPE_TYPE = "peoplelist" as const;

declare module "tldraw" {
  export interface TLGlobalShapePropsMap {
    [PEOPLELIST_SHAPE_TYPE]: {
      w: number;
      h: number;
      people: unknown;
    };
  }
}

type IPeopleListShape = TLShape<typeof PEOPLELIST_SHAPE_TYPE>;

// Avatar colors — deterministic assignment by name hash
const AVATAR_COLORS = ["#4262FF", "#C8B6FF", "#B8F077", "#F48FB1", "#FFD02F", "#80DEEA"];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export class PeopleListShapeUtil extends ShapeUtil<IPeopleListShape> {
  static override type = PEOPLELIST_SHAPE_TYPE;
  static override props: RecordProps<IPeopleListShape> = {
    w: T.number,
    h: T.number,
    people: T.jsonValue,
  };

  getDefaultProps(): IPeopleListShape["props"] {
    return {
      w: 320,
      h: 120,
      people: [],
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
              border: "1px solid #e5e7eb",
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
                    backgroundColor: getAvatarColor(person.name),
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
                      color: "#111827",
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
                      color: "#6B7280",
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
