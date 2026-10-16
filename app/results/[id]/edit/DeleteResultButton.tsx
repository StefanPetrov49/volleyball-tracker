"use client";

export default function DeleteResultButton({
  action,
}: {
  action: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm("Сигурен ли си, че искаш да изтриеш този мач?")) {
          e.preventDefault();
        }
      }}
    >
      <button type="submit" className="result-delete-btn">
        Изтрий мача
      </button>
    </form>
  );
}