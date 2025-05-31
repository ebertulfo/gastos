'use client';

import Tracker from '@/components/track/tracker';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function TrackerPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    
    useEffect(() => {
        if (!loading && !user) {
            router.push('/sign-in');
        }
    }, [user, loading, router]);
    
    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">
            <div className="animate-pulse">Loading...</div>
        </div>;
    }
    
    if (!user) {
        return null; // Will redirect via useEffect
    }
    
    return (
        <Tracker />
    );
}