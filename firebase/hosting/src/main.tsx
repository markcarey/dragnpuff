import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { chain, configureChains, createClient, WagmiConfig } from "wagmi";
import { jsonRpcProvider } from "wagmi/providers/jsonRpc";
import { publicProvider } from "wagmi/providers/public";
import { ChakraProvider, extendTheme } from "@chakra-ui/react";

const BaseChain = {
  id: 8453,
  name: 'Base',
  network: 'Base',
  nativeCurrency: {
    decimals: 18,
    name: 'ETH',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: 'https://mainnet.base.org/',
  },
  blockExplorers: {
    default: { name: 'BaseScan', url: 'https://basescan.org/' },
  },
  iconUrl: "https://dragnpuff.xyz/img/base.png",
  iconUrls: ["https://dragnpuff.xyz/img/base.svg", "https://dragnpuff.xyz/img/base.png"],
  testnet: false,
}


// Version 1: Using objects
const theme = extendTheme({
  styles: {
    global: {
      // styles for the `body`
      body: {
        bg: '#17101f',
        color: 'white',
      },
      // styles for the `a`
      a: {
        color: 'teal.500',
        _hover: {
          textDecoration: 'underline',
        },
      },
    },
  },
})


const { chains, provider } = configureChains(
  [BaseChain, chain.mainnet], // you can add more chains here like chain.mainnet, chain.optimism etc.
  [
    jsonRpcProvider({
      rpc: () => {
        return {
          http: "https://mainnet.base.org/", 
        };
      },
    }),
    publicProvider(),
  ]
);

const { connectors } = getDefaultWallets({
  appName: "Next.js Chakra Rainbowkit Wagmi Starter",
  chains,
});

const wagmiClient = createClient({
  autoConnect: false,
  connectors,
  provider,
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <WagmiConfig client={wagmiClient}>
        <RainbowKitProvider chains={chains}>
          <App />
        </RainbowKitProvider>
      </WagmiConfig>
    </ChakraProvider>
  </React.StrictMode>
);
