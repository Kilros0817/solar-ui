export const URLs = {
	SDMSAPI: "http://localhost:8085/api",
};

export const BaseRPC1 = "https://base-sepolia.g.alchemy.com/v2/U6YPO8eU2p26wRrvGyI2OlC1BS4ipA5o";
export const BaseRPC2 = "https://base-sepolia.g.alchemy.com/v2/vE7q6lsie-jRPZjFzbayQibbzicwO4uN";
export const BaseRPC3 = "https://base-sepolia.g.alchemy.com/v2/-DFmaAk_5jzgxCw7iYJ_VPr6VJq0RRFz";

export const USER_ROLE = {
    NO_ROLE: 0,
    DIVISION_MEMBER: 1,
    DIVISION_LEADER: 2,
    LEGAL_TEAM: 3,
    ADMIN: 4,
    PROJECT_OWNER: 5
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

export const TBDelegator = "0xE28EcFec6dc61Bb1eA41A331db290A68807FF3C2";
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
