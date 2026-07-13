import { BookEditor } from "@/features/books/components/book-editor";
import { requirePermission } from "@/lib/auth-utils";

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  await requirePermission("books");
  const { bookId } = await params;

  return <BookEditor bookId={bookId} />;
}
