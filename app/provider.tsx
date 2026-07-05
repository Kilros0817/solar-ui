"use client"
import "./globals.css";
import React, { useEffect, useState } from "react";

import { createConfig, WagmiProvider, fallback, http, Config } from "wagmi";

import { UserProvider } from './contexts/UserContext'
import { NewContractProvider } from './contexts/NewContractContext'
import { ContractsProvider } from './contexts/ContractsContext'
import { PostgresRefreshProvider } from './contexts/PostgresRefreshContext'
import { DivisionLeaderSectionsProvider } from './contexts/DivisionLeaderSectionsContext'
import { DivisionMemberClausesProvider } from './contexts/DivisionMemberClausesContext'
import { ClientContractsProvider } from './contexts/ClientContractsContext'
import { ContractDocProvider } from './contexts/ContractDocContext'
import { AssignmentProvider } from './contexts/AssignmentContext'
import { SectionContentProvider } from './contexts/SectionContentContext'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Web3AuthConnectorInstance from "@/utils/Web3AuthConnectorInstance";
import { setWeb3AuthInstance } from "@/utils/Web3AuthStore";

import { baseSepolia } from "viem/chains";
import { BaseRPC1, BaseRPC2 } from "@/utils/constants";
import type { TBProviderProps } from './data/interfaces';

const queryClient = new QueryClient();

const TBProvider: React.FC<TBProviderProps> = ({ children }: TBProviderProps) => {

  const [config, setConfig] = useState<Config | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const { connector, web3AuthInstance } = Web3AuthConnectorInstance([baseSepolia]);

        setWeb3AuthInstance(web3AuthInstance);

        const conf = createConfig({
          chains: [baseSepolia],
          cacheTime: 3_600_000,
          transports: {
            [baseSepolia.id]: fallback([
              http(BaseRPC2),
              http(BaseRPC1),
            ]),
          },
          connectors: [
            connector,
          ],
        });

        setConfig(conf);

      } catch (error) {
        console.error('Failed to initialize Web3Auth:', error);
      }
    };

    init();
  }, []); // Empty dependency array to ensure this runs only once

  return (
    <div className="min-h-screen bg-[#1a1d21]">
      {config && (
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <div className="flex flex-col">
              <UserProvider>
                <NewContractProvider>
                  <ContractsProvider>
                    <PostgresRefreshProvider>
                      <ClientContractsProvider>
                        <DivisionLeaderSectionsProvider>
                          <DivisionMemberClausesProvider>
                            <ContractDocProvider>
                              <SectionContentProvider>
                                <AssignmentProvider>
                                  {children}
                                </AssignmentProvider>
                              </SectionContentProvider>
                            </ContractDocProvider>
                          </DivisionMemberClausesProvider>
                        </DivisionLeaderSectionsProvider>
                      </ClientContractsProvider>
                    </PostgresRefreshProvider>
                  </ContractsProvider>
                </NewContractProvider>
              </UserProvider>
            </div>
          </QueryClientProvider>
        </WagmiProvider>
      )}
    </div>
  );
};

export default TBProvider;

