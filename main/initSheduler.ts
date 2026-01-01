import Bree from 'bree';
import path from 'path';
import main from 'main';

let bree: Bree;

export async function initScheduler(interval: string) {
  const jobsRoot = path.join(__dirname, '..', '..', 'jobs');

  if (bree) {
    await bree.stop();
  }

  // No jobs scheduled for now
  return;

  bree = new Bree({
    root: jobsRoot,
    defaultExtension: 'ts',
    jobs: [],
    worker: {
      argv: ['--require', 'ts-node/register'],
    },
  });

  await bree.start();
}
