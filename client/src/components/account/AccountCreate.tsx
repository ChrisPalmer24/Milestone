import {
  brokerProviderAssetOrphanInsertSchema,
  BrokerProviderAssetOrphanInsert,
  BrokerProviderInsertSecurityItem,
  SecuritySearchResult,
  brokerProviderAssetSecurityInsertSchema,
} from "@shared/schema";
import { useForm, useFormContext, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import {} from "../ui/form";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import RSelect from "react-select";
import { useBrokerProviders } from "@/hooks/use-broker-providers";
import { Button } from "../ui/button";
import { useFindSecurities } from "@/hooks/use-find-securities";
import { useCallback, useRef, useState } from "react";
import AsyncCombobox from "../ui/AsyncCombobox";
import { Card, CardContent } from "../ui/card";
import { Trash2 } from "lucide-react";
import { withTransform } from "@/lib/utils/mappers";

type AccountCreateProps = {
  onSubmit: (data: BrokerProviderAssetOrphanInsert) => void;
  onCancel: () => void;
};

export const AccountCreate: React.FC<AccountCreateProps> = ({
  onSubmit,
  onCancel,
}) => {
  const { data: brokerProviders, isLoading: isLoadingBrokerProviders } =
    useBrokerProviders();

  const form = useForm<BrokerProviderAssetOrphanInsert>({
    //resolver: zodResolver(brokerProviderAssetOrphanInsertSchema),
    resolver: withTransform(
      zodResolver(brokerProviderAssetOrphanInsertSchema),
      (values) => ({
        ...values,
        securities: values.securities.map((security) => ({
          ...security,
          shareHolding: security.shareHolding
            ? typeof security.shareHolding === "string"
              ? parseFloat(security.shareHolding)
              : security.shareHolding
            : 0,
          gainLoss: security.gainLoss
            ? typeof security.gainLoss === "string"
              ? parseFloat(security.gainLoss)
              : security.gainLoss
            : 0,
        })),
      })
    ),
    defaultValues: {
      name: "Mine 3",
      providerId: "3d723d74-ecf5-49fa-a4d9-4c52c1842de7",
      accountType: "ISA",
      securities: [
        {
          security: {
            symbol: "AAPL",
            name: "Apple Inc.",
          },
          shareHolding: 100,
          gainLoss: 100,
        },
      ],
    },
  });

  const submitForm = (data: BrokerProviderAssetOrphanInsert) => {
    console.log("submitForm", data);
    onSubmit(data);
    form.reset();
  };

  const { handleSubmit } = form;

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(submitForm)} className="space-y-4">
        <AccountCreateOne onNext={() => null} onCancel={onCancel} />
        <AccountCreateTwo onNext={() => null} onCancel={onCancel} />
      </form>
    </Form>
  );
};

type ActionsBarProps = {
  onCancel: () => void;
  onNext?: () => void;
  isProcessing: boolean;
};

type AccountCreateFormProps = {
  onCancel: () => void;
  onNext?: () => void;
};

const ActionsBar = ({ onCancel, onNext, isProcessing }: ActionsBarProps) => {
  return (
    <section className="mt-4 flex justify-end flex-row gap-2">
      <Button variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      {onNext && <Button onClick={onNext}>Next</Button>}
      <Button type="submit" disabled={isProcessing}>
        {isProcessing ? (
          <>
            <span className="mr-2">Processing...</span>
          </>
        ) : (
          "Add Account"
        )}
      </Button>
    </section>
  );
};

const AccountCreateOne: React.FC<AccountCreateFormProps> = ({
  onCancel,
  onNext,
}) => {
  const form = useFormContext<BrokerProviderAssetOrphanInsert>();

  const {
    formState: { isSubmitting },
  } = form;

  const { data: brokerProviders, isLoading: isLoadingBrokerProviders } =
    useBrokerProviders();

  const selectedProviderId = form.watch("providerId");
  const selectedProvider = brokerProviders?.find(
    (p) => p.id === selectedProviderId
  );

  return (
    <>
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

      <section>
        <ActionsBar
          onCancel={onCancel}
          onNext={onNext}
          isProcessing={isSubmitting}
        />
      </section>
    </>
  );
};

const AccountCreateTwo: React.FC<AccountCreateFormProps> = ({
  onCancel,
  onNext,
}) => {
  const form = useFormContext<BrokerProviderAssetOrphanInsert>();

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "securities",
  });

  const [addingSecurity, setAddingSecurity] = useState<boolean>(false);

  const {
    formState: { isSubmitting },
  } = form;

  return (
    <>
      <FormLabel>Securities</FormLabel>
      <div className="space-y-2 flex flex-col gap-2">
        {fields.map((field, index) => (
          <div key={field.id} className="flex flex-row gap-2 items-start">
            <div className="flex-1">
              <SecurityCard security={field} />
            </div>
            <Button variant="outline" onClick={() => remove(index)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
        {addingSecurity ? (
          <SecurityAddForm
            onAdd={(security) => {
              setAddingSecurity(false);
              append(security);
            }}
          />
        ) : (
          <Button onClick={() => setAddingSecurity(true)}>Add Security</Button>
        )}
        <ActionsBar
          onCancel={onCancel}
          onNext={onNext}
          isProcessing={isSubmitting}
        />
      </div>
    </>
  );
};

// Debounce utility
function useDebouncedCallback<T extends (...args: any[]) => void>(
  cb: T,
  delay: number,
  minLength: number
) {
  const timeout = useRef<NodeJS.Timeout | null>(null);
  return useCallback(
    (...args: Parameters<T>) => {
      if (args[0].length < minLength) cb(...args);
      if (timeout.current) clearTimeout(timeout.current);
      timeout.current = setTimeout(() => cb(...args), delay);
    },
    [cb, delay]
  );
}

/*
 * See https://react-select.com/components
 */
const SecurityOptions = ({
  innerProps,
  isFocused,
  isSelected,
  data,
}: {
  innerProps: any;
  isFocused: boolean;
  isSelected: boolean;
  data: any;
}) => {
  return <div {...innerProps}>{data.label}</div>;
};

const SecurityAddForm = ({
  onAdd,
}: {
  onAdd: (value: BrokerProviderInsertSecurityItem) => void;
}) => {
  const form = useForm<Partial<BrokerProviderInsertSecurityItem>>({
    //We need this as the form library does not use react-hook form effectively to allow valueAsNumber to work
    //And we really need a float anyway

    defaultValues: {
      security: undefined,
      shareHolding: 0,
      gainLoss: 0,
    },
  });

  const {
    control,
    formState: { errors },
  } = form;

  console.log("errors", errors);

  const [searchInput, setSearchInput] = useState("");
  const [selectedSecurity, setSelectedSecurity] =
    useState<SecuritySearchResult | null>(null);

  const debouncedSearch = useDebouncedCallback(
    (input: string) => {
      setSearchInput(input);
    },
    100,
    3
  );

  const { data: securities, isLoading: isLoadingSecurities } =
    useFindSecurities(searchInput);

  return (
    <>
      <RSelect
        options={securities ?? []}
        getOptionLabel={(security) => `${security.symbol} - ${security.name}`}
        value={selectedSecurity}
        onChange={(security) => {
          setSelectedSecurity(security);
        }}
        onInputChange={(input) => {
          debouncedSearch(input);
        }}
        inputValue={searchInput}
        isLoading={isLoadingSecurities}
        placeholder="Search securities..."
        // components={{
        //   Option: SecurityOptions,
        // }}
      />
      <FormField
        control={control}
        name="shareHolding"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Share Holdings</FormLabel>
            <FormControl>
              <Input type="number" placeholder="Share Holdings" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="gainLoss"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Gain/Loss</FormLabel>
            <FormControl>
              <Input type="number" placeholder="Gain/Loss" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <Button
        onClick={() => {
          if (selectedSecurity) {
            onAdd({
              security: selectedSecurity,
              shareHolding: form.getValues("shareHolding") || 0,
              gainLoss: form.getValues("gainLoss") || 0,
            } as BrokerProviderInsertSecurityItem);
            setSelectedSecurity(null);
            setSearchInput("");
            form.reset();
          }
        }}
        disabled={!selectedSecurity}
      >
        Add
      </Button>
    </>
  );
};

type SecurityCardProps = {
  security: BrokerProviderInsertSecurityItem & { id: string };
};

const SecurityCard = ({ security }: SecurityCardProps) => {
  return (
    <Card>
      <CardContent>
        <div className="flex flex-row gap-2">
          <span className="text-sm">ID:</span>
          <span>{security.id}</span>
        </div>
        <div className="flex flex-row gap-2">
          <span className="text-sm">Symbol:</span>
          <span>{security.security.symbol}</span>
        </div>
        <div className="flex flex-row gap-2">
          <span className="text-sm">Name:</span>
          <span>{security.security.name}</span>
        </div>
        <div className="flex flex-row gap-2">
          <span className="text-sm">Share Holdings:</span>
          <span>{security.shareHolding}</span>
        </div>
        <div className="flex flex-row gap-2">
          <span className="text-sm">Gain/Loss:</span>
          <span>{security.gainLoss}</span>
        </div>
      </CardContent>
    </Card>
  );
};
