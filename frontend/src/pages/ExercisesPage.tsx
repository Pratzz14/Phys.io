import { Link } from "../router";
import { exercises } from "../data/exercises";
import { ArrowIcon, BackIcon, ExerciseIcon } from "../components/Icons";
import { MovementVisual } from "../components/MovementVisual";
import type { PoseVariant } from "../types";

const poseFor = (id: string): PoseVariant => id === "neck-release" ? "neck" : id === "knee-control" ? "knee" : id === "ankle-mobility" ? "ankle" : id === "elbow-flow" ? "elbow" : "shoulder";

export function ExercisesPage() {
  return (
    <div className="exercise-page page-container">
      <div className="page-title-row">
        <div><p className="eyebrow">Your library</p><h1>Choose your next movement.</h1><p className="lead">Live monitoring is available for exercises with a trained classifier.</p></div>
        <Link className="secondary-button" to="/dashboard"><BackIcon size={18} /> Back to dashboard</Link>
      </div>
      <section className="exercise-library surface-panel">
        <div className="library-head"><div className="section-heading-title"><ExerciseIcon size={21} /><h2>Movement library</h2></div><span className="library-count">{exercises.length} exercises</span></div>
        <div className="exercise-catalog">
          {exercises.map((exercise) => <Link key={exercise.id} to={`/exercise/${exercise.id}`} className="catalog-card">
            <div className={`exercise-art ${exercise.accent}`}><MovementVisual variant={poseFor(exercise.id)} compact /></div>
            <div className="catalog-copy"><p className="eyebrow">{exercise.mode === "live" ? "Live monitoring" : "Guidance only"}</p><h2>{exercise.title}</h2><p className="muted">{exercise.description}</p></div>
            <span className={`status-badge ${exercise.mode === "live" ? "live" : "guided"}`}><span className="status-dot" />{exercise.mode === "live" ? "Live" : "Guided"}</span>
            <ArrowIcon className="catalog-arrow" size={20} />
          </Link>)}
        </div>
      </section>
    </div>
  );
}
