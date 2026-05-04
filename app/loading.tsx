import { BookbrushLoader } from '@/components/BookbrushLoader';
import { TopProgressBar } from '@/components/TopProgressBar';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bb-loader-bg">
      <TopProgressBar />
      <BookbrushLoader subtitle="loading your dashboard" />
    </div>
  );
}
