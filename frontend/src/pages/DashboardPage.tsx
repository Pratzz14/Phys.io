import { useEffect, useState } from "react";
import { Link } from "../router";
import { getProfile } from "../api";
import { exercises } from "../data/exercises";
import type { Profile } from "../types";
import { ArrowIcon, CameraIcon, ExerciseIcon, InfoIcon, LockIcon, SunIcon, UserIcon } from "../components/Icons";
import { MovementVisual } from "../components/MovementVisual";
import { PAIN_MAX, painAreas, painPercent } from "../data/painAreas";
import { greetingForHour } from "../utils/timeGreeting";

export function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState("");
  const greeting = greetingForHour(new Date().getHours());

  useEffect(() => {
    void getProfile().then(setProfile).catch((err) => setError(err instanceof Error ? err.message : "Unable to load profile"));
  }, []);

  if (error) return <div className="page-empty"><h1>We could not load your profile.</h1><p>{error}</p></div>;
  if (!profile) return <div className="loading-screen">Preparing your dashboard<span className="loading-pulse">{"\u2026"}</span></div>;

  return (
    <div className="dashboard-page page-container">
      <section className="welcome-row">
        <div>
          <p className="eyebrow">Your movement space</p>
          <h1>{greeting}, {profile.name}</h1>
          <p className="lead">Move with confidence, one steady repetition at a time.</p>
        </div>
        <Link className="secondary-button" to="/profile">Update profile <ArrowIcon size={18} /></Link>
      </section>

      <div className="dashboard-grid">
        <section className="monitor-card surface-panel">
          <div className="section-heading">
            <div className="section-heading-title"><CameraIcon size={21} /><div><p className="eyebrow">Live monitoring</p><h2>Make your next move count</h2></div></div>
            <span className="camera-ready"><span className="status-dot ready" /> Browser ready</span>
          </div>
          <div className="monitor-illustration">
            <span className="corner-bracket bracket-tl" /><span className="corner-bracket bracket-tr" /><span className="corner-bracket bracket-bl" /><span className="corner-bracket bracket-br" />
            <MovementVisual variant="standing" />
          </div>
          <div className="monitor-footer">
            <div className="monitor-footer-copy"><LockIcon size={17} /><p>Use your camera for real-time feedback. Your video stays on this device.</p></div>
            <Link className="primary-button" to="/exercise/hands-up-down"><CameraIcon size={20} /> Start monitoring <ArrowIcon size={18} /></Link>
          </div>
          <div className="monitor-hints">
            <div><UserIcon size={21} /><span><strong>Full body tracking</strong><small>Keep your whole body in view</small></span></div>
            <div><SunIcon size={21} /><span><strong>Good lighting</strong><small>Face a well-lit area</small></span></div>
            <div><ExerciseIcon size={21} /><span><strong>Comfortable space</strong><small>Move freely and safely</small></span></div>
          </div>
        </section>

        <aside className="dashboard-side">
          <section className="profile-card surface-panel">
            <div className="section-heading">
              <div className="section-heading-title"><UserIcon size={21} /><div><p className="eyebrow">Your profile</p><h2>Keep it personal</h2></div></div>
              {profile.image_url ? <img className="profile-avatar profile-image" src={profile.image_url} alt="Your profile" /> : <div className="profile-avatar">{profile.name.slice(0, 1).toUpperCase()}</div>}
            </div>
            <dl className="profile-details">
              <div><dt>Name</dt><dd>{profile.fullname || profile.name}</dd></div>
              <div><dt>Focus</dt><dd>Mobility &amp; strength</dd></div>
              <div><dt>Age</dt><dd>{profile.age || "Not set"}</dd></div>
            </dl>
            <div className="pain-section">
              <div className="pain-heading"><h3>Pain range</h3><span><i className="legend low" /> Low <i className="legend high" /> High</span></div>
              <div className="pain-list">
                {painAreas.map(({ label, key }) => {
                  const value = profile[key];
                  const percent = painPercent(value);
                  const markerPosition = `clamp(7.5px, ${percent}%, calc(100% - 7.5px))`;
                  return <div className="pain-row" key={key} aria-label={`${label}: ${value} out of ${PAIN_MAX}`}><span>{label}</span><div className="pain-track"><span style={{ width: `${percent}%` }} /><b style={{ left: markerPosition }} /></div></div>;
                })}
              </div>
              <p className="pain-note"><InfoIcon size={15} /> Update your pain level anytime in your profile.</p>
            </div>
          </section>

          <section className="recommendations surface-panel">
            <div className="section-heading-title"><ExerciseIcon size={21} /><div><p className="eyebrow">Recommended exercises</p><h2>Build a gentle rhythm</h2></div></div>
            <div className="exercise-row">
              {exercises.slice(0, 3).map((exercise) => <Link to={`/exercise/${exercise.id}`} className="exercise-card" key={exercise.id}>
                <div className={`exercise-art ${exercise.accent}`}><MovementVisual variant={exercise.id === "neck-release" ? "neck" : "shoulder"} compact /></div>
                <div><h3>{exercise.title}</h3><p>{exercise.description}</p></div>
                <span className={`status-badge ${exercise.mode === "live" ? "live" : "guided"}`}><span className="status-dot" />{exercise.mode === "live" ? "Live" : "Guided"}</span>
                <ArrowIcon className="exercise-arrow" size={18} />
              </Link>)}
            </div>
            <Link className="text-link" to="/exercises">View all exercises <ArrowIcon size={17} /></Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
