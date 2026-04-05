import { mockProjects } from "@/data/mock/projects";

export default function ProjectsTable() {
  return (
    <div className="overflow-hidden rounded-[24px] border border-line bg-card">
      <div className="grid grid-cols-5 border-b border-line px-5 py-4 text-xs font-bold uppercase tracking-[0.18em] text-sub">
        <div>Project</div>
        <div>Chain</div>
        <div>Status</div>
        <div>Members</div>
        <div>Campaigns</div>
      </div>

      {mockProjects.map((project) => (
        <div
          key={project.id}
          className="grid grid-cols-5 items-center border-b border-line/60 px-5 py-4 text-sm text-text last:border-b-0"
        >
          <div className="flex items-center gap-3 font-semibold">
            <span className="text-xl">{project.logo}</span>
            {project.name}
          </div>
          <div>{project.chain}</div>
          <div className="capitalize text-primary">{project.status}</div>
          <div>{project.members.toLocaleString()}</div>
          <div>{project.campaigns}</div>
        </div>
      ))}
    </div>
  );
}