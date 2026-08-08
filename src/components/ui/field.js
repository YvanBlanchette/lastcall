import { cn } from "@/lib/utils";

/** Libellé + contrôle + aide + erreur. Un seul endroit gère l'accessibilité. */
export function Field({ label, htmlFor, hint, error, required, children, className }) {
	return (
		<div className={cn("space-y-1.5", className)}>
			<div className="flex items-center justify-between gap-4">
				{label && (
					<label
						htmlFor={htmlFor}
						className="block text-sm font-medium text-navy-700"
					>
						{label}
						{required && <span className="ml-0.5 text-urgent-600">*</span>}
					</label>
				)}
				{error && (
					<p
						role="alert"
						className="text-xs font-medium text-red-600"
					>
						{error}
					</p>
				)}
			</div>
			{children}
			{hint && !error && <p className="text-xs text-navy-400">{hint}</p>}
		</div>
	);
}
