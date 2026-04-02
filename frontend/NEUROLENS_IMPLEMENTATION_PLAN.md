## NeuroLens Project Status, Next Tasks, and 5-Member Work Split

### 1) What is already done now

#### Core product foundation
- Full-stack project is running with frontend and backend integrated.
- Authentication system is working with Firebase login/register flow.
- Email verification flow is implemented (code send, verify, resend cooldown, attempt limit).

#### Core neurological tests
- Voice Stability Test is implemented end-to-end.
- Spiral Drawing Test is implemented end-to-end.
- Tap Speed Test is implemented end-to-end.
- Test orchestration page exists to complete all tests in one flow.

#### AI and scoring engine
- Voice analysis pipeline is implemented with extracted acoustic features.
- Backend model loading and scoring logic exist (with fallback scoring path).
- Spiral and tap metrics engines are implemented.
- Final weighted score formula is implemented:
  - Final Score = 0.4 x Voice + 0.4 x Spiral + 0.2 x Tap

#### User platform layer
- User dashboard exists.
- History page exists and shows prior test results.
- Test results are stored per user with timestamp.
- Weekly trend data endpoint exists and is shown with a chart on dashboard.

#### Competition-readiness progress
- Project is already beyond a basic student demo and qualifies as a functional monitoring MVP.

---

### 2) What we need to do now (high-priority roadmap gaps)

#### A. Baseline intelligence layer
- Implement personal baseline using first 3 tests per user.
- Show baseline value clearly in product.
- Compute deviation from baseline for each new test.

#### B. Trend interpretation engine
- Add explicit interpretation from score movement:
  - Improving
  - Stable
  - Declining
- Show this text insight on dashboard/results.

#### C. Risk classification clarity
- Standardize risk labels and show everywhere consistently:
  - Low risk: 80+
  - Moderate risk: 60-79
  - High risk: below 60
- Use clear visual badges and explanatory text.

#### D. Report generation
- Build downloadable report with:
  - Latest score
  - Baseline
  - Deviation
  - Trend summary
  - Risk level
  - Recommendation text
- If PDF is time-heavy, first ship printable/downloadable report page.

#### E. Doctor summary mode
- Create concise clinician-facing summary block for recent period.
- Include plain language and non-diagnostic caution text.

#### F. Dashboard final winning layout
- Dashboard should include in one screen:
  - Latest Score
  - Baseline Score
  - Deviation
  - Trend Chart
  - Risk Level
  - Start Test
  - History
  - Download Report

#### G. Demo polish and reliability
- Improve loading states and transitions.
- Ensure responsive behavior on desktop + mobile.
- Prepare fixed demo script and rehearsal dataset.

#### H. Model retraining for better accuracy (critical)
- Audit current voice model failure cases from real test sessions.
- Build clean training dataset pipeline (remove noisy clips, normalize labels, verify class balance).
- Retrain and compare multiple models (RandomForest baseline plus one stronger candidate such as XGBoost/LightGBM if available).
- Use cross-validation and a holdout set; report metrics (accuracy, precision, recall, F1, confusion matrix).
- Tune decision thresholds to reduce false positives/false negatives for screening use.
- Replace production model only if new model beats current baseline on agreed metrics.
- Version model artifacts and keep rollback file (for example: model_v1.pkl, model_v2.pkl).
- Update backend inference integration and run end-to-end tests with real audio samples.

---

### 3) Work division for 5 team members

#### Member 1 - Backend Intelligence Lead
Scope:
- Baseline computation and storage strategy
- Deviation calculation
- Trend interpretation logic
Deliverables:
- API responses return baseline, deviation, trend label
- Correct handling for users with fewer than 3 tests
Success criteria:
- Verified with test users and timestamp-ordered data

#### Member 2 - Backend Reporting and Summary Lead
Scope:
- Report generation endpoint
- Doctor summary endpoint/template
Deliverables:
- Downloadable report output (printable page first, PDF optional)
- Clinician summary with concise trends and recommendations
Success criteria:
- One-click report generation from latest user data

#### Member 3 - Frontend Dashboard and Results Lead
Scope:
- Dashboard redesign to include all key intelligence blocks
- Results page enhancement with trend and risk explanation
Deliverables:
- Dashboard shows latest/baseline/deviation/trend/risk/actions
- Results page clearly communicates interpretation
Success criteria:
- UI matches winning checklist and is easy to demo live

#### Member 4 - Frontend Integration and UX Polish Lead
Scope:
- Connect new backend endpoints to frontend API client
- History page improvement and export/report entry points
- UI polish: loading, transitions, responsiveness
Deliverables:
- Stable frontend integration for new intelligence/report fields
- Smooth user experience across key pages
Success criteria:
- No broken API states; clean mobile and desktop behavior

#### Member 5 - ML Retraining, QA, and Demo Lead
Scope:
- Model retraining pipeline for voice prediction accuracy
- Evaluate model metrics and choose deployment candidate
- End-to-end testing of all flows
- Build demo script and fallback script
- Seed and verify demo accounts/data
Deliverables:
- Retrained model package with validation report and rollback artifact
- Bug list with priority and owner mapping
- Final rehearsed presentation flow
Success criteria:
- Retrained model improves agreed metrics and full demo runs without blockers under time pressure

---

### 4) Suggested execution order (fastest to winning)

1. Model retraining audit + dataset cleanup (start in parallel immediately)
2. Baseline + deviation backend
3. Trend interpretation + risk standardization
4. Dashboard UI completion
5. Report generation + doctor summary
6. Integrate new model into backend + regression testing
7. Full QA pass + demo rehearsal + polish freeze

---

### 5) Definition of done before final submission

- Voice, spiral, tap tests fully working
- Voice model retrained and validated with improved metrics
- Weighted final score working and persisted
- Baseline and deviation visible and correct
- Trend interpretation visible and correct
- Risk level visible and consistent
- Dashboard includes all winning blocks
- History is correct and readable
- Report download works
- Doctor summary works
- End-to-end demo flow is rehearsed and stable
