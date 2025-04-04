import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Milestone } from "@shared/schema";
import { usePortfolio } from "@/context/PortfolioContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const editMilestoneSchema = z.object({
  name: z.string().min(1, "Name is required"),
  accountType: z.string().optional(),
  targetValue: z
    .string()
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Target value must be a positive number",
    }),
});

type EditMilestoneFormData = z.infer<typeof editMilestoneSchema>;

interface EditMilestoneDialogProps {
  milestone: Milestone;
  isOpen: boolean;
  onClose: () => void;
}

export function EditMilestoneDialog({
  milestone,
  isOpen,
  onClose,
}: EditMilestoneDialogProps) {
  const { updateMilestoneMutation } = usePortfolio();

  const form = useForm<EditMilestoneFormData>({
    resolver: zodResolver(editMilestoneSchema),
    defaultValues: {
      name: milestone.name,
      accountType: milestone.accountType || "ALL",
      targetValue: milestone.targetValue.toString(),
    },
  });

  const onSubmit = async (values: EditMilestoneFormData) => {
    try {
      await updateMilestoneMutation.mutateAsync({
        id: milestone.id,
        data: {
          name: values.name,
          accountType: values.accountType === "ALL" ? null : values.accountType,
          targetValue: values.targetValue,
        },
      });
      onClose();
    } catch (error) {
      // Error handling is managed by the mutation
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Milestone</DialogTitle>
          <DialogDescription>
            Update your investment milestone details.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Milestone name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="accountType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ALL">All Accounts</SelectItem>
                      <SelectItem value="ISA">ISA</SelectItem>
                      <SelectItem value="SIPP">SIPP</SelectItem>
                      <SelectItem value="LISA">LISA</SelectItem>
                      <SelectItem value="GIA">GIA</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="targetValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Value (£)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter target value"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="mr-2"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateMilestoneMutation.isPending}
              >
                {updateMilestoneMutation.isPending
                  ? "Saving..."
                  : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
