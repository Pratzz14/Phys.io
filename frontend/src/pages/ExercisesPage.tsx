import { Link } from "../router";
import { exercises } from "../data/exercises";

export function ExercisesPage() {
  return <div className="exercise-page"><div className="page-title-row"><div><p className="eyebrow">Your library</p><h1>Choose your next movement.</h1><p className="lead">Live monitoring is available for exercises with a trained classifier.</p></div><Link className="secondary-button" to="/dashboard">Back to dashboard</Link></div><div className="exercise-catalog">{exercises.map((exercise) => <Link key={exercise.id} to={`/exercise/${exercise.id}`} className="catalog-card"><div className={`exercise-art ${exercise.accent}`}>✦</div><div><p className="eyebrow">{exercise.mode === "live" ? "Live monitoring" : "Guidance only"}</p><h2>{exercise.title}</h2><p className="muted">{exercise.description}</p></div></Link>)}</div></div>;
}
