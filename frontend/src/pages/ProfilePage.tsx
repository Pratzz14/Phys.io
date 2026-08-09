import { FormEvent, useEffect, useState } from "react";
import { Link } from "../router";
import { deleteProfileImage, getProfile, updateProfile, uploadProfileImage } from "../api";
import type { Profile } from "../types";
import { BackIcon, MessageIcon, SaveIcon, UploadIcon, UserIcon } from "../components/Icons";

const painFields = [["neck_pain", "Neck"], ["shoulder_pain", "Shoulder"], ["elbow_pain", "Elbow"], ["back_pain", "Back"], ["knee_pain", "Knee"], ["ankle_pain", "Ankle"]] as const;

export function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null); const [status, setStatus] = useState(""); const [loadError, setLoadError] = useState(""); const [actionError, setActionError] = useState("");
  useEffect(() => { void getProfile().then(setProfile).catch((err) => setLoadError(err instanceof Error ? err.message : "Unable to load profile")); }, []);
  if (loadError) return <div className="page-empty"><h1>Unable to load profile</h1><p>{loadError}</p></div>;
  if (!profile) return <div className="loading-screen">Loading profile<span className="loading-pulse">…</span></div>;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setStatus(""); setActionError(""); const data = new FormData(event.currentTarget);
    try {
      const updated = await updateProfile({ fullname: String(data.get("fullname") ?? ""), phone: String(data.get("phone") ?? ""), age: Number(data.get("age") ?? 0), weight: Number(data.get("weight") ?? 0), height: Number(data.get("height") ?? 0), gender: (String(data.get("gender") ?? "unspecified") as Profile["gender"]), specify: String(data.get("specify") ?? ""), neck_pain: Number(data.get("neck_pain") ?? 0), shoulder_pain: Number(data.get("shoulder_pain") ?? 0), elbow_pain: Number(data.get("elbow_pain") ?? 0), back_pain: Number(data.get("back_pain") ?? 0), knee_pain: Number(data.get("knee_pain") ?? 0), ankle_pain: Number(data.get("ankle_pain") ?? 0) });
      setProfile(updated); setStatus("Profile saved");
    } catch (err) { setActionError(err instanceof Error ? err.message : "Unable to save profile"); }
  };
  const upload = async (file?: File) => { if (!file) return; setStatus(""); setActionError(""); try { setProfile(await uploadProfileImage(file)); setStatus("Photo updated"); } catch (err) { setActionError(err instanceof Error ? err.message : "Unable to upload image"); } };
  const removeImage = async () => { setStatus(""); setActionError(""); try { setProfile(await deleteProfileImage()); setStatus("Photo removed"); } catch (err) { setActionError(err instanceof Error ? err.message : "Unable to remove image"); } };

  return (
    <div className="form-page page-container">
      <div className="page-title-row profile-title"><div><p className="eyebrow">Your profile</p><h1>Keep your movement context close.</h1><p className="lead">Keep these values current so your exercise choices stay relevant.</p></div><Link className="secondary-button" to="/dashboard"><BackIcon size={18} /> Back to dashboard</Link></div>
      {status && <div className="form-alert success-alert"><span>✓</span>{status}</div>}
      {actionError && <div className="form-alert error-alert"><span>!</span>{actionError}</div>}
      <form className="profile-form surface-panel" onSubmit={submit}>
        <div className="profile-edit-grid">
          <section className="profile-identity">
            <div className="section-heading-title"><UserIcon size={22} /><h2>Your profile</h2></div>
            <div className="profile-identity-body">{profile.image_url ? <img className="profile-avatar large profile-image" src={profile.image_url} alt="Your profile" /> : <div className="profile-avatar large">{profile.name.slice(0, 1).toUpperCase()}</div>}<div><h3>{profile.name}</h3><p className="muted">{profile.email}</p><label className="upload-button"><UploadIcon size={17} /> Change photo<input type="file" accept="image/jpeg,image/png" onChange={(event) => void upload(event.target.files?.[0])} /></label>{profile.image_url && <button type="button" className="text-button" onClick={() => void removeImage()}>Remove photo</button>}<small className="field-hint">JPG, PNG or WEBP. Max 5MB.</small></div></div>
          </section>
          <section className="profile-fields"><div className="form-grid"><label>Full name<input name="fullname" defaultValue={profile.fullname} /></label><label>Phone<input name="phone" defaultValue={profile.phone} /></label><label>Age<input name="age" type="number" min="0" max="120" defaultValue={profile.age} /></label><label>Weight (kg)<input name="weight" type="number" min="0" max="500" defaultValue={profile.weight} /></label><label>Height (cm)<input name="height" type="number" min="0" max="300" defaultValue={profile.height} /></label><label>Gender<select name="gender" defaultValue={profile.gender}><option value="unspecified">Prefer not to say</option><option value="female">Female</option><option value="male">Male</option><option value="other">Other</option></select></label></div></section>
        </div>
        <div className="profile-lower-grid">
          <section className="form-section pain-editor"><div className="section-heading-title"><UserIcon size={21} /><div><h2>Pain range</h2><p className="muted">Rate each area from 0 (no pain) to 50 (worst).</p></div></div><div className="pain-form-grid">{painFields.map(([key, label]) => <label key={key}><span>{label}</span><input className="range-input" name={key} type="range" min="0" max="50" defaultValue={profile[key]} /><output>{profile[key]}</output></label>)}</div></section>
          <section className="form-section pain-description"><div className="section-heading-title"><MessageIcon size={21} /><h2>Describe your pain</h2></div><p className="muted">Add any details about where you feel discomfort and what makes it better or worse.</p><textarea name="specify" defaultValue={profile.specify} maxLength={1000} rows={7} placeholder="e.g., Stiffness in the lower back in the mornings. Better after walking." /></section>
        </div>
        <div className="form-actions"><span className="action-status">{status || actionError}</span><button className="primary-button" type="submit"><SaveIcon size={18} /> Save profile</button></div>
      </form>
    </div>
  );
}
