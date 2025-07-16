import {
  BrokerProviderAssetSecuritySelect,
  ResolvedSecurity,
  WithSecurities,
  WithSecurity,
} from "shared/schema";
import { FC } from "react";
import { SecurityCard } from "./SecurityCard";

type SecuritiesListProps = {
  securities: ResolvedSecurity[];
  onItemClick: (item: { id: string }) => void;
};

export const SecuritiesList: FC<SecuritiesListProps> = ({
  securities,
  onItemClick,
}) => {
  return (
    <div>
      {securities.map((security) => (
        <SecurityCard
          key={security.id}
          security={security}
          onClick={onItemClick}
        />
      ))}
    </div>
  );
};
