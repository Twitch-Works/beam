import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, CalendarDays, CheckCircle2, Clock, Loader2, MapPin, UserRound, X } from "lucide-react";
import { C, FB, FH } from "../landing/tokens";
import { AppStoreButtons } from "./AppStoreButtons";
import { BeamImg } from "../BeamImg";
import {
  ApiError,
  createGuestBooking,
  createPaymentOrder,
  listClasses,
  listSlots,
  verifyPayment,
  type BookableClass,
  type ClassSlot,
  type GuestBooking,
} from "../../lib/bookingApi";
import { openCheckout } from "../../lib/razorpay";

type Step = "class" | "slot" | "details" | "pay" | "done";
const STEPS: { id: Exclude<Step, "done">; label: string }[] = [
  { id: "class", label: "Class" },
  { id: "slot", label: "Slot" },
  { id: "details", label: "Details" },
  { id: "pay", label: "Pay" },
];

type Details = { parentName: string; phone: string; childName: string; childAge: string };
const EMPTY_DETAILS: Details = { parentName: "", phone: "", childName: "", childAge: "" };

// ── formatting ────────────────────────────────────────────────────────────────

const inr = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

function formatDay(date: string, opts: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" }) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", opts);
}

function formatClock(time: string) {
  const [h, m] = time.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

function validateDetails(d: Details): Partial<Record<keyof Details, string>> {
  const errors: Partial<Record<keyof Details, string>> = {};
  if (d.parentName.trim().length < 2) errors.parentName = "Enter your name";
  const digits = d.phone.replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, "");
  if (!/^[6-9]\d{9}$/.test(digits)) errors.phone = "Enter a valid 10-digit mobile number";
  if (!d.childName.trim()) errors.childName = "Enter your child's name";
  const age = Number(d.childAge);
  if (!Number.isInteger(age) || age < 1 || age > 16) errors.childAge = "Age must be between 1 and 16";
  return errors;
}

// ── modal ─────────────────────────────────────────────────────────────────────

export function BookingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState<Step>("class");
  const [classes, setClasses] = useState<BookableClass[] | null>(null);
  const [selectedClass, setSelectedClass] = useState<BookableClass | null>(null);
  const [slotsByDate, setSlotsByDate] = useState<Record<string, ClassSlot[]> | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<ClassSlot | null>(null);
  const [details, setDetails] = useState<Details>(EMPTY_DETAILS);
  const [touched, setTouched] = useState(false);
  const [booking, setBooking] = useState<GuestBooking | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fresh start every time the modal opens
  useEffect(() => {
    if (!open) return;
    setStep("class");
    setSelectedClass(null);
    setSlotsByDate(null);
    setSelectedDate(null);
    setSelectedSlot(null);
    setDetails(EMPTY_DETAILS);
    setTouched(false);
    setBooking(null);
    setError(null);
    setClasses(null);
    listClasses()
      .then(setClasses)
      .catch((e) => {
        setClasses([]);
        setError(e instanceof Error ? e.message : "Could not load classes.");
      });
  }, [open]);

  // Lock page scroll + Esc to close
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, busy, onClose]);

  const dates = useMemo(() => Object.keys(slotsByDate ?? {}).sort(), [slotsByDate]);
  const detailErrors = validateDetails(details);
  const detailsValid = Object.keys(detailErrors).length === 0;
  const price = selectedClass ? Number(selectedClass.pricePerSession) : 0;

  async function chooseClass(c: BookableClass) {
    setSelectedClass(c);
    setSelectedSlot(null);
    setSelectedDate(null);
    setSlotsByDate(null);
    setError(null);
    setStep("slot");
    try {
      const slots = await listSlots(c.id);
      setSlotsByDate(slots);
      setSelectedDate(Object.keys(slots).sort()[0] ?? null);
    } catch (e) {
      setSlotsByDate({});
      setError(e instanceof Error ? e.message : "Could not load slots.");
    }
  }

  async function reloadSlotsAfterConflict(message: string) {
    if (!selectedClass) return;
    setSelectedSlot(null);
    setStep("slot");
    setError(message);
    const slots = await listSlots(selectedClass.id).catch(() => ({}));
    setSlotsByDate(slots);
    setSelectedDate(Object.keys(slots).sort()[0] ?? null);
  }

  async function handlePay() {
    if (!selectedClass || !selectedSlot) return;
    setBusy(true);
    setError(null);
    try {
      // Create the booking once; retries after a dismissed/failed payment reuse it
      let current = booking;
      if (!current) {
        try {
          current = await createGuestBooking({
            activityId: selectedClass.id,
            slotId: selectedSlot.id,
            parentName: details.parentName.trim(),
            phone: details.phone,
            childName: details.childName.trim(),
            childAge: Number(details.childAge),
          });
        } catch (e) {
          if (e instanceof ApiError && (e.status === 409 || e.status === 422) && /slot|available|between/i.test(e.message)) {
            await reloadSlotsAfterConflict(`${e.message} Please pick another slot.`);
            return;
          }
          throw e;
        }
        setBooking(current);
      }

      // Dev/test API auto-captures payment — nothing left to pay
      if (current.paymentStatus === "success") {
        setStep("done");
        return;
      }

      const order = await createPaymentOrder(current.bookingId);
      const result = await openCheckout({
        keyId: order.keyId,
        orderId: order.orderId,
        amountPaise: order.amount,
        description: `${current.activityTitle} for ${details.childName.trim()}`,
        prefill: { name: details.parentName.trim(), contact: details.phone.replace(/\D/g, "").slice(-10) },
        themeColor: C.teal,
      });

      if (result.status === "dismissed") {
        setError("Payment was not completed. Your slot is held — tap Pay to try again.");
        return;
      }
      if (result.status === "failed") {
        setError(result.message);
        return;
      }

      await verifyPayment(current.bookingId, result);
      setStep("done");
    } catch (e) {
      if (e instanceof ApiError && e.status === 409 && /already paid/i.test(e.message)) {
        setStep("done");
        return;
      }
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function goBack() {
    setError(null);
    if (step === "slot") setStep("class");
    else if (step === "details") setStep("slot");
    else if (step === "pay") setStep("details");
  }

  const stepIndex = STEPS.findIndex((s) => s.id === step);
  // Once a booking exists the slot is held — don't let the parent wander back and pick another
  const canGoBack = step !== "class" && step !== "done" && !booking && !busy;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="booking-overlay"
          className="bk-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}
        >
          <style>{MODAL_CSS}</style>
          <motion.div
            className="bk-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bk-title"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
          >
            {step === "done" ? (
              <SuccessView booking={booking} slot={selectedSlot} childName={details.childName} onClose={onClose} />
            ) : (
              <>
                {/* Header */}
                <div className="bk-header">
                  {canGoBack ? (
                    <button type="button" className="bk-icon-btn" onClick={goBack} aria-label="Back">
                      <ArrowLeft size={20} />
                    </button>
                  ) : (
                    <span style={{ width: 36 }} />
                  )}
                  <h2 id="bk-title" style={{ fontFamily: FH, fontWeight: 900, fontSize: 20, margin: 0, color: C.navy }}>
                    Book a class
                  </h2>
                  <button type="button" className="bk-icon-btn" onClick={onClose} disabled={busy} aria-label="Close">
                    <X size={20} />
                  </button>
                </div>

                {/* Progress */}
                <ol className="bk-steps" aria-label="Booking steps">
                  {STEPS.map((s, i) => (
                    <li key={s.id} className={i < stepIndex ? "bk-step bk-step--done" : i === stepIndex ? "bk-step bk-step--active" : "bk-step"}>
                      <span className="bk-step-dot">{i < stepIndex ? "✓" : i + 1}</span>
                      {s.label}
                    </li>
                  ))}
                </ol>

                {/* Body */}
                <div className="bk-body">
                  {error && <div className="bk-error" role="alert">{error}</div>}

                  {step === "class" && <ClassStep classes={classes} onChoose={chooseClass} />}

                  {step === "slot" && selectedClass && (
                    <SlotStep
                      cls={selectedClass}
                      slotsByDate={slotsByDate}
                      dates={dates}
                      selectedDate={selectedDate}
                      onDate={(d) => { setSelectedDate(d); setSelectedSlot(null); }}
                      selectedSlot={selectedSlot}
                      onSlot={setSelectedSlot}
                      onChangeClass={() => setStep("class")}
                    />
                  )}

                  {step === "details" && (
                    <DetailsStep details={details} onChange={setDetails} errors={touched ? detailErrors : {}} />
                  )}

                  {step === "pay" && selectedClass && selectedSlot && (
                    <PayStep cls={selectedClass} slot={selectedSlot} details={details} price={price} />
                  )}
                </div>

                {/* Footer */}
                {step !== "class" && (
                  <div className="bk-footer">
                    <div style={{ fontFamily: FB, fontSize: 13, color: C.grey }}>
                      {selectedClass && <>Total <strong style={{ color: C.navy, fontFamily: FH, fontSize: 18 }}>{inr(price)}</strong></>}
                    </div>
                    {step === "slot" && (
                      <button type="button" className="btn-teal bk-cta" disabled={!selectedSlot} onClick={() => { setError(null); setStep("details"); }}>
                        Continue
                      </button>
                    )}
                    {step === "details" && (
                      <button
                        type="button"
                        className="btn-teal bk-cta"
                        onClick={() => {
                          setTouched(true);
                          if (detailsValid) { setError(null); setStep("pay"); }
                        }}
                      >
                        Continue
                      </button>
                    )}
                    {step === "pay" && (
                      <button type="button" className="btn-teal bk-cta" disabled={busy} onClick={handlePay}>
                        {busy ? <><Loader2 size={16} className="bk-spin" /> Processing…</> : `Pay ${inr(price)}`}
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── steps ─────────────────────────────────────────────────────────────────────

function ClassStep({ classes, onChoose }: { classes: BookableClass[] | null; onChoose: (c: BookableClass) => void }) {
  if (classes === null) return <Loading text="Loading classes…" />;
  if (classes.length === 0) return <Empty text="No classes are open for booking right now. Please check back soon." />;

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <p className="bk-lead">Which class would you like to book?</p>
      {classes.map((c) => (
        <button key={c.id} type="button" className="bk-class" onClick={() => onChoose(c)}>
          <BeamImg className="bk-class-thumb" src={c.imageUrl} alt="" />
          <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
            <div style={{ fontFamily: FH, fontWeight: 800, fontSize: 15, color: C.navy }}>{c.title}</div>
            <div className="bk-meta">
              {[c.categoryName, c.ageGroup && `Ages ${c.ageGroup}`, `${c.sessionDurationMins} min`].filter(Boolean).join(" · ")}
            </div>
            {c.nextAvailableDate && <div className="bk-meta" style={{ color: C.tealD }}>Next slot {formatDay(c.nextAvailableDate)}</div>}
          </div>
          <div style={{ fontFamily: FH, fontWeight: 900, fontSize: 16, color: C.tealD, whiteSpace: "nowrap" }}>
            {inr(Number(c.pricePerSession))}
          </div>
        </button>
      ))}
    </div>
  );
}

function SlotStep(props: {
  cls: BookableClass;
  slotsByDate: Record<string, ClassSlot[]> | null;
  dates: string[];
  selectedDate: string | null;
  onDate: (d: string) => void;
  selectedSlot: ClassSlot | null;
  onSlot: (s: ClassSlot) => void;
  onChangeClass: () => void;
}) {
  const { cls, slotsByDate, dates, selectedDate, selectedSlot } = props;
  return (
    <div>
      <div className="bk-summary-chip">
        <span style={{ fontWeight: 800 }}>{cls.title}</span>
        <button type="button" className="bk-link" onClick={props.onChangeClass}>Change</button>
      </div>
      <p className="bk-lead">Pick a date and time</p>

      {slotsByDate === null ? (
        <Loading text="Finding available slots…" />
      ) : dates.length === 0 ? (
        <Empty text="No open slots for this class in the next two weeks. Try another class." />
      ) : (
        <>
          <div className="bk-dates" role="listbox" aria-label="Dates">
            {dates.map((d) => (
              <button
                key={d}
                type="button"
                role="option"
                aria-selected={selectedDate === d}
                className={selectedDate === d ? "bk-date bk-date--on" : "bk-date"}
                onClick={() => props.onDate(d)}
              >
                <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4 }}>{formatDay(d, { weekday: "short" })}</span>
                <span style={{ fontFamily: FH, fontWeight: 900, fontSize: 20 }}>{formatDay(d, { day: "numeric" })}</span>
                <span style={{ fontSize: 11 }}>{formatDay(d, { month: "short" })}</span>
              </button>
            ))}
          </div>
          <div className="bk-times" role="listbox" aria-label="Times">
            {(selectedDate ? slotsByDate[selectedDate] ?? [] : []).map((s) => (
              <button
                key={s.id}
                type="button"
                role="option"
                aria-selected={selectedSlot?.id === s.id}
                className={selectedSlot?.id === s.id ? "bk-time bk-time--on" : "bk-time"}
                onClick={() => props.onSlot(s)}
              >
                {formatClock(s.startTime)}
                <span style={{ fontSize: 11, opacity: 0.75 }}>to {formatClock(s.endTime)}</span>
                {/* Several teachers can offer the same time — name them so slots are distinguishable */}
                {s.teacherFirstName && <span className="bk-teacher">with {s.teacherFirstName}</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function DetailsStep({ details, onChange, errors }: { details: Details; onChange: (d: Details) => void; errors: Partial<Record<keyof Details, string>> }) {
  const field = (key: keyof Details, label: string, props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <label className="bk-field">
      <span className="bk-label">{label}</span>
      <input
        className="inp"
        value={details[key]}
        onChange={(e) => onChange({ ...details, [key]: e.target.value })}
        aria-invalid={!!errors[key]}
        {...props}
      />
      {errors[key] && <span className="bk-field-error">{errors[key]}</span>}
    </label>
  );

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <p className="bk-lead">Who should we contact about this booking?</p>
      {field("parentName", "Your name", { autoComplete: "name", placeholder: "e.g. Priya Sharma" })}
      <label className="bk-field">
        <span className="bk-label">Mobile number</span>
        <div style={{ display: "flex", gap: 8 }}>
          <span className="inp" style={{ width: 64, textAlign: "center", color: C.grey, flexShrink: 0 }}>+91</span>
          <input
            className="inp"
            value={details.phone}
            onChange={(e) => onChange({ ...details, phone: e.target.value })}
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="98765 43210"
            maxLength={14}
            aria-invalid={!!errors.phone}
          />
        </div>
        {errors.phone ? (
          <span className="bk-field-error">{errors.phone}</span>
        ) : (
          <span className="bk-hint">Use this number to log in to the Beam app and manage your booking.</span>
        )}
      </label>
      <div className="bk-row">
        {field("childName", "Child's name", { placeholder: "e.g. Aarav" })}
        {field("childAge", "Child's age", { inputMode: "numeric", placeholder: "Years", maxLength: 2, style: { maxWidth: 120 } })}
      </div>
    </div>
  );
}

function PayStep({ cls, slot, details, price }: { cls: BookableClass; slot: ClassSlot; details: Details; price: number }) {
  const where = cls.deliveryMode === "online" ? "Online session" : [cls.locality, cls.city].filter(Boolean).join(", ") || "At your home";
  return (
    <div>
      <p className="bk-lead">Review and pay to confirm</p>
      <div className="bk-review">
        <div style={{ fontFamily: FH, fontWeight: 900, fontSize: 17, color: C.navy, marginBottom: 10 }}>{cls.title}</div>
        <ReviewRow icon={<CalendarDays size={16} />} text={formatDay(slot.date, { weekday: "long", day: "numeric", month: "long" })} />
        <ReviewRow icon={<Clock size={16} />} text={`${formatClock(slot.startTime)} – ${formatClock(slot.endTime)} · ${cls.sessionDurationMins} min`} />
        <ReviewRow icon={<MapPin size={16} />} text={where} />
        {slot.teacherFirstName && <ReviewRow icon={<UserRound size={16} />} text={`Teacher: ${slot.teacherFirstName}`} />}
        <div className="bk-divider" />
        <Pair label="Child" value={`${details.childName.trim()}, ${details.childAge} yrs`} />
        <Pair label="Parent" value={details.parentName.trim()} />
        <Pair label="Mobile" value={`+91 ${details.phone.replace(/\D/g, "").slice(-10)}`} />
        <div className="bk-divider" />
        <Pair label="Session fee" value={inr(price)} strong />
      </div>
      <p className="bk-hint" style={{ marginTop: 12 }}>Secure payment by Razorpay — UPI, cards and net banking.</p>
    </div>
  );
}

function SuccessView({ booking, slot, childName, onClose }: { booking: GuestBooking | null; slot: ClassSlot | null; childName: string; onClose: () => void }) {
  return (
    <div style={{ padding: "36px 28px 32px", textAlign: "center", position: "relative" }}>
      <button type="button" className="bk-icon-btn" onClick={onClose} aria-label="Close" style={{ position: "absolute", top: 14, right: 14 }}>
        <X size={20} />
      </button>
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 16 }}
        style={{ width: 76, height: 76, borderRadius: "50%", background: C.mint, display: "grid", placeItems: "center", margin: "0 auto 18px", color: C.tealD }}
      >
        <CheckCircle2 size={42} />
      </motion.div>
      <h2 id="bk-title" style={{ fontFamily: FH, fontWeight: 900, fontSize: 22, color: C.navy, margin: "0 0 8px" }}>
        Your booking is complete.
      </h2>
      <p style={{ fontFamily: FB, fontSize: 15, color: C.grey, margin: "0 0 18px", lineHeight: 1.6 }}>
        Manage booking through our mobile app.
      </p>
      {booking && slot && (
        <div className="bk-review" style={{ textAlign: "left", marginBottom: 22 }}>
          <Pair label="Class" value={booking.activityTitle} />
          <Pair label="When" value={`${formatDay(slot.date)} · ${formatClock(slot.startTime)}`} />
          <Pair label="For" value={childName.trim()} />
          <Pair label="Booking ID" value={booking.bookingId.slice(0, 8).toUpperCase()} />
        </div>
      )}
      <AppStoreButtons />
    </div>
  );
}

// ── small bits ────────────────────────────────────────────────────────────────

function ReviewRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: FB, fontSize: 14, color: C.navy, marginBottom: 6 }}>
      <span style={{ color: C.teal, display: "flex" }}>{icon}</span>
      {text}
    </div>
  );
}

function Pair({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontFamily: FB, fontSize: 14, padding: "3px 0" }}>
      <span style={{ color: C.grey }}>{label}</span>
      <span style={{ color: C.navy, fontWeight: strong ? 800 : 600, fontFamily: strong ? FH : FB, fontSize: strong ? 17 : 14, textAlign: "right" }}>{value}</span>
    </div>
  );
}

function Loading({ text }: { text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "40px 0", color: C.grey, fontFamily: FB, fontSize: 14 }}>
      <Loader2 size={18} className="bk-spin" /> {text}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p style={{ textAlign: "center", padding: "36px 12px", color: C.grey, fontFamily: FB, fontSize: 14, margin: 0 }}>{text}</p>;
}

const MODAL_CSS = `
  .bk-overlay { position: fixed; inset: 0; z-index: 200; background: rgba(30,41,59,.55); backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center; padding: 16px; }
  .bk-modal { background: ${C.white}; width: 100%; max-width: 560px; max-height: min(720px, 92vh); border-radius: 24px;
    box-shadow: 0 24px 64px rgba(30,41,59,.28); display: flex; flex-direction: column; overflow: hidden; }
  .bk-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 16px 8px; }
  .bk-icon-btn { width: 36px; height: 36px; border-radius: 50%; border: none; background: ${C.lightGrey}; color: ${C.navy};
    display: grid; place-items: center; cursor: pointer; }
  .bk-icon-btn:disabled { opacity: .5; cursor: not-allowed; }
  .bk-steps { list-style: none; display: flex; gap: 6px; padding: 4px 20px 14px; margin: 0; border-bottom: 1px solid ${C.lightGrey}; }
  .bk-step { flex: 1; display: flex; align-items: center; gap: 6px; font-family: ${FB}; font-size: 12px; font-weight: 700; color: ${C.grey}; }
  .bk-step-dot { width: 22px; height: 22px; border-radius: 50%; display: grid; place-items: center; font-size: 11px;
    background: ${C.lightGrey}; color: ${C.grey}; flex-shrink: 0; }
  .bk-step--active { color: ${C.navy}; }
  .bk-step--active .bk-step-dot { background: ${C.teal}; color: ${C.white}; }
  .bk-step--done .bk-step-dot { background: ${C.mint}; color: ${C.tealD}; }
  .bk-body { padding: 18px 20px; overflow-y: auto; flex: 1; }
  .bk-footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 20px;
    border-top: 1px solid ${C.lightGrey}; background: ${C.white}; }
  .bk-cta { padding: 13px 28px; font-size: 15px; display: inline-flex; align-items: center; gap: 8px; }
  .bk-cta:disabled { background: #E2E8F0; color: ${C.grey}; cursor: not-allowed; transform: none !important; box-shadow: none !important; }
  .bk-lead { font-family: ${FH}; font-weight: 800; font-size: 16px; color: ${C.navy}; margin: 0 0 12px; }
  .bk-meta { font-family: ${FB}; font-size: 12.5px; color: ${C.grey}; margin-top: 2px; }
  .bk-class { display: flex; align-items: center; gap: 12px; width: 100%; padding: 12px; border-radius: 16px; cursor: pointer;
    background: ${C.white}; border: 1.5px solid ${C.lightGrey}; transition: border-color .18s, box-shadow .18s, transform .18s; }
  .bk-class:hover { border-color: ${C.teal}; box-shadow: 0 6px 18px rgba(28,168,179,.14); transform: translateY(-1px); }
  .bk-class-thumb { width: 56px; height: 56px; border-radius: 12px; flex-shrink: 0; background: ${C.mint}; object-fit: cover; }
  .bk-summary-chip { display: flex; justify-content: space-between; align-items: center; gap: 8px; background: ${C.mint};
    border-radius: 12px; padding: 10px 14px; margin-bottom: 16px; font-family: ${FB}; font-size: 14px; color: ${C.tealD}; }
  .bk-link { background: none; border: none; color: ${C.tealD}; font-family: ${FB}; font-weight: 700; text-decoration: underline; cursor: pointer; padding: 0; }
  .bk-dates { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 6px; margin-bottom: 14px; }
  .bk-date { min-width: 64px; display: flex; flex-direction: column; align-items: center; gap: 1px; padding: 10px 8px; border-radius: 14px;
    border: 1.5px solid ${C.lightGrey}; background: ${C.white}; color: ${C.navy}; cursor: pointer; font-family: ${FB}; flex-shrink: 0; }
  .bk-date--on { background: ${C.teal}; border-color: ${C.teal}; color: ${C.white}; }
  .bk-times { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 8px; }
  .bk-time { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 11px 8px; border-radius: 12px; cursor: pointer;
    border: 1.5px solid ${C.lightGrey}; background: ${C.white}; color: ${C.navy}; font-family: ${FH}; font-weight: 800; font-size: 14px; }
  .bk-time:hover, .bk-date:hover { border-color: ${C.teal}; }
  .bk-time--on { background: ${C.mint}; border-color: ${C.teal}; color: ${C.tealD}; }
  .bk-teacher { font-family: ${FB}; font-weight: 600; font-size: 11px; color: ${C.grey}; }
  .bk-field { display: flex; flex-direction: column; gap: 6px; flex: 1; }
  .bk-label { font-family: ${FB}; font-size: 13px; font-weight: 700; color: ${C.navy}; }
  .bk-hint { font-family: ${FB}; font-size: 12px; color: ${C.grey}; }
  .bk-field-error { font-family: ${FB}; font-size: 12px; color: #DC2626; }
  .inp[aria-invalid="true"] { border-color: #F87171; }
  .bk-row { display: flex; gap: 12px; }
  .bk-review { background: ${C.cream}; border-radius: 16px; padding: 16px; }
  .bk-divider { height: 1px; background: ${C.lightGrey}; margin: 10px 0; }
  .bk-error { background: #FEE2E2; color: #991B1B; border-radius: 12px; padding: 10px 14px; font-family: ${FB}; font-size: 13px; margin-bottom: 14px; }
  .bk-spin { animation: bkspin 1s linear infinite; }
  @keyframes bkspin { to { transform: rotate(360deg); } }
  @media (max-width: 600px) {
    .bk-overlay { padding: 0; align-items: flex-end; }
    .bk-modal { max-width: none; max-height: 94vh; border-radius: 24px 24px 0 0; }
    .bk-step { font-size: 0; gap: 0; justify-content: center; }
    .bk-row { flex-direction: column; }
  }
`;
