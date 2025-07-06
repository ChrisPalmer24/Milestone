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
import { AccountCreate } from "./AccountCreate";

type AddAccountDialogueProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inProgress: boolean;
  onSubmit: (data: BrokerProviderAssetOrphanInsert) => void;
};

const AddAccountDialogue: React.FC<AddAccountDialogueProps> = ({
  open,
  onOpenChange,
  onSubmit,
}) => {
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

        <AccountCreate
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AddAccountDialogue;
