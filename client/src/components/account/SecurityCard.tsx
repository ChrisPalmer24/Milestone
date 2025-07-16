import { FC } from "react";
import { ResolvedSecurity } from "shared/schema";
import { twMerge } from "tailwind-merge";

type SecurityCardProps = {
  security: ResolvedSecurity;
  onClick: (item: { id: string }) => void;
};

export const SecurityCard: FC<SecurityCardProps> = ({ security, onClick }) => {
  return (
    <div
      className={twMerge("flex flex-row justify-between cursor-pointer")}
      onClick={() => onClick(security)}
    >
      <div className="flex flex-col items-start">
        <div className="text-sm font-medium">{security.security.name}</div>
        <div className="text-sm text-gray-500">{security.security.symbol}</div>
      </div>
      <div className="flex flex-col items-end">
        <div className="text-sm font-medium">
          {security.calculatedValue.value}
        </div>
        <div className="text-sm text-gray-500">
          {security.calculatedValue.currentChange}
        </div>
      </div>
    </div>
  );
};
