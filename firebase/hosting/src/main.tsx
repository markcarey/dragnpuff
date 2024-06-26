import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig, getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
//import { chain, configureChains, createClient, WagmiConfig } from "wagmi";
//import { jsonRpcProvider } from "wagmi/providers/jsonRpc";
//import { publicProvider } from "wagmi/providers/public";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
//import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
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

import { base, mainnet } from 'wagmi/chains';

const config = getDefaultConfig({
  appName: 'DragNPuff',
  projectId: '6f8cffe8dabbbfc1d4633a45cd1abb67',
  chains: [base, mainnet],
});

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>
            <App />
          </RainbowKitProvider>
      </QueryClientProvider>
      </WagmiProvider>
    </ChakraProvider>
  </React.StrictMode>
);
