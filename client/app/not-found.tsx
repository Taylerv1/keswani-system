import Link from "next/link";
import { MoveLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-text-primary px-4">
      <div className="text-center space-y-6 max-w-md">
        {/* Large 404 Text */}
        <h1 className="text-9xl font-bold text-primary opacity-20 select-none">
          404
        </h1>
        
        <div className="-mt-12 relative z-10 space-y-4">
          <h2 className="text-3xl font-bold tracking-tight">Page not found</h2>
          <p className="text-text-secondary text-lg">
            Sorry, we couldn’t find the page you’re looking for. It might have been moved or deleted.
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-8">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20"
          >
            <MoveLeft size={20} />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
