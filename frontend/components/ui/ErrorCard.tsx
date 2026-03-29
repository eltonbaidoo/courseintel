interface ErrorCardProps {
  title?: string;
  message: string;
  retry?: () => void;
}

export function ErrorCard({
  title = "Something went wrong",
  message,
  retry,
}: ErrorCardProps) {
  return (
    <div className="card border-espresso-200 bg-espresso-50 p-6 text-center">
      <h3 className="font-display text-lg font-semibold text-espresso-900">
        {title}
      </h3>
      <p className="mt-1 text-sm text-espresso-700">{message}</p>
      {retry && (
        <button onClick={retry} className="btn-secondary mt-4">
          Try again
        </button>
      )}
    </div>
  );
}
