export default function EmbedPage({ params }: { params: { dashboardId: string } }) {
  return (
    <div className="bg-[#0a0e1a] min-h-screen flex items-center justify-center text-slate-500 text-sm">
      Embedded dashboard: {params.dashboardId}
    </div>
  );
}
