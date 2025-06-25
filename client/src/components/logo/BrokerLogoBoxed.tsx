import { BrokerLogo, BrokerLogoProps } from "./BrokerLogo";

type BrokerLogoBoxedProps = BrokerLogoProps;

export default function BrokerLogoBoxed({
  broker,
  size,
}: BrokerLogoBoxedProps) {
  return (
    <div className="w-200 h-30 bg-gray-100 rounded-md flex items-center justify-center p-2">
      <BrokerLogo broker={broker} size={size} />
    </div>
  );
}
