import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Web3Provider } from './context/Web3Context';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import NetworkBanner from './components/NetworkBanner';
import { Loader2 } from 'lucide-react';

// Lazy-loaded pages for performance
const Home = lazy(() => import('./pages/Home'));
const CampaignDetail = lazy(() => import('./pages/CampaignDetail'));
const CreateCampaign = lazy(() => import('./pages/CreateCampaign'));
const ValidatorDashboard = lazy(() => import('./pages/ValidatorDashboard'));
const MyDonations = lazy(() => import('./pages/MyDonations'));
const Analytics = lazy(() => import('./pages/Analytics'));
const NgoProfile = lazy(() => import('./pages/NgoProfile'));
const Confirm = lazy(() => import('./pages/Confirm'));
const Whistleblower = lazy(() => import('./pages/Whistleblower'));
const MyReports = lazy(() => import('./pages/MyReports'));

const pageTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

function PageLoader() {
  return (
    <div style={{
      minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ textAlign: 'center' }}>
        <Loader2 size={28} style={{ color: 'var(--accent)', animation: 'spin 0.7s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ color: 'var(--text3)', fontSize: 14 }}>Loading...</p>
      </div>
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.main key={location.pathname} {...pageTransition}>
        <Suspense fallback={<PageLoader />}>
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/campaign/:id" element={<CampaignDetail />} />
            <Route path="/create" element={<CreateCampaign />} />
            <Route path="/validator" element={<ValidatorDashboard />} />
            <Route path="/my-donations" element={<MyDonations />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/ngo/:address" element={<NgoProfile />} />
            <Route path="/confirm/:hash" element={<Confirm />} />
            <Route path="/report" element={<Whistleblower />} />
            <Route path="/my-reports" element={<MyReports />} />
          </Routes>
        </Suspense>
      </motion.main>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <Web3Provider>
          <ErrorBoundary>
            <Toaster
              position="bottom-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  borderRadius: 'var(--radius)',
                  padding: '12px 16px',
                  fontSize: '14px',
                  fontFamily: "'DM Sans', sans-serif",
                  boxShadow: 'var(--shadow-lg)',
                },
                success: { iconTheme: { primary: 'var(--green)', secondary: '#fff' } },
                error: { iconTheme: { primary: 'var(--red)', secondary: '#fff' } },
              }}
            />
            <NetworkBanner />
            <Navbar />
            <AnimatedRoutes />
          </ErrorBoundary>
        </Web3Provider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
