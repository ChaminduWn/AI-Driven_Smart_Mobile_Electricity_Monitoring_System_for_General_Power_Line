import { createTheme } from '@mui/material/styles';

const darkAccent = '#0A0A0A'; // Sidebar deep black
const primaryBrand = '#0066FF'; // Bright electric blue

export const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: primaryBrand,
        },
        secondary: {
            main: '#FF9500', // Warning/Alert orange
        },
        background: {
            default: '#F5F7FA', // Soft slate-gray backing for dashboard
            paper: '#FFFFFF',
        },
        success: {
            main: '#34C759',
        },
        error: {
            main: '#FF3B30',
        },
        darkAccent: {
            main: darkAccent,
        }
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: { fontWeight: 700 },
        h2: { fontWeight: 600 },
        h3: { fontWeight: 600 },
        h4: { fontWeight: 600 },
        h5: { fontWeight: 600 },
        body1: { fontSize: '1rem' },
        button: { textTransform: 'none', fontWeight: 600 }
    },
    shape: {
        borderRadius: 12
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    padding: '8px 16px',
                }
            }
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                    border: '1px solid rgba(0,0,0,0.04)',
                }
            }
        }
    }
});
