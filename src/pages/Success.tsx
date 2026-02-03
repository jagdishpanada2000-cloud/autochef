import { Link } from 'react-router-dom';
import { CheckCircle, ArrowRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';

export default function Success() {
  return (
    <Layout showStickyCart={false}>
      <div className="container py-12 text-center slide-up">
        <div className="max-w-md mx-auto">
          <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>
          
          <h1 className="font-display text-3xl font-bold mb-3">Order Placed!</h1>
          <p className="text-muted-foreground mb-8">
            Your order has been successfully placed. You will receive a confirmation shortly.
          </p>

          <div className="glass-card p-6 mb-8 text-left">
            <h2 className="font-semibold mb-4">What's next?</h2>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <ArrowRight className="w-4 h-4 text-primary mt-0.5" />
                <span>The restaurant is preparing your order</span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="w-4 h-4 text-primary mt-0.5" />
                <span>A delivery partner will be assigned shortly</span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="w-4 h-4 text-primary mt-0.5" />
                <span>Track your order in real-time (coming soon)</span>
              </li>
            </ul>
          </div>

          <p className="text-xs text-muted-foreground mb-6">
            Note: This is a demo app. No actual order was placed.
          </p>

          <Link to="/">
            <Button className="btn-glow gap-2">
              <Home className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
