import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SampleForm } from "../components/SampleForm";

describe("SampleForm", () => {
    const defaultProps = {
        onSubmit: vi.fn(),
        isPending: false,
        onCancel: vi.fn(),
    };

    it("should render name and description fields", () => {
        render(<SampleForm {...defaultProps} />);

        expect(screen.getByPlaceholderText("ระบุชื่อ")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("ระบุคำอธิบาย (ไม่บังคับ)")).toBeInTheDocument();
    });

    it("should render submit button with create label when no initialData", () => {
        render(<SampleForm {...defaultProps} />);

        expect(screen.getByRole("button", { name: "สร้าง" })).toBeInTheDocument();
    });

    it("should render submit button with update label when initialData provided", () => {
        render(
            <SampleForm
                {...defaultProps}
                initialData={
                    {
                        id: "1",
                        name: "Existing",
                        description: "Desc",
                    } as never
                }
            />,
        );

        expect(screen.getByRole("button", { name: "อัปเดต" })).toBeInTheDocument();
    });

    it("should show validation error when submitting empty name", async () => {
        const user = userEvent.setup();
        render(<SampleForm {...defaultProps} />);

        const submitBtn = screen.getByRole("button", { name: "สร้าง" });
        await user.click(submitBtn);

        await waitFor(() => {
            expect(screen.getByText("กรุณาระบุชื่อ")).toBeInTheDocument();
        });

        expect(defaultProps.onSubmit).not.toHaveBeenCalled();
    });

    it("should call onSubmit with form data when valid", async () => {
        const user = userEvent.setup();
        render(<SampleForm {...defaultProps} />);

        await user.type(screen.getByPlaceholderText("ระบุชื่อ"), "Test Name");
        await user.type(
            screen.getByPlaceholderText("ระบุคำอธิบาย (ไม่บังคับ)"),
            "Test Description",
        );

        const submitBtn = screen.getByRole("button", { name: "สร้าง" });
        await user.click(submitBtn);

        await waitFor(() => {
            expect(defaultProps.onSubmit).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: "Test Name",
                    description: "Test Description",
                }),
            );
        });
    });

    it("should call onCancel when cancel button is clicked", async () => {
        const user = userEvent.setup();
        render(<SampleForm {...defaultProps} />);

        await user.click(screen.getByRole("button", { name: "ยกเลิก" }));

        expect(defaultProps.onCancel).toHaveBeenCalled();
    });

    it("should disable submit button when isPending is true", () => {
        render(<SampleForm {...defaultProps} isPending={true} />);

        const submitBtn = screen.getByRole("button", {
            name: "กำลังบันทึก...",
        });
        expect(submitBtn).toBeDisabled();
    });
});
