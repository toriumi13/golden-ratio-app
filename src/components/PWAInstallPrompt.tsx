import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text, Portal, Dialog } from 'react-native-paper';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        const handler = (e: Event) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            // Show our custom install prompt after a delay
            setTimeout(() => setShowPrompt(true), 3000);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        // Clear the deferredPrompt
        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        // Show again after 7 days
        localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
    };

    // Don't show if dismissed recently
    useEffect(() => {
        const dismissed = localStorage.getItem('pwa-prompt-dismissed');
        if (dismissed) {
            const daysSince = (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60 * 24);
            if (daysSince < 7) {
                setShowPrompt(false);
            }
        }
    }, []);

    if (!showPrompt || !deferredPrompt) return null;

    return (
        <Portal>
            <Dialog visible={showPrompt} onDismiss={handleDismiss} style={styles.dialog}>
                <Dialog.Title style={styles.title}>📱 ホーム画面に追加</Dialog.Title>
                <Dialog.Content>
                    <Text style={styles.content}>
                        このアプリをホーム画面に追加すると、いつでも素早くアクセスできます。
                    </Text>
                </Dialog.Content>
                <Dialog.Actions>
                    <Button onPress={handleDismiss} textColor="#888">
                        後で
                    </Button>
                    <Button
                        onPress={handleInstall}
                        mode="contained"
                        style={styles.installButton}
                    >
                        追加する
                    </Button>
                </Dialog.Actions>
            </Dialog>
        </Portal>
    );
}

const styles = StyleSheet.create({
    dialog: {
        backgroundColor: '#fff',
        borderRadius: 20,
    },
    title: {
        color: '#4E342E',
        fontWeight: 'bold',
    },
    content: {
        color: '#5D4037',
        lineHeight: 22,
    },
    installButton: {
        backgroundColor: '#B8860B',
    },
});
