import { useRef, useEffect, useMemo, useCallback } from "react";

interface CodeInputProps {
  name: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

export default function CodeInput({
  name,
  value,
  onChange,
  error,
  disabled = false,
  autoFocus = false,
}: CodeInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const digits = useMemo(() => value.split("").concat(Array(6 - value.length).fill("")), [value]);

  const setInputRef = useCallback((index: number) => (el: HTMLInputElement | null) => {
    inputsRef.current[index] = el;
  }, []);

  useEffect(() => {
    if (autoFocus && inputsRef.current[0]) {
      inputsRef.current[0].focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    inputsRef.current.forEach((input, i) => {
      if (input) input.value = digits[i];
    });
  }, [digits]);

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (!/^\d*$/.test(newValue)) return;

    const newDigits = [...digits];
    newDigits[index] = newValue;
    const fullCode = newDigits.join("");
    onChange(fullCode);

    if (newValue && index < 5 && inputsRef.current[index + 1]) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      onChange(pasted);
      inputsRef.current.forEach((input, i) => {
        if (input) input.value = pasted[i];
      });
      if (inputsRef.current[5]) inputsRef.current[5].focus();
    }
  };

  return (
    <div className="relative">
      <div className="flex gap-2 justify-center" role="group" aria-label="Código de verificação de 6 dígitos">
        {[...Array(6)].map((_, i) => (
          <input
            key={i}
            ref={setInputRef(i)}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digits[i]}
            onChange={(e) => handleChange(i, e)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            disabled={disabled}
            className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#4B6FFF] ${
              error
                ? "border-red-500 focus:border-red-500 bg-red-50"
                : "border-gray-200 focus:border-[#4B6FFF] bg-white"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            aria-label={`Dígito ${i + 1} do código`}
          />
        ))}
      </div>
      <input
        type="hidden"
        name={name}
        value={value}
        readOnly
      />
      {error && <p className="mt-1 text-sm text-red-500 text-center">{error}</p>}
    </div>
  );
}