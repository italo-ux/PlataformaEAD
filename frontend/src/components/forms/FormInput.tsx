import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

interface FormInputProps {
  id: string;
  name: string;
  label: string;
  type?: string;
  placeholder: string;
  icon: IconDefinition;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isPasswordField?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

export default function FormInput({
  id,
  name,
  label,
  type = "text",
  placeholder,
  icon,
  value,
  onChange,
  isPasswordField = false,
  showPassword = false,
  onTogglePassword,
  error,
  required = true,
  disabled = false,
}: FormInputProps) {
  const inputType = isPasswordField
    ? showPassword
      ? "text"
      : "password"
    : type;

  return (
    <div className="relative">
      <label
        htmlFor={id}
        className="block text-sm font-semibold text-[#333] mb-3"
      >
        {label}
      </label>
      <div className="relative flex items-center">
        <FontAwesomeIcon
          icon={icon}
          className="absolute left-4 text-gray-400 text-lg"
        />
        <input
          id={id}
          name={name}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className={`w-full pl-12 ${
            isPasswordField ? "pr-12" : "pr-4"
          } py-3 bg-white border-2 rounded-lg text-[#333] placeholder-gray-400 transition-all duration-300 focus:outline-none focus:shadow-lg hover:border-gray-300 ${
            error
              ? "border-red-500 focus:border-red-500"
              : "border-gray-200 focus:border-[#4B6FFF]"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        />
        {isPasswordField && onTogglePassword && (
          <button
            type="button"
            onClick={onTogglePassword}
            disabled={disabled}
            className="absolute right-4 text-gray-400 hover:text-[#4B6FFF] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Toggle password visibility"
          >
            <FontAwesomeIcon
              icon={showPassword ? faEyeSlash : faEye}
              className="text-lg"
            />
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
