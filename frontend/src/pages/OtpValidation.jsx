import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Stack,
  Chip,
  CircularProgress,
} from "@mui/material";

/**
 * Polished OTP Validation
 * Props:
 * - onValidate: (code: string) => void  // required
 * - onResend?: () => Promise<void> | void  // optional; called when user taps Resend
 * - email?: string  // optional; show where the code was sent
 * - length?: number // optional; default 6
 */
export default function OtpValidation({ onValidate, onResend, email, length = 6 }) {
  const [values, setValues] = useState(Array(length).fill(""));
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(30);
  const inputsRef = useRef([]);

  useEffect(() => {
    inputsRef.current?.[0]?.focus();
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  const code = values.join("");

  const handleChange = (idx, val) => {
    if (!/^[0-9]?$/.test(val)) return; // digits only
    const next = [...values];
    next[idx] = val;
    setValues(next);
    setError("");
    if (val && idx < length - 1) inputsRef.current?.[idx + 1]?.focus();
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !values[idx] && idx > 0) {
      inputsRef.current?.[idx - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && idx > 0) inputsRef.current?.[idx - 1]?.focus();
    if (e.key === "ArrowRight" && idx < length - 1) inputsRef.current?.[idx + 1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    e.preventDefault();
    const arr = pasted.split("");
    const next = Array(length).fill("");
    for (let i = 0; i < arr.length; i++) next[i] = arr[i];
    setValues(next);
    const focusIdx = Math.min(arr.length, length - 1);
    inputsRef.current?.[focusIdx]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (code.length !== length) {
      setError(`Please enter the ${length}-digit code.`);
      return;
    }
    try {
      setSubmitting(true);
      await Promise.resolve(onValidate?.(code));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!onResend || secondsLeft > 0) return;
    try {
      setResending(true);
      await Promise.resolve(onResend());
      setSecondsLeft(30);
    } catch (e) {
      setError("Couldn't resend code. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      {/* soft gradient + blur background */}
      <Box
        sx={{
          position: "fixed",
          inset: 0,
          background:
            "radial-gradient(1200px 600px at 10% 10%, rgba(99,102,241,.12), transparent 40%), radial-gradient(1000px 500px at 90% 20%, rgba(236,72,153,.12), transparent 40%), radial-gradient(900px 500px at 40% 90%, rgba(34,197,94,.12), transparent 40%), linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
          zIndex: -2,
        }}
      />
      <Box sx={{ position: "fixed", inset: 0, backdropFilter: "blur(2px)", zIndex: -1 }} />

      <Paper
        elevation={0}
        sx={{
          width: { xs: "92%", sm: 420 },
          borderRadius: 4,
          p: { xs: 3, sm: 4 },
          background: "rgba(255,255,255,.85)",
          backdropFilter: "saturate(1.2) blur(8px)",
          border: "1px solid",
          borderColor: "rgba(255,255,255,.6)",
          boxShadow: "0 10px 30px rgba(15,23,42,.05), inset 0 1px 0 rgba(255,255,255,.6)",
        }}
      >
        <form onSubmit={handleSubmit} onPaste={handlePaste}>
          <Stack spacing={3} alignItems="center">
            <Stack spacing={0.5} alignItems="center">
              <Typography variant="h5" fontWeight={800}>Enter verification code</Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                {email ? (
                  <>We sent a {length}-digit code to <strong>{email}</strong>.</>
                ) : (
                  <>We sent a {length}-digit code to your email.</>
                )}
              </Typography>
            </Stack>

            {/* OTP inputs */}
            <Stack direction="row" spacing={1.2} justifyContent="center" sx={{ width: "100%" }}>
              {values.map((val, i) => (
                <TextField
                  key={i}
                  value={val}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  inputRef={(el) => (inputsRef.current[i] = el)}
                  inputProps={{
                    inputMode: "numeric",
                    pattern: "[0-9]*",
                    maxLength: 1,
                    style: { textAlign: "center", fontSize: 22, padding: "12px 0" },
                    "aria-label": `Digit ${i + 1}`,
                  }}
                  sx={{ width: 56 }}
                />
              ))}
            </Stack>

            {error && (
              <Chip label={error} color="error" variant="outlined" />
            )}

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ width: "100%" }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={code.length !== length || submitting}
                fullWidth
              >
                {submitting ? <><CircularProgress size={18} sx={{ mr: 1 }} /> Verifying…</> : "Verify"}
              </Button>
              <Button
                type="button"
                variant="outlined"
                disabled={!onResend || secondsLeft > 0 || resending}
                onClick={handleResend}
                fullWidth
              >
                {resending ? <><CircularProgress size={18} sx={{ mr: 1 }} /> Sending…</> : secondsLeft > 0 ? `Resend in ${secondsLeft}s` : "Resend code"}
              </Button>
            </Stack>

            <Typography variant="caption" color="text.secondary" textAlign="center">
              Tip: You can paste the entire code.
            </Typography>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}