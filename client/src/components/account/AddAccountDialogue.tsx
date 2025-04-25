import { Plus } from "lucide-react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogContent,
  DialogFooter,
} from "../ui/dialog";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Form } from "../ui/form";
import { SelectContent } from "../ui/select";
import { SelectItem } from "../ui/select";
import { SelectTrigger } from "../ui/select";
import { useForm } from "react-hook-form";
import { Select } from "../ui/select";
import { SelectValue } from "@radix-ui/react-select";
import { Input } from "../ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { orphanAccountSchema, OrphanAccount } from "@shared/schema";

type AddAccountDialogueProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inProgress: boolean;
  onSubmit: (data: OrphanAccount) => void;
};

const AddAccountDialogue: React.FC<AddAccountDialogueProps> = ({
  open,
  onOpenChange,
  inProgress,
  onSubmit,
}) => {
  const form = useForm<OrphanAccount>({
    resolver: zodResolver(orphanAccountSchema),
    defaultValues: {
      provider: "",
      accountType: "",
      currentValue: "",
    },
  });

  const handleSubmit = (data: OrphanAccount) => {
    onSubmit(data);
    form.reset();
  };

  const selectedProvider = form.watch("provider");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full w-10 h-10 flex items-center justify-center bg-black text-white border-black"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Investment Account</DialogTitle>
          <DialogDescription>
            Enter the details of your investment account below.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="provider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Provider</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Trading 212">Trading 212</SelectItem>
                      <SelectItem value="Vanguard">Vanguard</SelectItem>
                      <SelectItem value="InvestEngine">InvestEngine</SelectItem>
                      <SelectItem value="Hargreaves Lansdown">
                        Hargreaves Lansdown
                      </SelectItem>
                      <SelectItem value="AJ Bell">AJ Bell</SelectItem>
                    </SelectContent>
                  </Select>
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
                      <SelectItem value="ISA">ISA</SelectItem>
                      <SelectItem value="CISA">Cash ISA</SelectItem>
                      <SelectItem value="SIPP">SIPP</SelectItem>
                      {(selectedProvider === "Hargreaves Lansdown" ||
                        selectedProvider === "AJ Bell") && (
                        <SelectItem value="LISA">Lifetime ISA</SelectItem>
                      )}
                      <SelectItem value="GIA">General Account</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currentValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Value (£)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={inProgress}>
                {inProgress ? (
                  <>
                    <span className="mr-2">Adding...</span>
                    <span className="animate-spin">⏳</span>
                  </>
                ) : (
                  "Add Account"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddAccountDialogue;
