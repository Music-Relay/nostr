"use client";

import React, { useEffect, useState } from 'react';
import { nip19 } from 'nostr-tools';
import NDK from '@nostr-dev-kit/ndk';
import { Container, Typography, Avatar, Button, Paper, Box, IconButton, Divider } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout'; // Icône pour le bouton de déconnexion

interface User {
    name: string;
    publicKey: string;
    privateKey?: string;
    about?: string;
    image?: string;
}

const fetchUserProfile = async (npub: string): Promise<User | null> => {
    const defaultRelays = [
        "wss://relay.nostromo.social",
        "wss://relay.damus.io",
        "wss://relay.primal.net",
    ];

    const ndk = new NDK({ explicitRelayUrls: defaultRelays });

    await ndk.connect().catch((error) => {
        console.error("Error connecting to NDK", error);
    });

    const kind0Filter = (pubkey: string) => ({
        kinds: [0],
        authors: [pubkey],
    });

    const searchProfil = async (query: string) => {
        let filter = {};

        if (query.startsWith("npub")) {
            const decodedNpub = nip19.decode(query);
            const pubkey = decodedNpub.data as string;
            filter = kind0Filter(pubkey);
        }

        console.log("SEARCH FILTER", filter);
        return await ndk.fetchEvent(filter);
    };

    let profilNDK = await searchProfil(npub);
    if (profilNDK != undefined) {
        const parsed = JSON.parse(profilNDK.content);
        let user: User = {
            name: parsed.name,
            publicKey: npub,
            privateKey: localStorage.getItem('privateKey') || '',
            about: parsed.about,
            image: parsed.picture,
        };

        return user;
    } else {
        return null;
    }
};

const ProfilePage: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [showFullPublicKey, setShowFullPublicKey] = useState<boolean>(false);
    const [showFullPrivateKey, setShowFullPrivateKey] = useState<boolean>(false);

    useEffect(() => {
        const publicKey = localStorage.getItem('publicKey');

        if (publicKey) {
            const fetchUserProfileData = async () => {
                const profile = await fetchUserProfile(publicKey);
                setUser(profile);
                setLoading(false);

                if (profile) {
                    console.log("User Profile:", profile);
                }
            };

            fetchUserProfileData();
        } else {
            console.error('Clé publique non trouvée dans le localStorage.');
            setLoading(false);
        }
    }, []);

    const togglePublicKeyVisibility = () => {
        setShowFullPublicKey(prevState => !prevState);
    };

    const togglePrivateKeyVisibility = () => {
        setShowFullPrivateKey(prevState => !prevState);
    };

    const handleLogout = () => {
        localStorage.clear(); // Efface le localStorage
    };

    if (loading) {
        return <Typography variant="h6" align="center">Loading profile...</Typography>;
    }

    if (!user) {
        return <Typography variant="h6" align="center">User profile not found.</Typography>;
    }

    return (
        <Container
            component={Paper}
            elevation={6}
            sx={{
                padding: 3,
                maxWidth: 400, // Largeur légèrement plus large pour mieux contenir le contenu
                margin: 'auto',
                marginTop: 4,
                bgcolor: '#f9f9f9', // Couleur de fond légère
                color: '#333', // Texte sombre pour une meilleure lisibilité
                borderRadius: 2,
                boxShadow: 3, // Ombre pour un effet de profondeur
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center' // Centrer le texte
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '100%',
                    marginBottom: 4
                }}
            >
                <Avatar
                    src={user.image}
                    alt={user.name}
                    sx={{
                        width: 120,
                        height: 120,
                        mb: 2,
                        border: '3px solid #007bff' // Bordure pour l'avatar
                    }}
                >
                    {!user.image && user.name ? user.name[0] : 'U'}
                </Avatar>
                <Typography
                    variant="h4"
                    sx={{ mb: 1 }}
                >
                    {user.name}
                </Typography>
                <Typography
                    variant="body1"
                    color="text.secondary"
                >
                    {user.about || 'No description available.'}
                </Typography>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ width: '100%', mb: 4 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    <strong>Public Key:</strong>
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ flexGrow: 1 }}>
                        {showFullPublicKey ? user.publicKey : `${user.publicKey.substring(0, 10)}...`}
                    </Typography>
                    <Button
                        variant="outlined"
                        onClick={togglePublicKeyVisibility}
                    >
                        {showFullPublicKey ? 'Hide' : 'Show'}
                    </Button>
                </Box>
                <Typography variant="subtitle1" sx={{ mt: 2 }}>
                    <strong>Private Key:</strong>
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ flexGrow: 1 }}>
                        {showFullPrivateKey ? user.privateKey : `${user.privateKey?.substring(0, 10)}...`}
                    </Typography>
                    <Button
                        variant="outlined"
                        onClick={togglePrivateKeyVisibility}
                    >
                        {showFullPrivateKey ? 'Hide' : 'Show'}
                    </Button>
                </Box>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Button
                variant="contained"
                color="primary"
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
                component="a"
                href="/login"
                sx={{
                    width: '100%',
                    mt: 2,
                    textAlign: 'center',
                    padding: 1.5
                }}
            >
                Log out
            </Button>
        </Container>
    );
};

export default ProfilePage;
