export const URLs = {
	SDMSAPI: "http://localhost:8085/api",
	ClauseAPI: "http://localhost:8085/clause",
	SectionAPI: "http://localhost:8085/section",
	ContractAPI: "http://localhost:8085/contract",
	UploadAPI: "http://localhost:8085/upload",
	AnalysisAPI: "http://localhost:8085/analysis",
	PostgresAPI: "http://localhost:8085/postgres",
	TBGateWay: "https://jade-wonderful-hawk-382.mypinata.cloud/ipfs/",
};

export const BaseRPC1 = "https://base-sepolia.g.alchemy.com/v2/vE7q6lsie-jRPZjFzbayQibbzicwO4uN";
export const BaseRPC2 = "https://base-sepolia.g.alchemy.com/v2/-DFmaAk_5jzgxCw7iYJ_VPr6VJq0RRFz";

export const CONTRACT_STATUS = {
    PENDING: 0,
    REQUEST: 1,
    APPROVED: 2,
    REJECTED: 3,
    ESIGNED: 4,
}

export const USER_ROLE = {
    NO_ROLE: 0,
    DIVISION_MEMBER: 1,
    DIVISION_LEADER: 2,
    LEGAL_TEAM: 3,
    ADMIN: 4,
	CLIENT: 5
}

export const DIVISION_CATEGORY = {
    NO_DIVISION: 0,
    LEGAL: 1,
    PROJECT_MANAGEMENT: 2,
    PRECONSTRUCTION: 3,
    ESTIMATING: 4,
    FINANCE: 5,
    ACCOUNTING: 6,
    RISK_MANAGEMENT: 7,
    INSURANCE: 8,
    SAFETY: 9
}

export const CONTRACT_STATUS_LABELS: Record<number, string> = {
    [CONTRACT_STATUS.PENDING]: 'Pending',
    [CONTRACT_STATUS.REQUEST]: 'Request',
    [CONTRACT_STATUS.APPROVED]: 'Approved',
    [CONTRACT_STATUS.REJECTED]: 'Rejected',
    [CONTRACT_STATUS.ESIGNED]: 'ESigned',
}

// Role labels for display
export const ROLE_LABELS: Record<number, string> = {
    [USER_ROLE.NO_ROLE]: 'No Role',
    [USER_ROLE.DIVISION_MEMBER]: 'Division Member',
    [USER_ROLE.DIVISION_LEADER]: 'Division Leader',
    [USER_ROLE.LEGAL_TEAM]: 'Legal Team',
    [USER_ROLE.ADMIN]: 'Administrator',
    [USER_ROLE.CLIENT]: 'Client',
};

// Division labels for display
export const DIVISION_LABELS: Record<number, string> = {
    [DIVISION_CATEGORY.NO_DIVISION]: 'No Division',
    [DIVISION_CATEGORY.LEGAL]: 'Legal',
    [DIVISION_CATEGORY.PROJECT_MANAGEMENT]: 'Project Management',
    [DIVISION_CATEGORY.PRECONSTRUCTION]: 'Preconstruction',
    [DIVISION_CATEGORY.ESTIMATING]: 'Estimating',
    [DIVISION_CATEGORY.FINANCE]: 'Finance',
    [DIVISION_CATEGORY.ACCOUNTING]: 'Accounting',
    [DIVISION_CATEGORY.RISK_MANAGEMENT]: 'Risk Management',
    [DIVISION_CATEGORY.INSURANCE]: 'Insurance',
    [DIVISION_CATEGORY.SAFETY]: 'Safety',
};

export const TBDelegator = "0xd2bB2A349354612713079A014615Fb582259261C";
export const TBSponsor = "0x0d8e9E3Efa9DAD7Aa4b761c132ADF6ddEB7d16B4";

export const TBDelegatorABI = [
	{
		"inputs": [],
		"name": "nonce",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"components": [
					{
						"internalType": "address",
						"name": "to",
						"type": "address"
					},
					{
						"internalType": "uint256",
						"name": "value",
						"type": "uint256"
					},
					{
						"internalType": "bytes",
						"name": "data",
						"type": "bytes"
					}
				],
				"internalType": "struct TBDelegator.Call[]",
				"name": "calls",
				"type": "tuple[]"
			},
			{
				"internalType": "bytes",
				"name": "signature",
				"type": "bytes"
			}
		],
		"name": "execute",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
];
