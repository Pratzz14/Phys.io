import { Link, usePath } from "../router";
import { ExerciseMonitor } from "../components/ExerciseMonitor";
import { exercises } from "../data/exercises";
import { BackIcon, BookIcon, CheckIcon, ClipboardIcon, PlayIcon } from "../components/Icons";
import { PoseSequence } from "../components/MovementVisual";

export function ExercisePage() {
  const path = usePath();
  const exerciseId = path.split("/").filter(Boolean).pop();
  const exercise = exercises.find((item) => item.id === exerciseId);
  if (!exercise) return <div className="page-empty"><h1>Exercise not found</h1><Link className="secondary-button" to="/exercises"><BackIcon size={18} /> Browse exercises</Link></div>;

  if (exercise.mode === "live") {
    return (
      <div className="exercise-page live-monitor-page page-container">
        <ExerciseMonitor exercise={exercise}>
          <div className="monitor-panel-intro">
            <div className="live-heading-row"><div><p className="eyebrow">Browser monitoring</p><h1>{exercise.title}</h1><p className="lead">{exercise.description}. Find a steady pace and let your body lead.</p></div><Link className="secondary-button" to="/exercises"><BackIcon size={18} /> Back to exercises</Link></div>
          </div>
        </ExerciseMonitor>
      </div>
    );
  }

  const guidance = exercise.guidance;
  if (!guidance) return <div className="page-empty"><h1>Guidance unavailable</h1><p>This exercise does not have guidance content yet.</p><Link className="secondary-button" to="/exercises"><BackIcon size={18} /> Browse exercises</Link></div>;

  return (
    <div className="exercise-page page-container guidance-page">
      <div className="page-title-row guidance-title">
        <div><p className="eyebrow">Exercise guidance</p><h1>{exercise.title}</h1><p className="lead">{exercise.description}. Find a steady pace and let your body lead.</p></div>
        <Link className="secondary-button" to="/exercises"><BackIcon size={18} /> Back to exercises</Link>
      </div>
      <div className="exercise-layout">
        <section className="live-card surface-panel">
          <div className="section-heading-title"><BookIcon size={22} /><div><p className="eyebrow">Guidance only</p><h2>{exercise.area} practice</h2></div></div>
          <div className="guidance-panel"><p>{guidance.intro} No camera data is collected.</p><PoseSequence frames={guidance.frames} /><div className="guidance-steps">{guidance.steps.map((step, index) => <div key={step.title}><span>{index + 1}</span><strong>{step.title}</strong><p>{step.description}</p></div>)}</div></div>
        </section>
        <aside className="exercise-aside surface-panel">
          <div className="section-heading-title"><ClipboardIcon size={22} /><h2>Before you begin</h2></div>
          <ol>{guidance.checklist.map((item) => <li key={item}><CheckIcon size={18} /><span>{item}</span></li>)}</ol>
          {exercise.videoUrl && <div className="video-note"><span>Reference video</span><a href={exercise.videoUrl} target="_blank" rel="noreferrer"><PlayIcon size={18} /> Open exercise guidance</a></div>}
        </aside>
      </div>
    </div>
  );
}
