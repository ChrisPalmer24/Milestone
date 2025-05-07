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
import { z } from "zod";
import { BrokerProviderAssetOrphanInsert } from "shared/schema";
import { useBrokerProviders } from "@/hooks/use-broker-providers";

type AddAccountDialogueProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inProgress: boolean;
  onSubmit: (data: BrokerProviderAssetOrphanInsert) => void;
};

const brokerProviderAssetOrphanInsertSchema = z.object({
  name: z.string().min(1, "Asset name is required"),
  providerId: z.string().min(1, "Provider is required"),
  accountType: z.string().min(1, "Account type is required"),
});

const AddAccountDialogue: React.FC<AddAccountDialogueProps> = ({
  open,
  onOpenChange,
  inProgress,
  onSubmit,
}) => {
  const { data: brokerProviders, isLoading: isLoadingBrokerProviders } =
    useBrokerProviders();

  const form = useForm<BrokerProviderAssetOrphanInsert>({
    resolver: zodResolver(brokerProviderAssetOrphanInsertSchema),
    defaultValues: {
      name: "",
      providerId: "",
      accountType: "",
    },
  });

  const handleSubmit = (data: BrokerProviderAssetOrphanInsert) => {
    onSubmit(data);
    form.reset();
  };

  const selectedProviderId = form.watch("providerId");
  const selectedProvider = brokerProviders?.find(
    (p) => p.id === selectedProviderId
  );

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
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. My Trading 212 ISA" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="providerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Provider</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoadingBrokerProviders}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {brokerProviders?.map((provider) => (
                        <SelectItem key={provider.id} value={provider.id}>
                          {provider.name}
                        </SelectItem>
                      ))}
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
                    disabled={!selectedProvider}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {selectedProvider &&
                        selectedProvider.supportedAccountTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
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
