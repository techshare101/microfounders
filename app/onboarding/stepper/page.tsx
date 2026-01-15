"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase/client";
import {
  ONBOARDING_STEPS,
  STEP_METADATA,
  SKILL_OPTIONS,
  NEED_OPTIONS,
  TIMEZONE_OPTIONS,
  ARCHETYPE_OPTIONS,
  STAGE_OPTIONS,
  AVAILABILITY_OPTIONS,
  calculateProgress,
  validateStep,
  type OnboardingStep,
  type OnboardingData,
  type SkillEntry,
  type NeedEntry,
} from "../../../lib/onboarding/types";
import styles from "./stepper.module.css";

export default function OnboardingStepper() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passportId, setPassportId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("welcome");
  const [data, setData] = useState<OnboardingData>({});

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  async function checkAuthAndLoadData() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email) {
      router.push("/login?redirect=/onboarding/stepper");
      return;
    }

    // Check for existing passport
    const { data: passport } = await supabase
      .from("mf_founder_passports")
      .select("*")
      .eq("email", user.email)
      .single();

    if (!passport) {
      // No passport - redirect to pending page
      router.push("/onboarding");
      return;
    }

    if (passport.onboarding_completed) {
      // Already completed - go to lounge
      router.push("/lounge");
      return;
    }

    setPassportId(passport.id);

    // Load existing data
    setData({
      displayName: passport.display_name || "",
      bio: passport.bio || "",
      currentProject: passport.current_project || "",
      projectUrl: passport.project_url || "",
      projectStage: passport.project_stage || undefined,
      timezone: passport.timezone || "",
      availability: passport.availability || undefined,
      weeklyHoursAvailable: passport.weekly_hours_available || undefined,
      archetype: passport.archetype || undefined,
    });

    // Load skills
    const { data: skills } = await supabase
      .from("mf_passport_skills")
      .select("*")
      .eq("passport_id", passport.id);

    if (skills && skills.length > 0) {
      setData(prev => ({
        ...prev,
        skills: skills.map(s => ({
          skill: s.skill_name,
          proficiency: s.proficiency_level,
          willingToHelp: s.willing_to_help,
        })),
      }));
    }

    // Load needs
    const { data: needs } = await supabase
      .from("mf_passport_needs")
      .select("*")
      .eq("passport_id", passport.id);

    if (needs && needs.length > 0) {
      setData(prev => ({
        ...prev,
        needs: needs.map(n => ({
          need: n.need_type,
          priority: n.priority,
          description: n.description,
        })),
      }));
    }

    setLoading(false);
  }

  async function saveProgress() {
    if (!passportId) return;

    setSaving(true);
    setError(null);

    try {
      // Update passport
      const { error: updateError } = await supabase
        .from("mf_founder_passports")
        .update({
          display_name: data.displayName || null,
          bio: data.bio || null,
          current_project: data.currentProject || null,
          project_url: data.projectUrl || null,
          project_stage: data.projectStage || null,
          timezone: data.timezone || null,
          availability: data.availability || null,
          weekly_hours_available: data.weeklyHoursAvailable || null,
          archetype: data.archetype || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", passportId);

      if (updateError) throw updateError;

      // Update skills
      if (data.skills && data.skills.length > 0) {
        // Delete existing
        await supabase
          .from("mf_passport_skills")
          .delete()
          .eq("passport_id", passportId);

        // Insert new
        const skillRows = data.skills.map(s => ({
          passport_id: passportId,
          skill_name: s.skill,
          proficiency_level: s.proficiency,
          willing_to_help: s.willingToHelp,
        }));

        await supabase.from("mf_passport_skills").insert(skillRows);
      }

      // Update needs
      if (data.needs && data.needs.length > 0) {
        // Delete existing
        await supabase
          .from("mf_passport_needs")
          .delete()
          .eq("passport_id", passportId);

        // Insert new
        const needRows = data.needs.map(n => ({
          passport_id: passportId,
          need_type: n.need,
          priority: n.priority,
          description: n.description || null,
        }));

        await supabase.from("mf_passport_needs").insert(needRows);
      }
    } catch (err) {
      console.error("Error saving progress:", err);
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function completeOnboarding() {
    if (!passportId) return;

    setSaving(true);
    setError(null);

    try {
      await saveProgress();

      // Mark onboarding as complete
      const { error: completeError } = await supabase
        .from("mf_founder_passports")
        .update({
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq("id", passportId);

      if (completeError) throw completeError;

      setCurrentStep("complete");
    } catch (err) {
      console.error("Error completing onboarding:", err);
      setError("Failed to complete. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function goToStep(step: OnboardingStep) {
    setCurrentStep(step);
    setError(null);
  }

  function nextStep() {
    const currentIndex = ONBOARDING_STEPS.indexOf(currentStep);
    if (currentIndex < ONBOARDING_STEPS.length - 1) {
      saveProgress();
      setCurrentStep(ONBOARDING_STEPS[currentIndex + 1]);
      setError(null);
    }
  }

  function prevStep() {
    const currentIndex = ONBOARDING_STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(ONBOARDING_STEPS[currentIndex - 1]);
      setError(null);
    }
  }

  function toggleSkill(skill: string) {
    const current = data.skills || [];
    const exists = current.find(s => s.skill === skill);

    if (exists) {
      setData(prev => ({
        ...prev,
        skills: current.filter(s => s.skill !== skill),
      }));
    } else {
      setData(prev => ({
        ...prev,
        skills: [...current, { skill, proficiency: "competent", willingToHelp: true }],
      }));
    }
  }

  function toggleNeed(need: string) {
    const current = data.needs || [];
    const exists = current.find(n => n.need === need);

    if (exists) {
      setData(prev => ({
        ...prev,
        needs: current.filter(n => n.need !== need),
      }));
    } else {
      setData(prev => ({
        ...prev,
        needs: [...current, { need, priority: "medium" }],
      }));
    }
  }

  const progress = calculateProgress({ 
    passportId: passportId || "", 
    currentStep, 
    completedSteps: [], 
    startedAt: "", 
    lastUpdatedAt: "", 
    data 
  });

  const stepMeta = STEP_METADATA[currentStep];
  const stepIndex = ONBOARDING_STEPS.indexOf(currentStep);

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      {/* Header with progress */}
      {currentStep !== "welcome" && currentStep !== "complete" && (
        <header className={styles.header}>
          <div className={styles.logo}>
            <span className={styles.logoMark}>◆</span>
            <span className={styles.logoText}>MicroFounder</span>
          </div>

          <div className={styles.progressBar}>
            <div className={styles.progressTrack}>
              <div 
                className={styles.progressFill} 
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className={styles.progressText}>
              Step {stepIndex} of {ONBOARDING_STEPS.length - 2}
            </p>
          </div>

          <button 
            className={styles.exitBtn}
            onClick={() => router.push("/onboarding")}
          >
            Save & Exit
          </button>
        </header>
      )}

      {/* Main content */}
      <main className={styles.main}>
        <div className={styles.stepContainer}>
          {error && <div className={styles.error}>{error}</div>}

          {/* Welcome Step */}
          {currentStep === "welcome" && (
            <div className={styles.welcomeContent}>
              <div className={styles.welcomeIcon}>◆</div>
              <h1 className={styles.welcomeTitle}>Welcome to MicroFounder</h1>
              <p className={styles.welcomeText}>
                Let's set up your Founder Passport. This helps us match you with 
                the right people and circles.
              </p>
              <ul className={styles.welcomeList}>
                <li>Takes about 5 minutes</li>
                <li>You can save and continue later</li>
                <li>Your information is private by default</li>
              </ul>
              <button 
                className={styles.startBtn}
                onClick={() => goToStep("identity")}
              >
                Get Started
              </button>
            </div>
          )}

          {/* Identity Step */}
          {currentStep === "identity" && (
            <>
              <div className={styles.stepHeader}>
                <p className={styles.stepNumber}>Step 1</p>
                <h2 className={styles.stepTitle}>{stepMeta.title}</h2>
                <p className={styles.stepSubtitle}>{stepMeta.subtitle}</p>
              </div>

              <div className={styles.form}>
                <div className={styles.field}>
                  <label className={styles.label}>Display Name *</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={data.displayName || ""}
                    onChange={(e) => setData(prev => ({ ...prev, displayName: e.target.value }))}
                    placeholder="How you'd like to be called"
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Bio</label>
                  <textarea
                    className={`${styles.input} ${styles.textarea}`}
                    value={data.bio || ""}
                    onChange={(e) => setData(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="A brief intro about yourself..."
                  />
                  <p className={styles.hint}>Optional. 2-3 sentences is perfect.</p>
                </div>
              </div>

              <nav className={styles.nav}>
                <button className={styles.backBtn} onClick={prevStep}>
                  ← Back
                </button>
                <button 
                  className={styles.nextBtn} 
                  onClick={nextStep}
                  disabled={!data.displayName || data.displayName.length < 2}
                >
                  Continue →
                </button>
              </nav>
            </>
          )}

          {/* Project Step */}
          {currentStep === "project" && (
            <>
              <div className={styles.stepHeader}>
                <p className={styles.stepNumber}>Step 2</p>
                <h2 className={styles.stepTitle}>{stepMeta.title}</h2>
                <p className={styles.stepSubtitle}>{stepMeta.subtitle}</p>
              </div>

              <div className={styles.form}>
                <div className={styles.field}>
                  <label className={styles.label}>What are you building? *</label>
                  <textarea
                    className={`${styles.input} ${styles.textarea}`}
                    value={data.currentProject || ""}
                    onChange={(e) => setData(prev => ({ ...prev, currentProject: e.target.value }))}
                    placeholder="Describe your current project or focus..."
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Project URL</label>
                  <input
                    type="url"
                    className={styles.input}
                    value={data.projectUrl || ""}
                    onChange={(e) => setData(prev => ({ ...prev, projectUrl: e.target.value }))}
                    placeholder="https://..."
                  />
                  <p className={styles.hint}>Optional. Website, landing page, or repo.</p>
                </div>
              </div>

              <nav className={styles.nav}>
                <button className={styles.backBtn} onClick={prevStep}>
                  ← Back
                </button>
                <button 
                  className={styles.nextBtn} 
                  onClick={nextStep}
                  disabled={!data.currentProject || data.currentProject.length < 5}
                >
                  Continue →
                </button>
              </nav>
            </>
          )}

          {/* Stage Step */}
          {currentStep === "stage" && (
            <>
              <div className={styles.stepHeader}>
                <p className={styles.stepNumber}>Step 3</p>
                <h2 className={styles.stepTitle}>{stepMeta.title}</h2>
                <p className={styles.stepSubtitle}>{stepMeta.subtitle}</p>
              </div>

              <div className={styles.optionGrid}>
                {STAGE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    className={`${styles.optionCard} ${data.projectStage === option.value ? styles.optionCardSelected : ""}`}
                    onClick={() => setData(prev => ({ ...prev, projectStage: option.value }))}
                  >
                    <p className={styles.optionTitle}>{option.label}</p>
                    <p className={styles.optionDesc}>{option.description}</p>
                  </button>
                ))}
              </div>

              <nav className={styles.nav}>
                <button className={styles.backBtn} onClick={prevStep}>
                  ← Back
                </button>
                <button 
                  className={styles.nextBtn} 
                  onClick={nextStep}
                  disabled={!data.projectStage}
                >
                  Continue →
                </button>
              </nav>
            </>
          )}

          {/* Skills Step */}
          {currentStep === "skills" && (
            <>
              <div className={styles.stepHeader}>
                <p className={styles.stepNumber}>Step 4</p>
                <h2 className={styles.stepTitle}>{stepMeta.title}</h2>
                <p className={styles.stepSubtitle}>{stepMeta.subtitle}</p>
              </div>

              <div className={styles.tagGrid}>
                {SKILL_OPTIONS.map((skill) => (
                  <button
                    key={skill}
                    className={`${styles.tag} ${data.skills?.some(s => s.skill === skill) ? styles.tagSelected : ""}`}
                    onClick={() => toggleSkill(skill)}
                  >
                    {skill}
                  </button>
                ))}
              </div>

              <p className={styles.hint} style={{ marginTop: "1rem" }}>
                Select all that apply. These help us match you with founders who need your expertise.
              </p>

              <nav className={styles.nav}>
                <button className={styles.backBtn} onClick={prevStep}>
                  ← Back
                </button>
                <button 
                  className={styles.nextBtn} 
                  onClick={nextStep}
                  disabled={!data.skills || data.skills.length === 0}
                >
                  Continue →
                </button>
              </nav>
            </>
          )}

          {/* Needs Step */}
          {currentStep === "needs" && (
            <>
              <div className={styles.stepHeader}>
                <p className={styles.stepNumber}>Step 5</p>
                <h2 className={styles.stepTitle}>{stepMeta.title}</h2>
                <p className={styles.stepSubtitle}>{stepMeta.subtitle}</p>
              </div>

              <div className={styles.tagGrid}>
                {NEED_OPTIONS.map((need) => (
                  <button
                    key={need}
                    className={`${styles.tag} ${data.needs?.some(n => n.need === need) ? styles.tagSelected : ""}`}
                    onClick={() => toggleNeed(need)}
                  >
                    {need}
                  </button>
                ))}
              </div>

              <p className={styles.hint} style={{ marginTop: "1rem" }}>
                Select all that apply. This helps us find founders who can help you.
              </p>

              <nav className={styles.nav}>
                <button className={styles.backBtn} onClick={prevStep}>
                  ← Back
                </button>
                <button 
                  className={styles.nextBtn} 
                  onClick={nextStep}
                  disabled={!data.needs || data.needs.length === 0}
                >
                  Continue →
                </button>
              </nav>
            </>
          )}

          {/* Availability Step */}
          {currentStep === "availability" && (
            <>
              <div className={styles.stepHeader}>
                <p className={styles.stepNumber}>Step 6</p>
                <h2 className={styles.stepTitle}>{stepMeta.title}</h2>
                <p className={styles.stepSubtitle}>{stepMeta.subtitle}</p>
              </div>

              <div className={styles.form}>
                <div className={styles.field}>
                  <label className={styles.label}>Timezone *</label>
                  <select
                    className={styles.input}
                    value={data.timezone || ""}
                    onChange={(e) => setData(prev => ({ ...prev, timezone: e.target.value }))}
                  >
                    <option value="">Select your timezone</option>
                    {TIMEZONE_OPTIONS.map((tz) => (
                      <option key={tz.value} value={tz.value}>{tz.label}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Availability *</label>
                  <div className={styles.optionGrid}>
                    {AVAILABILITY_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        className={`${styles.optionCard} ${data.availability === option.value ? styles.optionCardSelected : ""}`}
                        onClick={() => setData(prev => ({ ...prev, availability: option.value }))}
                      >
                        <p className={styles.optionTitle}>{option.label}</p>
                        <p className={styles.optionDesc}>{option.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <nav className={styles.nav}>
                <button className={styles.backBtn} onClick={prevStep}>
                  ← Back
                </button>
                <button 
                  className={styles.nextBtn} 
                  onClick={nextStep}
                  disabled={!data.timezone || !data.availability}
                >
                  Continue →
                </button>
              </nav>
            </>
          )}

          {/* Archetype Step */}
          {currentStep === "archetype" && (
            <>
              <div className={styles.stepHeader}>
                <p className={styles.stepNumber}>Step 7</p>
                <h2 className={styles.stepTitle}>{stepMeta.title}</h2>
                <p className={styles.stepSubtitle}>{stepMeta.subtitle}</p>
              </div>

              <div className={styles.optionGrid}>
                {ARCHETYPE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    className={`${styles.optionCard} ${data.archetype === option.value ? styles.optionCardSelected : ""}`}
                    onClick={() => setData(prev => ({ ...prev, archetype: option.value }))}
                  >
                    <p className={styles.optionTitle}>{option.label}</p>
                    <p className={styles.optionDesc}>{option.description}</p>
                  </button>
                ))}
              </div>

              <p className={styles.hint} style={{ marginTop: "1rem" }}>
                Optional. Pick the one that feels most like you.
              </p>

              <nav className={styles.nav}>
                <button className={styles.backBtn} onClick={prevStep}>
                  ← Back
                </button>
                <button className={styles.nextBtn} onClick={nextStep}>
                  Continue →
                </button>
              </nav>
            </>
          )}

          {/* Intent Step */}
          {currentStep === "intent" && (
            <>
              <div className={styles.stepHeader}>
                <p className={styles.stepNumber}>Step 8</p>
                <h2 className={styles.stepTitle}>{stepMeta.title}</h2>
                <p className={styles.stepSubtitle}>{stepMeta.subtitle}</p>
              </div>

              <div className={styles.form}>
                <div className={styles.optionGrid}>
                  <button
                    className={`${styles.optionCard} ${data.intentSignals?.seeking_cofounder ? styles.optionCardSelected : ""}`}
                    onClick={() => setData(prev => ({ 
                      ...prev, 
                      intentSignals: { 
                        ...prev.intentSignals, 
                        seeking_cofounder: !prev.intentSignals?.seeking_cofounder 
                      } 
                    }))}
                  >
                    <p className={styles.optionTitle}>Seeking Co-founder</p>
                    <p className={styles.optionDesc}>Looking for a partner to build with</p>
                  </button>

                  <button
                    className={`${styles.optionCard} ${data.intentSignals?.open_to_collaboration ? styles.optionCardSelected : ""}`}
                    onClick={() => setData(prev => ({ 
                      ...prev, 
                      intentSignals: { 
                        ...prev.intentSignals, 
                        open_to_collaboration: !prev.intentSignals?.open_to_collaboration 
                      } 
                    }))}
                  >
                    <p className={styles.optionTitle}>Open to Collaboration</p>
                    <p className={styles.optionDesc}>Willing to work with other founders</p>
                  </button>

                  <button
                    className={`${styles.optionCard} ${data.intentSignals?.willing_to_mentor ? styles.optionCardSelected : ""}`}
                    onClick={() => setData(prev => ({ 
                      ...prev, 
                      intentSignals: { 
                        ...prev.intentSignals, 
                        willing_to_mentor: !prev.intentSignals?.willing_to_mentor 
                      } 
                    }))}
                  >
                    <p className={styles.optionTitle}>Willing to Mentor</p>
                    <p className={styles.optionDesc}>Guide earlier-stage founders</p>
                  </button>

                  <button
                    className={`${styles.optionCard} ${data.intentSignals?.wants_accountability ? styles.optionCardSelected : ""}`}
                    onClick={() => setData(prev => ({ 
                      ...prev, 
                      intentSignals: { 
                        ...prev.intentSignals, 
                        wants_accountability: !prev.intentSignals?.wants_accountability 
                      } 
                    }))}
                  >
                    <p className={styles.optionTitle}>Seeking Accountability</p>
                    <p className={styles.optionDesc}>Want regular check-ins and support</p>
                  </button>
                </div>
              </div>

              <nav className={styles.nav}>
                <button className={styles.backBtn} onClick={prevStep}>
                  ← Back
                </button>
                <button className={styles.nextBtn} onClick={nextStep}>
                  Continue →
                </button>
              </nav>
            </>
          )}

          {/* Review Step */}
          {currentStep === "review" && (
            <>
              <div className={styles.stepHeader}>
                <p className={styles.stepNumber}>Final Step</p>
                <h2 className={styles.stepTitle}>{stepMeta.title}</h2>
                <p className={styles.stepSubtitle}>{stepMeta.subtitle}</p>
              </div>

              <div className={styles.reviewSection}>
                <p className={styles.reviewLabel}>Name</p>
                <p className={styles.reviewValue}>
                  {data.displayName}
                  <button className={styles.editBtn} onClick={() => goToStep("identity")}>Edit</button>
                </p>
              </div>

              <div className={styles.reviewSection}>
                <p className={styles.reviewLabel}>Project</p>
                <p className={styles.reviewValue}>
                  {data.currentProject}
                  <button className={styles.editBtn} onClick={() => goToStep("project")}>Edit</button>
                </p>
              </div>

              <div className={styles.reviewSection}>
                <p className={styles.reviewLabel}>Stage</p>
                <p className={styles.reviewValue}>
                  {STAGE_OPTIONS.find(s => s.value === data.projectStage)?.label || "Not set"}
                  <button className={styles.editBtn} onClick={() => goToStep("stage")}>Edit</button>
                </p>
              </div>

              <div className={styles.reviewSection}>
                <p className={styles.reviewLabel}>Skills</p>
                <div className={styles.reviewTags}>
                  {data.skills?.map(s => (
                    <span key={s.skill} className={styles.reviewTag}>{s.skill}</span>
                  ))}
                </div>
                <button className={styles.editBtn} onClick={() => goToStep("skills")}>Edit</button>
              </div>

              <div className={styles.reviewSection}>
                <p className={styles.reviewLabel}>Looking For</p>
                <div className={styles.reviewTags}>
                  {data.needs?.map(n => (
                    <span key={n.need} className={styles.reviewTag}>{n.need}</span>
                  ))}
                </div>
                <button className={styles.editBtn} onClick={() => goToStep("needs")}>Edit</button>
              </div>

              <nav className={styles.nav}>
                <button className={styles.backBtn} onClick={prevStep}>
                  ← Back
                </button>
                <button 
                  className={styles.nextBtn} 
                  onClick={completeOnboarding}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Complete Profile →"}
                </button>
              </nav>
            </>
          )}

          {/* Complete Step */}
          {currentStep === "complete" && (
            <div className={styles.completeContent}>
              <div className={styles.completeIcon}>✓</div>
              <h1 className={styles.completeTitle}>You're All Set</h1>
              <p className={styles.completeText}>
                Your Founder Passport is complete. Welcome to the network.
              </p>
              <button 
                className={styles.enterBtn}
                onClick={() => router.push("/lounge")}
              >
                Enter the Lounge
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
