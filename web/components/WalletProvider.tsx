"use client";
import { createConfig, http, WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const ritualChain = {
  id: 1979,
  name: "Ritual",
  nativeCurrency: { name: "Ritual", symbol: "RITUAL", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.ritualfoundation.org"] } },
  blockExplorers: { default: { name: "Ritual Explorer", url: "https://explorer.ritualfoundation.org" } },
} as const;

const config = createConfig({
  chains: [ritualChain],
  transports: { [ritualChain.id]: http() },
});

const queryClient = new QueryClient();

export default function WalletProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}