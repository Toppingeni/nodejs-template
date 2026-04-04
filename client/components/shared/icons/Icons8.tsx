import type { ComponentPropsWithoutRef } from "react";

type Icons8Props = Omit<ComponentPropsWithoutRef<"img">, "src" | "alt"> & {
    className?: string;
};

/**
 * Factory that creates a React component rendering an Icons8 CDN image.
 * Style: "3d-fluency" for lively, colorful 3D icons.
 *
 * @see https://icons8.com — free with attribution
 */
function create(displayName: string, slug: string) {
    const Icon = ({ className, ...props }: Icons8Props) => (
        <img
            src={`https://img.icons8.com/3d-fluency/94/${slug}.png`}
            alt=""
            className={`object-contain ${className ?? ""}`}
            draggable={false}
            loading="lazy"
            {...props}
        />
    );
    Icon.displayName = `Icons8${displayName}`;
    return Icon;
}

// ─── Navigation / Layout ───────────────────────────────────────
export const Icons8Home = create("Home", "home");
export const Icons8Database = create("Database", "database");
export const Icons8Menu = create("Menu", "menu");

// ─── Dashboard / Stats ─────────────────────────────────────────
export const Icons8BarChart = create("BarChart", "combo-chart--v1");
export const Icons8Users = create("Users", "conference");
export const Icons8Activity = create("Activity", "activity-feed");
export const Icons8FileText = create("FileText", "document");

// ─── Actions ───────────────────────────────────────────────────
export const Icons8Plus = create("Plus", "plus");
export const Icons8Edit = create("Edit", "edit");
export const Icons8Trash = create("Trash", "trash");

// ─── Auth ──────────────────────────────────────────────────────
export const Icons8Login = create("Login", "login-rounded-right");
export const Icons8User = create("User", "user-male-circle--v1");
export const Icons8Lock = create("Lock", "lock-2");
export const Icons8Logout = create("Logout", "logout-rounded-left");
