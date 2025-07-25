import { ProjectType } from "../model/Deployments.model";
import { processJob } from "./worker";

export type BuildJob = {
  buildId: string; // Now the short build_name (e.g., "julpq")
  deploymentId: string;
  userId: string;
  repo_url: string;
  slug: string;
  project_type: ProjectType;
  buildCommands?: string;
};

const q: BuildJob[] = [];
let activeCount = 0;
const MAX_CONCURRENT = 1;

export function enqueueBuild(job: BuildJob) {
  console.log(`[Queue] enqueue build ${job.buildId}`);
  q.push(job);
  tick();
}

async function tick() {
  if (activeCount >= MAX_CONCURRENT) return;
  const job = q.shift();
  if (!job) return;

  activeCount++;
  console.log(`[Queue] start build ${job.buildId}`);
  processJob(job)
    .then((logs) => {
      console.log(`[Queue] build ${job.buildId} complete (${logs.length} log lines)`);
    })
    .catch((err) => {
      console.error(`[Queue] build ${job.buildId} error`, err);
    })
    .finally(() => {
      activeCount--;
      tick();
    });
}