import { Link, usePath } from "../router";
import { ExerciseMonitor } from "../components/ExerciseMonitor";
import { exercises } from "../data/exercises";

export function ExercisePage() {
  const path = usePath(); const exerciseId = path.split("/").filter(Boolean).pop(); const exercise = exercises.find((item) => item.id === exerciseId);
  if (!exercise) return <div className="page-empty"><h1>Exercise not found</h1><Link className="secondary-button" to="/exercises">Browse exercises</Link></div>;
  const isLive = exercise.mode === "live";
  if (isLive) {
    return (
      <div className="exercise-page live-monitor-page">
        <ExerciseMonitor exercise={exercise}>
          <div className="monitor-panel-intro">
            <p className="eyebrow">Browser monitoring</p>
            <h1>{exercise.title}</h1>
            <p className="lead">{exercise.description}. Find a steady pace and let your body lead.</p>
            <Link className="secondary-button" to="/exercises">Back to exercises</Link>
          </div>
        </ExerciseMonitor>
      </div>
    );
  }
  return (
    <div className="exercise-page">
      <div className="page-title-row">
        <div>
          <p className="eyebrow">Exercise guidance</p>
          <h1>{exercise.title}</h1>
          <p className="lead">{exercise.description}. Find a steady pace and let your body lead.</p>
        </div>
        <Link className="secondary-button" to="/exercises">Back to exercises</Link>
      </div>
      <div className="exercise-layout">
        <section className="live-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Guidance only</p>
              <h2>{exercise.area} practice</h2>
            </div>
          </div>
          <div className="guidance-panel"><p>This exercise does not yet have a trained live classifier. Follow the guidance at a comfortable pace; no camera data is collected.</p></div>
        </section>
        <aside className="exercise-aside">
          <h2>Before you begin</h2>
          <ol>
            <li>Place your device where your full movement is visible.</li>
            <li>Keep the room well lit and make space around you.</li>
            <li>Move slowly; the feedback is here to help you notice rhythm.</li>
          </ol>
          {exercise.videoUrl && <div className="video-note"><span>Reference video</span><a href={exercise.videoUrl} target="_blank" rel="noreferrer">Open exercise guidance →</a></div>}
        </aside>
      </div>
    </div>
  );
}
