export { ContractsPage } from "./ContractsPage";

export {
	getContracts,
	getContractById,
	createContract,
	createContractClient,
	terminateContract,
	getContractLookups,
} from "./api";

export type {
	ApiResponse,
	PaginatedResponse,
	ContractStatus,
	ContractStatusFilter,
	ContractListItem,
	ContractDetail,
	PropertyLookupItem,
	ClientLookupItem,
	CreateContractClientInput,
	CreatedContractClient,
	LookupBundle,
	ContractQueryParams,
	CreateContractInput,
	ContractFormValues,
	ContractClientFormValues,
} from "./types";

export { useContractState, useContractForm } from "./hooks";
export type { TranslateFn } from "./hooks";

export {
	PAGE_SIZE,
	EMPTY_CONTRACT_FORM,
	EMPTY_CONTRACT_CLIENT_FORM,
	extractErrorMessage,
	toNumber,
	formatDateOnly,
	getDaysRemaining,
	buildCreateContractPayload,
	buildCreateContractClientPayload,
	findContractPropertyId,
} from "./utils";

export { ContractTable } from "./components/ContractTable";
export { ContractMobileCard } from "./components/ContractMobileCard";
export { ContractFormModal } from "./components/ContractFormModal";
export { ContractCreateTenantModal } from "./components/ContractCreateTenantModal";
export { ContractDetailsModal } from "./components/ContractDetailsModal";
