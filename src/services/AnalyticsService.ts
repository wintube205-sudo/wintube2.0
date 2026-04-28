import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

let clickBuffer: any[] = [];
let bufferTimer: any = null;
let currentTab = 'home';

export const setAnalyticsTab = (tab: string) => {
    currentTab = tab;
};

export const initAnalytics = (userId: string | null) => {
    const handleClick = (e: MouseEvent) => {
        const x = e.clientX;
        const y = e.clientY;
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const path = currentTab;

        clickBuffer.push({
            x, y, screenWidth, screenHeight, path, timestamp: new Date().getTime(), userId
        });

        if (!bufferTimer) {
            bufferTimer = setTimeout(flushClicks, 5000); // flush every 5s
        }
    };

    const flushClicks = async () => {
        if (clickBuffer.length === 0) return;
        const batch = [...clickBuffer];
        clickBuffer = [];
        bufferTimer = null;

        try {
            await addDoc(collection(db, 'analytics'), {
                type: 'clicks',
                data: JSON.stringify(batch),
                createdAt: serverTimestamp()
            });
        } catch(e) {
            console.error('Failed to log clicks', e);
        }
    };

    window.addEventListener('click', handleClick);

    const handleVisibility = () => {
        if (document.visibilityState === 'hidden') {
            flushClicks();
            addDoc(collection(db, 'analytics'), {
                type: 'exit',
                path: currentTab,
                userId: userId || 'anonymous',
                createdAt: serverTimestamp()
            }).catch(console.error);
        }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
        window.removeEventListener('click', handleClick);
        document.removeEventListener('visibilitychange', handleVisibility);
        if (bufferTimer) clearTimeout(bufferTimer);
        flushClicks();
    };
};
