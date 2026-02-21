export default function Monitoramento() {
  return (
    <div className="space-y-4 h-[calc(100vh-2rem)]">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          📡 Monitoramento
        </h1>
        <p className="text-sm text-muted-foreground">Status em tempo real dos sistemas Evolve</p>
      </div>
      <div className="rounded-lg border border-border overflow-hidden flex-1" style={{ height: "calc(100vh - 8rem)" }}>
        <iframe
          src="https://status.rbrsistemas.com/status/evolve"
          className="w-full h-full border-0"
          title="Status do Sistema"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
        />
      </div>
    </div>
  );
}
