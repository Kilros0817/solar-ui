// Web3Auth Libraries
import { Web3AuthConnector } from "@web3auth/web3auth-wagmi-connector";
import { Web3AuthNoModal } from "@web3auth/no-modal";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { CHAIN_NAMESPACES, UX_MODE, WEB3AUTH_NETWORK } from "@web3auth/base";
import { WalletServicesPlugin } from "@web3auth/wallet-services-plugin";
import { AuthAdapter } from "@web3auth/auth-adapter";

const clientId = "BLQ-y7owmyiRuL7HH8Gt8Knv3O2aDbPUIB9VYfnpeo9dFrDQvx-oOn0cYK4ju2GBrBYIaVeU-2s580DKubMbNtY";

// Singleton instance to prevent multiple Web3Auth instances
let web3AuthInstance: Web3AuthNoModal | null = null;
let web3AuthConnector: any = null;

export default function Web3AuthConnectorInstance(chains: any) {
  // Return existing instance if already created
  if (web3AuthInstance && web3AuthConnector) {
    return { connector: web3AuthConnector, web3AuthInstance: web3AuthInstance };
  }

  // Create Web3Auth Instance
  const name = "Tome Block";
  const chainConfig = {
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    chainId: "0x" + chains[0].id.toString(16),
    rpcTarget: chains[0].rpcUrls.default.http[0], // This is the public RPC we have added, please pass on your own endpoint while creating an app
    displayName: chains[0].name,
    tickerName: chains[0].nativeCurrency?.name,
    ticker: chains[0].nativeCurrency?.symbol,
    blockExplorerUrl: chains[0].blockExplorers?.default.url[0],
    logo: "https://res.cloudinary.com/tomeblock/image/upload/v1744777616/base-logo-in-blue_qglb7d.png"
  };

  const privateKeyProvider = new EthereumPrivateKeyProvider({ config: { chainConfig } });

  web3AuthInstance = new Web3AuthNoModal({
    clientId,
    chainConfig,
    privateKeyProvider,
    uiConfig: {
      appName: name,
      defaultLanguage: "en",
      logoLight: "https://res.cloudinary.com/tomeblock/image/upload/v1742551559/tb-logo_hqkolh.png",
      logoDark: "https://res.cloudinary.com/tomeblock/image/upload/v1742551559/tb-logo_hqkolh.png",
      mode: "dark",
    },
    web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
    enableLogging: false,
  });

  // Increase max listeners to prevent warnings
  if (web3AuthInstance && typeof web3AuthInstance.setMaxListeners === 'function') {
    web3AuthInstance.setMaxListeners(20);
  }

  const authAdapter = new AuthAdapter({
    adapterSettings: {
      uxMode: UX_MODE.REDIRECT,
    }
  });

  web3AuthInstance.configureAdapter(authAdapter);

  const walletServicesPlugin = new WalletServicesPlugin({
    walletInitOptions: {
      whiteLabel: {
        showWidgetButton: false,
      }
    }
  });

  web3AuthInstance.addPlugin(walletServicesPlugin);

  web3AuthConnector = Web3AuthConnector({
    web3AuthInstance, 
    loginParams: {
      loginProvider: "email_passwordless",
    },
  });

  return { connector: web3AuthConnector, web3AuthInstance: web3AuthInstance };
}