import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useClientEmailRedirect } from '@/hooks/useClientEmailRedirect';
import { useToast } from '@/hooks/use-toast';
import logo from '../img/logo.png';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, user, userProfile, userProfileLoading } = useAuth();
  const { redirectToClientIfMatched } = useClientEmailRedirect();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Role-based redirect logic
  useEffect(() => {
    if (user && !userProfileLoading && userProfile) {
      console.log('🔄 User authenticated, checking role-based redirect');
      
      const userRole = userProfile.role;
      console.log('👤 User role:', userRole);
      
      switch (userRole) {
        case 'admin':
        case 'sales_admin':
          console.log('🏠 Admin user - redirecting to admin route');
          navigate('/admin', { replace: true });
          break;
        case 'client':
          console.log('🏠 Client user - redirecting to home route');
          navigate('/', { replace: true });
          break;
        default:
          console.log('🚫 User role - redirecting to user route');
          navigate('/user', { replace: true });
          break;
      }
    }
  }, [user, userProfile, userProfileLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast({
          title: 'Authentication Error',
          description: error.message,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAndroidDownload = async () => {
    try {
      // Fetch the directory listing for /apk/
      const response = await fetch('/apk/');
      if (!response.ok) throw new Error('Could not access APK directory');
      const html = await response.text();

      // Find all APK files matching the pattern
      const matches = [...html.matchAll(/href="(app-release-v[0-9.]+-\d+_\d+\.apk)"/g)];
      if (!matches.length) {
        toast({
          title: 'Download Error',
          description: 'No APK files found.',
          variant: 'destructive'
        });
        return;
      }

      // Extract filenames and sort by timestamp in the filename
      const files = matches.map(m => m[1]);
      files.sort((a, b) => {
        // Extract the timestamp part (after the last dash, before .apk)
        const getTimestamp = (fname) => {
          const match = fname.match(/-(\d{8}_\d{4})\.apk$/);
          return match ? match[1] : '';
        };
        return getTimestamp(a) < getTimestamp(b) ? 1 : -1;
      });

      // The first file is the latest
      const latestApk = files[0];
      window.open(`/apk/${latestApk}`, '_blank');
      toast({
        title: 'Download Started',
        description: `Downloading ${latestApk}`,
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: 'Download Error',
        description: 'Failed to download APK. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleIOSDownload = () => {
    toast({
      title: 'Exciting News! 🎉',
      description: 'Our TechPinoy App for iOS is still being developed. Stay tuned for the release!',
      variant: 'default'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="inline-block mb-4">
              <img src={logo} alt="TechPinoy Logo" className="h-16 w-16" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">TechPinoy App</h1>
            <p className="text-gray-600 mt-2">Sign in to your account</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <Input 
                id="email" 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="Enter your email" 
                required 
                className="w-full" 
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? 'text' : 'password'} 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  placeholder="Enter your password" 
                  required 
                  className="w-full pr-10" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>
          
          {/* Compact Download App Section */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Smartphone className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-700">Download TechPinoy App</h3>
              </div>
              <p className="text-xs text-gray-500 mb-3">Get the full experience on your mobile device</p>
              
              <div className="flex justify-center gap-4">
                <button
                  onClick={handleAndroidDownload}
                  className="p-2.5 bg-black hover:bg-gray-800 text-white rounded-full transition-colors duration-200 shadow-sm hover:shadow-md"
                  title="Download for Android"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993.0001.5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.5036C15.5902 8.2432 13.8533 7.4287 11.9797 7.4287c-1.8736 0-3.6105.8145-4.8057 2.0786L5.1517 5.9995a.416.416 0 00-.5676-.1521.416.416 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h23.959c-.3432-4.1021-2.6889-7.5743-6.5775-9.4396"/>
                  </svg>
                </button>
                <button
                  onClick={handleIOSDownload}
                  className="p-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-full transition-colors duration-200 shadow-sm hover:shadow-md"
                  title="Download for iOS"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Developer Credit */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-400">
            TechPinoy App Developed by James Chavez
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
