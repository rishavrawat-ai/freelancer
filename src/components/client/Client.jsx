import ClientOnboading from "./ClientOnboading";

const Client = () => {
  return (
    <main className="min-h-screen bg-background text-foreground transition-colors">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <ClientOnboading />
      </div>
    </main>
  );
};

export default Client;
