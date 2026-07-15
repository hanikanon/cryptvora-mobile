import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SettingsApp } from "@/components/settings/SettingsApp";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SettingsApp />
    </QueryClientProvider>
  );
}
